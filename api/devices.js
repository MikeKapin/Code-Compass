// Consolidated device management endpoints
import { deviceQueries, sessionQueries } from './lib/db.js';
import { request, errors, success } from './lib/auth.js';

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL to determine endpoint
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1]; // Last part

  // Get session token
  let sessionToken = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionToken = authHeader.substring(7);
  }

  if (!sessionToken) {
    return res.status(401).json(errors.invalidToken());
  }

  // Find session to get user ID
  const session = await sessionQueries.findByToken(sessionToken);
  if (!session) {
    return res.status(401).json(errors.invalidToken());
  }

  try {
    if (action === 'list') {
      return await handleListDevices(req, res, session);
    } else if (pathParts.includes('remove')) {
      // Handle /api/devices/remove/{deviceId}
      const deviceId = pathParts[pathParts.length - 1];
      return await handleRemoveDevice(req, res, session, deviceId);
    } else {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Device handler error:', error);
    return res.status(500).json(errors.serverError());
  }
}

// List user devices
async function handleListDevices(req, res, session) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const devices = await deviceQueries.getUserDevices(session.user_id);

    const deviceList = devices.map(device => ({
      id: device.id,
      name: device.device_name,
      browser: device.browser,
      os: device.os,
      fingerprint: device.device_fingerprint.substring(0, 8) + '...', // Partial for security
      lastActive: device.last_active_at,
      registeredAt: device.created_at,
      isCurrent: device.id === session.device_id
    }));

    const response = success.generic('Devices retrieved successfully', {
      devices: deviceList,
      deviceCount: devices.length,
      maxDevices: 3,
      canAddMore: devices.length < 3
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('List devices error:', error);
    return res.status(500).json(errors.serverError('Failed to retrieve devices'));
  }
}

// Remove device
async function handleRemoveDevice(req, res, session, deviceId) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!deviceId || deviceId === 'remove') {
      return res.status(400).json(errors.validationError(['Device ID is required']));
    }

    // Check if removing current device
    if (deviceId === session.device_id) {
      await sessionQueries.deleteUserSessions(session.user_id);
    }

    // Remove the device
    const removedDevice = await deviceQueries.removeDevice(session.user_id, deviceId);
    
    if (!removedDevice) {
      return res.status(404).json({
        error: 'device_not_found',
        message: 'Device not found or does not belong to this user'
      });
    }

    const response = success.generic('Device removed successfully', {
      removedDevice: {
        id: removedDevice.id,
        name: removedDevice.device_name
      },
      wasCurrentDevice: deviceId === session.device_id
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('Remove device error:', error);
    return res.status(500).json(errors.serverError('Failed to remove device'));
  }
}