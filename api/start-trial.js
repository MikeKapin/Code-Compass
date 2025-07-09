// Save this as api/start-trial.js
import crypto from 'crypto';

// Simple in-memory storage (shared with check-trial.js in theory, but will reset)
let trials = {};

const hashDeviceId = (deviceId) => {
  return crypto.createHash('sha256').update(deviceId).digest('hex');
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.body;
    
    // Validate input
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    const hashedDeviceId = hashDeviceId(deviceId);
    
    // Check if trial already exists
    if (trials[hashedDeviceId]) {
      const existingTrial = trials[hashedDeviceId];
      const now = new Date();
      const trialStart = new Date(existingTrial.startDate);
      const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 7 - daysPassed);
      
      return res.json({
        trialUsed: true,
        trialActive: daysRemaining > 0,
        daysRemaining: daysRemaining,
        startDate: existingTrial.startDate,
        status: daysRemaining > 0 ? 'active' : 'expired',
        message: 'Trial already exists for this device'
      });
    }

    // Create trial record with current date/time
    const startDate = new Date();
    const trialRecord = {
      deviceId: hashedDeviceId,
      startDate: startDate,
      status: 'active',
      createdAt: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    trials[hashedDeviceId] = trialRecord;

    console.log(`New trial started: ${hashedDeviceId.slice(0, 8)}...`);

    // Return trial status in the format the frontend expects
    return res.json({
      trialUsed: true,
      trialActive: true,
      daysRemaining: 7,
      startDate: startDate.toISOString(),
      status: 'active',
      message: 'Trial started successfully',
      eligible: false // No longer eligible since trial is now used
    });

  } catch (error) {
    console.error('Trial start error:', error);
    return res.status(500).json({ 
      error: 'Failed to start trial',
      trialUsed: true 
    });
  }
}