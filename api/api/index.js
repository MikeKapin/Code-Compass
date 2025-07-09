// Server-side API endpoints for trial protection
// Use with Express.js + your preferred database (MongoDB, PostgreSQL, etc.)

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://codecompass-eq2ueil4l-mike-kapins-projects.vercel.app/', 'https://codecompass.ninja'], // Your actual domains
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting to prevent abuse
const trialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: { error: 'Too many trial requests' }
});

// Database schema (example for MongoDB/Mongoose)
const TrialSchema = {
  deviceId: String,
  ipAddress: String,
  userAgent: String,
  fingerprint: Object,
  startDate: Date,
  status: String, // 'active', 'expired', 'converted'
  lastChecked: Date,
  createdAt: Date,
  metadata: Object
};

// In-memory storage for demo (replace with your database)
let trialDatabase = new Map();
let subscriptionDatabase = new Map();

// Utility functions
const hashDeviceId = (deviceId) => {
  return crypto.createHash('sha256').update(deviceId).digest('hex');
};

const isValidDeviceId = (deviceId) => {
  return typeof deviceId === 'string' && deviceId.length >= 8 && deviceId.length <= 64;
};

const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
};

// API Endpoints

// 1. Check if device is eligible for trial
app.post('/api/check-trial', trialLimiter, async (req, res) => {
  try {
    const { deviceId, timestamp } = req.body;
    
    // Validate input
    if (!isValidDeviceId(deviceId)) {
      return res.status(400).json({ 
        error: 'Invalid device ID',
        trialUsed: true // Fail safe - block invalid requests
      });
    }

    const hashedDeviceId = hashDeviceId(deviceId);
    const clientIP = getClientIP(req);
    
    // Check if device has used trial
    const existingTrial = trialDatabase.get(hashedDeviceId);
    
    if (existingTrial) {
      const now = new Date();
      const trialStart = new Date(existingTrial.startDate);
      const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 7 - daysPassed);
      
      // Update last checked
      existingTrial.lastChecked = now;
      trialDatabase.set(hashedDeviceId, existingTrial);
      
      return res.json({
        trialUsed: true,
        trialActive: daysRemaining > 0,
        daysRemaining: daysRemaining,
        startDate: existingTrial.startDate,
        status: daysRemaining > 0 ? 'active' : 'expired'
      });
    }

    // Check for IP-based trials (prevent multiple trials from same location)
    const ipTrials = Array.from(trialDatabase.values())
      .filter(trial => trial.ipAddress === clientIP);
    
    if (ipTrials.length >= 3) { // Max 3 trials per IP
      return res.json({
        trialUsed: true,
        trialActive: false,
        daysRemaining: 0,
        message: 'Trial limit reached for this location'
      });
    }

    // Device is eligible for trial
    res.json({
      trialUsed: false,
      trialActive: false,
      eligible: true,
      message: 'Eligible for trial'
    });

  } catch (error) {
    console.error('Trial check error:', error);
    res.status(500).json({ 
      error: 'Server error',
      trialUsed: true // Fail safe
    });
  }
});

// 2. Start a new trial
app.post('/api/start-trial', trialLimiter, async (req, res) => {
  try {
    const { deviceId, startDate, version, checksum } = req.body;
    
    // Validate input
    if (!isValidDeviceId(deviceId) || !startDate) {
      return res.status(400).json({ error: 'Invalid trial data' });
    }

    const hashedDeviceId = hashDeviceId(deviceId);
    const clientIP = getClientIP(req);
    
    // Check if trial already exists
    if (trialDatabase.has(hashedDeviceId)) {
      return res.status(409).json({ 
        error: 'Trial already exists for this device',
        trialUsed: true
      });
    }

    // Create trial record
    const trialRecord = {
      deviceId: hashedDeviceId, // Store hashed version
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'],
      startDate: new Date(startDate),
      status: 'active',
      lastChecked: new Date(),
      createdAt: new Date(),
      version: version || '1.0',
      checksum: checksum,
      metadata: {
        referrer: req.headers.referer,
        acceptLanguage: req.headers['accept-language']
      }
    };

    trialDatabase.set(hashedDeviceId, trialRecord);

    // Log for analytics
    console.log(`New trial started: ${hashedDeviceId.slice(0, 8)}... from ${clientIP}`);

    res.json({
      success: true,
      message: 'Trial started successfully',
      trialId: hashedDeviceId.slice(0, 8),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

  } catch (error) {
    console.error('Trial start error:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
});

// 3. Verify subscription status
app.post('/api/verify-subscription', async (req, res) => {
  try {
    const { deviceId, subscriptionId, email } = req.body;
    
    if (!isValidDeviceId(deviceId)) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    const hashedDeviceId = hashDeviceId(deviceId);
    
    // Check subscription database
    const subscription = subscriptionDatabase.get(subscriptionId) || 
                        subscriptionDatabase.get(email);
    
    if (subscription && subscription.status === 'active') {
      // Mark trial as converted
      const trial = trialDatabase.get(hashedDeviceId);
      if (trial) {
        trial.status = 'converted';
        trial.subscriptionId = subscriptionId;
        trialDatabase.set(hashedDeviceId, trial);
      }

      return res.json({
        subscriptionActive: true,
        subscriptionId: subscription.id,
        expiresAt: subscription.expiresAt,
        plan: subscription.plan
      });
    }

    res.json({ subscriptionActive: false });

  } catch (error) {
    console.error('Subscription verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 4. Webhook for Stripe subscription events
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      
      // Store subscription
      subscriptionDatabase.set(subscription.id, {
        id: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan: subscription.items.data[0].price.nickname || 'annual',
        amount: subscription.items.data[0].price.unit_amount,
        createdAt: new Date()
      });
      
      console.log(`Subscription ${subscription.status}: ${subscription.id}`);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      subscriptionDatabase.delete(deletedSub.id);
      console.log(`Subscription cancelled: ${deletedSub.id}`);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// 5. Analytics endpoint for tracking trial conversions
app.get('/api/analytics/trials', async (req, res) => {
  try {
    // Basic analytics (add authentication for production)
    const trials = Array.from(trialDatabase.values());
    const now = new Date();
    
    const stats = {
      totalTrials: trials.length,
      activeTrials: trials.filter(t => {
        const daysPassed = Math.floor((now - new Date(t.startDate)) / (1000 * 60 * 60 * 24));
        return daysPassed < 7 && t.status === 'active';
      }).length,
      expiredTrials: trials.filter(t => {
        const daysPassed = Math.floor((now - new Date(t.startDate)) / (1000 * 60 * 60 * 24));
        return daysPassed >= 7 && t.status !== 'converted';
      }).length,
      convertedTrials: trials.filter(t => t.status === 'converted').length,
      conversionRate: trials.length > 0 ? 
        (trials.filter(t => t.status === 'converted').length / trials.length * 100).toFixed(2) : 0
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Analytics error' });
  }
});

// 6. Cleanup expired trials (run daily)
const cleanupExpiredTrials = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (const [deviceId, trial] of trialDatabase.entries()) {
    if (new Date(trial.createdAt) < thirtyDaysAgo && trial.status !== 'converted') {
      trialDatabase.delete(deviceId);
    }
  }
  
  console.log(`Cleanup completed. Trials remaining: ${trialDatabase.size}`);
};

// Run cleanup daily
setInterval(cleanupExpiredTrials, 24 * 60 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    trialsActive: trialDatabase.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Trial Protection API running on port ${PORT}`);
  console.log(`🔒 Endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;