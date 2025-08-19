// Authentication utilities for Code Compass
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days
const SESSION_EXPIRES_HOURS = 24 * 7; // 7 days in hours

// Password hashing
export const password = {
  // Hash password
  async hash(plainPassword) {
    const saltRounds = 12;
    return await bcrypt.hash(plainPassword, saltRounds);
  },

  // Verify password
  async verify(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // Validate password strength
  validate(password) {
    const errors = [];
    
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    // Optional: Add more password requirements
    // if (!/(?=.*[a-z])/.test(password)) {
    //   errors.push('Password must contain at least one lowercase letter');
    // }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Email validation
export const email = {
  validate(email) {
    const errors = [];
    
    if (!email || !email.trim()) {
      errors.push('Email is required');
      return { isValid: false, errors };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (email.length > 255) {
      errors.push('Email must be less than 255 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      normalized: email.toLowerCase().trim()
    };
  }
};

// JWT token management
export const token = {
  // Create JWT token
  create(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  },

  // Verify JWT token
  verify(token) {
    try {
      return {
        valid: true,
        payload: jwt.verify(token, JWT_SECRET)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  // Generate session token (for database storage)
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }
};

// Session management
export const session = {
  // Calculate session expiry
  getExpiryDate(hours = SESSION_EXPIRES_HOURS) {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
  },

  // Create session data
  create(userId, deviceId, sessionToken = null) {
    const sessionTokenToUse = sessionToken || token.generateSessionToken();
    const expiresAt = this.getExpiryDate();
    
    return {
      sessionToken: sessionTokenToUse,
      expiresAt,
      userId,
      deviceId
    };
  }
};

// Device fingerprinting utilities
export const device = {
  // Generate device fingerprint (server-side validation)
  generateFingerprint(userAgent, ip, additionalData = {}) {
    const data = {
      userAgent: userAgent || '',
      ip: ip || '',
      ...additionalData,
      timestamp: Date.now()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16); // Shorter fingerprint
  },

  // Parse user agent for device info
  parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        browser: 'Unknown',
        os: 'Unknown',
        deviceName: 'Unknown Device'
      };
    }

    const ua = userAgent.toLowerCase();
    
    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    
    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    // Device name
    let deviceName = 'Desktop';
    if (ua.includes('mobile')) deviceName = 'Mobile Device';
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceName = 'Tablet';
    
    return { browser, os, deviceName };
  },

  // Validate device registration data
  validateRegistration(deviceData) {
    const errors = [];
    
    if (!deviceData.fingerprint) {
      errors.push('Device fingerprint is required');
    }
    
    if (!deviceData.name || deviceData.name.length < 1) {
      errors.push('Device name is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Request validation and parsing
export const request = {
  // Parse authorization header
  parseAuthHeader(authHeader) {
    if (!authHeader) {
      return { type: null, token: null };
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return { type: null, token: null };
    }
    
    return {
      type: parts[0], // 'Bearer'
      token: parts[1]
    };
  },

  // Get client IP address
  getClientIP(request) {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  },

  // Extract and validate request data
  async parseBody(request) {
    try {
      const body = await request.json();
      return { success: true, data: body };
    } catch (error) {
      return { 
        success: false, 
        error: 'Invalid JSON in request body' 
      };
    }
  }
};

// Rate limiting utilities (basic)
export const rateLimit = {
  // Simple in-memory rate limiter (use Redis in production)
  attempts: new Map(),
  
  // Check if IP/user is rate limited
  check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 15 minutes
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(
      timestamp => (now - timestamp) < windowMs
    );
    
    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        resetTime: new Date(recentAttempts[0] + windowMs)
      };
    }
    
    return { allowed: true };
  },
  
  // Record an attempt
  record(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    userAttempts.push(now);
    this.attempts.set(key, userAttempts);
  },
  
  // Clear attempts (on successful auth)
  clear(key) {
    this.attempts.delete(key);
  }
};

// Error response helpers
export const errors = {
  // Authentication errors
  invalidCredentials() {
    return {
      error: 'invalid_credentials',
      message: 'Invalid email or password'
    };
  },

  userExists() {
    return {
      error: 'user_exists',
      message: 'An account with this email already exists'
    };
  },

  userNotFound() {
    return {
      error: 'user_not_found',
      message: 'No account found with this email'
    };
  },

  invalidToken() {
    return {
      error: 'invalid_token',
      message: 'Invalid or expired token'
    };
  },

  deviceLimitExceeded() {
    return {
      error: 'device_limit_exceeded',
      message: 'Maximum device limit (3) reached. Please remove a device first.'
    };
  },

  rateLimited(resetTime) {
    return {
      error: 'rate_limited',
      message: 'Too many attempts. Please try again later.',
      resetTime
    };
  },

  validationError(errors) {
    return {
      error: 'validation_error',
      message: 'Validation failed',
      errors
    };
  },

  serverError(message = 'Internal server error') {
    return {
      error: 'server_error',
      message
    };
  }
};

// Success response helpers
export const success = {
  // Authentication success
  authSuccess(user, token, message = 'Authentication successful') {
    return {
      success: true,
      message,
      user: {
        id: user.id,
        email: user.email
      },
      token
    };
  },

  // Registration success
  registrationSuccess(user, token) {
    return {
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email
      },
      token
    };
  },

  // Device registration success
  deviceRegistered(device) {
    return {
      success: true,
      message: 'Device registered successfully',
      device: {
        id: device.id,
        name: device.device_name,
        lastActive: device.last_active_at
      }
    };
  },

  // Generic success
  generic(message, data = {}) {
    return {
      success: true,
      message,
      ...data
    };
  }
};

// Middleware helper for authentication
export function createAuthMiddleware(db) {
  return async function authenticate(request) {
    const authHeader = request.headers.authorization;
    const { token: authToken } = request.parseAuthHeader(authHeader);
    
    if (!authToken) {
      return { authenticated: false, error: errors.invalidToken() };
    }
    
    try {
      // Find session in database
      const session = await db.sessionQueries.findByToken(authToken);
      
      if (!session) {
        return { authenticated: false, error: errors.invalidToken() };
      }
      
      // Update session last used
      await db.sessionQueries.updateLastUsed(authToken);
      
      return {
        authenticated: true,
        user: {
          id: session.user_id,
          email: session.email
        },
        device: {
          id: session.device_id,
          name: session.device_name,
          fingerprint: session.device_fingerprint
        },
        session
      };
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return { authenticated: false, error: errors.serverError() };
    }
  };
}