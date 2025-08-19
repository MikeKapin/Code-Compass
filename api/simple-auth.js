// Simple authentication endpoint using raw postgres connection
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
    console.log('Database connected successfully');

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

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 12);

    // Create user
    const createUserResult = await client.query(
      'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id, email, created_at',
      [email.toLowerCase(), hashedPassword]
    );

    const newUser = createUserResult.rows[0];

    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { 
        userId: newUser.id, 
        email: newUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        hasAccess: false // Default for new users
      },
      token: token
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Environment check:', {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      postgresUrlPrefix: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 20) + '...' : 'none'
    });
    
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