// Simple login endpoint using raw postgres connection
import pkg from 'pg';
const { Client } = pkg;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    // Parse request body
    const { email, password, deviceInfo } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'validation_error',
        message: 'Email and password are required' 
      });
    }

    // Create postgres client
    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    await client.connect();
    console.log('Database connected successfully for login');

    // Find user by email
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

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    // Check subscription status
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

    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
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
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    
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