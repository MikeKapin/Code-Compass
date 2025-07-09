// Save this as api/check-trial.js
import crypto from 'crypto';

// Simple in-memory storage (will reset on each deployment, but good for testing)
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
      return res.status(400).json({ 
        error: 'Invalid device ID',
        trialUsed: true 
      });
    }

    const hashedDeviceId = hashDeviceId(deviceId);
    const existingTrial = trials[hashedDeviceId];
    
    if (existingTrial) {
      const now = new Date();
      const trialStart = new Date(existingTrial.startDate);
      const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 7 - daysPassed);
      
      return res.json({
        trialUsed: true,
        trialActive: daysRemaining > 0,
        daysRemaining: daysRemaining,
        startDate: existingTrial.startDate,
        status: daysRemaining > 0 ? 'active' : 'expired'
      });
    }

    // Device is eligible for trial
    return res.json({
      trialUsed: false,
      trialActive: false,
      eligible: true,
      message: 'Eligible for trial'
    });

  } catch (error) {
    console.error('Trial check error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      trialUsed: true 
    });
  }
}