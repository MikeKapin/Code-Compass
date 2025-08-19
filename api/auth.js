// Consolidated authentication endpoints
import { userQueries, deviceQueries, sessionQueries, subscriptionQueries } from './lib/db.js';
import { password, email, device, session, request, rateLimit, errors, success } from './lib/auth.js';

export default async function handler(req, res) {
  console.log('Auth handler called:', req.method, req.url);
  
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse URL to determine endpoint
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1]; // Last part after /api/

  try {
    switch (action) {
      case 'register':
        return await handleRegister(req, res);
      case 'login':
        return await handleLogin(req, res);
      case 'logout':
        return await handleLogout(req, res);
      case 'me':
        return await handleMe(req, res);
      case 'simple-auth':
        return await handleSimpleAuth(req, res);
      case 'simple-login':
        return await handleSimpleLogin(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return res.status(500).json(errors.serverError());
  }
}

// Register new user
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bodyResult = await request.parseBody(req);
    if (!bodyResult.success) {
      return res.status(400).json(errors.validationError([bodyResult.error]));
    }

    const { email: userEmail, password: userPassword, deviceInfo } = bodyResult.data;

    // Rate limiting
    const clientIP = request.getClientIP(req);
    const rateLimitKey = `register:${clientIP}`;
    const rateLimitCheck = rateLimit.check(rateLimitKey, 3, 60 * 60 * 1000);
    
    if (!rateLimitCheck.allowed) {
      return res.status(429).json(errors.rateLimited(rateLimitCheck.resetTime));
    }

    // Validate email
    const emailValidation = email.validate(userEmail);
    if (!emailValidation.isValid) {
      rateLimit.record(rateLimitKey);
      return res.status(400).json(errors.validationError(emailValidation.errors));
    }

    // Validate password
    const passwordValidation = password.validate(userPassword);
    if (!passwordValidation.isValid) {
      rateLimit.record(rateLimitKey);
      return res.status(400).json(errors.validationError(passwordValidation.errors));
    }

    // Check if user already exists
    const existingUser = await userQueries.findByEmail(emailValidation.normalized);
    if (existingUser) {
      rateLimit.record(rateLimitKey);
      return res.status(409).json(errors.userExists());
    }

    // Hash password and create user
    const hashedPassword = await password.hash(userPassword);
    const newUser = await userQueries.createUser(emailValidation.normalized, hashedPassword);

    // Register device if provided
    let registeredDevice = null;
    let sessionToken = null;

    if (deviceInfo) {
      try {
        const userAgent = req.headers['user-agent'];
        const deviceDetails = device.parseUserAgent(userAgent);
        
        const deviceData = {
          fingerprint: deviceInfo.fingerprint || device.generateFingerprint(userAgent, clientIP),
          name: deviceInfo.name || deviceDetails.deviceName,
          browser: deviceDetails.browser,
          os: deviceDetails.os
        };

        const deviceValidation = device.validateRegistration(deviceData);
        if (deviceValidation.isValid) {
          registeredDevice = await deviceQueries.registerDevice(newUser.id, deviceData);
          
          // Create session
          const sessionData = session.create(newUser.id, registeredDevice.id);
          await sessionQueries.createSession(
            newUser.id, 
            registeredDevice.id, 
            sessionData.sessionToken, 
            sessionData.expiresAt
          );
          sessionToken = sessionData.sessionToken;
        }
      } catch (error) {
        console.error('Device registration failed during signup:', error);
      }
    }

    rateLimit.clear(rateLimitKey);

    const response = success.registrationSuccess(newUser, sessionToken);
    if (registeredDevice) {
      response.device = {
        id: registeredDevice.id,
        name: registeredDevice.device_name,
        registered: true
      };
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error('Registration error:', error);
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(409).json(errors.userExists());
    }
    return res.status(500).json(errors.serverError('Registration failed'));
  }
}

// Login user
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bodyResult = await request.parseBody(req);
    if (!bodyResult.success) {
      return res.status(400).json(errors.validationError([bodyResult.error]));
    }

    const { email: userEmail, password: userPassword, deviceInfo } = bodyResult.data;

    // Rate limiting
    const clientIP = request.getClientIP(req);
    const rateLimitKey = `login:${clientIP}`;
    const rateLimitCheck = rateLimit.check(rateLimitKey, 5, 15 * 60 * 1000);
    
    if (!rateLimitCheck.allowed) {
      return res.status(429).json(errors.rateLimited(rateLimitCheck.resetTime));
    }

    // Validate email
    const emailValidation = email.validate(userEmail);
    if (!emailValidation.isValid) {
      rateLimit.record(rateLimitKey);
      return res.status(400).json(errors.validationError(emailValidation.errors));
    }

    // Find user
    const user = await userQueries.findByEmail(emailValidation.normalized);
    if (!user) {
      rateLimit.record(rateLimitKey);
      return res.status(401).json(errors.invalidCredentials());
    }

    // Verify password
    const isValidPassword = await password.verify(userPassword, user.password_hash);
    if (!isValidPassword) {
      rateLimit.record(rateLimitKey);
      return res.status(401).json(errors.invalidCredentials());
    }

    // Handle device registration
    const deviceCount = await deviceQueries.getDeviceCount(user.id);
    let registeredDevice = null;
    let deviceAlreadyExists = false;

    if (deviceInfo) {
      try {
        const userAgent = req.headers['user-agent'];
        const deviceDetails = device.parseUserAgent(userAgent);
        const deviceFingerprint = deviceInfo.fingerprint || device.generateFingerprint(userAgent, clientIP);
        
        // Check existing devices
        const existingDevices = await deviceQueries.getUserDevices(user.id);
        const existingDevice = existingDevices.find(d => d.device_fingerprint === deviceFingerprint);
        
        if (existingDevice) {
          await deviceQueries.updateDeviceActivity(existingDevice.id);
          registeredDevice = existingDevice;
          deviceAlreadyExists = true;
        } else {
          // Check device limit
          if (deviceCount >= 3) {
            return res.status(403).json({
              ...errors.deviceLimitExceeded(),
              currentDevices: deviceCount,
              maxDevices: 3,
              devices: existingDevices.map(d => ({
                id: d.id,
                name: d.device_name,
                browser: d.browser,
                os: d.os,
                lastActive: d.last_active_at
              }))
            });
          }

          // Register new device
          const deviceData = {
            fingerprint: deviceFingerprint,
            name: deviceInfo.name || deviceDetails.deviceName,
            browser: deviceDetails.browser,
            os: deviceDetails.os
          };

          const deviceValidation = device.validateRegistration(deviceData);
          if (deviceValidation.isValid) {
            registeredDevice = await deviceQueries.registerDevice(user.id, deviceData);
          }
        }
      } catch (error) {
        console.error('Device registration failed during login:', error);
        if (error.message && error.message.includes('Maximum device limit')) {
          return res.status(403).json(errors.deviceLimitExceeded());
        }
      }
    }

    // Create session
    let sessionToken = null;
    if (registeredDevice) {
      try {
        const sessionData = session.create(user.id, registeredDevice.id);
        await sessionQueries.createSession(
          user.id, 
          registeredDevice.id, 
          sessionData.sessionToken, 
          sessionData.expiresAt
        );
        sessionToken = sessionData.sessionToken;
      } catch (error) {
        console.error('Session creation failed during login:', error);
        return res.status(500).json(errors.serverError('Login successful but session creation failed'));
      }
    }

    await userQueries.updateLastLogin(user.id);
    rateLimit.clear(rateLimitKey);

    const response = success.authSuccess(user, sessionToken, 'Login successful');
    if (registeredDevice) {
      response.device = {
        id: registeredDevice.id,
        name: registeredDevice.device_name,
        isNew: !deviceAlreadyExists,
        deviceCount: deviceAlreadyExists ? deviceCount : deviceCount + 1,
        maxDevices: 3
      };
    }

    if (sessionToken) {
      res.setHeader('Set-Cookie', `codecompass_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(errors.serverError('Login failed'));
  }
}

// Logout user
async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let sessionToken = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }
    
    if (!sessionToken && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('codecompass_session='));
      if (sessionCookie) {
        sessionToken = sessionCookie.split('=')[1];
      }
    }

    if (!sessionToken) {
      return res.status(401).json(errors.invalidToken());
    }

    await sessionQueries.deleteSession(sessionToken);
    res.setHeader('Set-Cookie', 'codecompass_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');

    return res.status(200).json(success.generic('Logged out successfully'));

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json(errors.serverError('Logout failed'));
  }
}

// Get current user info
async function handleMe(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let sessionToken = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }
    
    if (!sessionToken && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('codecompass_session='));
      if (sessionCookie) {
        sessionToken = sessionCookie.split('=')[1];
      }
    }

    if (!sessionToken) {
      return res.status(401).json(errors.invalidToken());
    }

    const session = await sessionQueries.findByToken(sessionToken);
    if (!session) {
      return res.status(401).json(errors.invalidToken());
    }

    await sessionQueries.updateLastUsed(sessionToken);

    const user = await userQueries.findById(session.user_id);
    if (!user) {
      return res.status(404).json(errors.userNotFound());
    }

    const subscription = await subscriptionQueries.getActiveSubscription(user.id);
    const devices = await deviceQueries.getUserDevices(user.id);

    const userProfile = {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      emailVerified: user.email_verified
    };

    const subscriptionInfo = subscription ? {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      expiresAt: subscription.expires_at,
      daysRemaining: Math.max(0, Math.ceil((new Date(subscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
    } : null;

    const deviceInfo = devices.map(device => ({
      id: device.id,
      name: device.device_name,
      browser: device.browser,
      os: device.os,
      lastActive: device.last_active_at,
      createdAt: device.created_at,
      isCurrent: device.id === session.device_id
    }));

    const response = success.generic('User profile retrieved successfully', {
      user: userProfile,
      subscription: subscriptionInfo,
      devices: deviceInfo,
      deviceCount: devices.length,
      maxDevices: 3,
      hasAccess: subscriptionInfo ? subscriptionInfo.status === 'active' : false
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json(errors.serverError('Failed to get user profile'));
  }
}

// Simple authentication handlers (consolidated from separate files)
async function handleSimpleAuth(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pkg = await import('pg');
  const { Client } = pkg;
  let client;

  try {
    const { email, password, deviceInfo } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'validation_error',
        message: 'Email and password are required' 
      });
    }

    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    // Check if user exists
    const existingUserResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'user_exists',
        message: 'An account with this email already exists. Please sign in instead.'
      });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 12);

    const createUserResult = await client.query(
      'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id, email, created_at',
      [email.toLowerCase(), hashedPassword]
    );

    const newUser = createUserResult.rows[0];

    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        hasAccess: false
      },
      token: token
    });

  } catch (error) {
    console.error('Simple auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Registration failed: ' + error.message
    });
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

async function handleSimpleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pkg = await import('pg');
  const { Client } = pkg;
  let client;

  try {
    const { email, password, deviceInfo } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'validation_error',
        message: 'Email and password are required' 
      });
    }

    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    const userResult = await client.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    const subscriptionResult = await client.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [user.id, 'active']
    );

    let hasAccess = subscriptionResult.rows.length > 0;
    const subscription = subscriptionResult.rows[0] || null;
    
    // Temporary: Give access to specific test accounts
    if (email.toLowerCase() === 'm_kapin@outlook.com' || email.toLowerCase() === 'b_sharp@fanshawec.ca') {
      hasAccess = true;
      console.log('Granting temporary access to test account:', email);
    }

    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        hasAccess: hasAccess,
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          expiresAt: subscription.current_period_end
        } : null
      },
      token: token
    });

  } catch (error) {
    console.error('Simple login error:', error);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Login failed: ' + error.message
    });
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}