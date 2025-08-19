// Netlify Functions version of auth endpoint
import pkg from 'pg';
const { Client } = pkg;

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const path = event.path;
    const action = path.split('/').pop(); // Get the last part of the path

    switch (action) {
      case 'simple-auth':
        return await handleSimpleAuth(event, headers);
      case 'simple-login':
        return await handleSimpleLogin(event, headers);
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' }),
        };
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};

async function handleSimpleAuth(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let client;
  try {
    const { email, password, deviceInfo } = JSON.parse(event.body);
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'validation_error',
          message: 'Email and password are required' 
        }),
      };
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
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'user_exists',
          message: 'An account with this email already exists. Please sign in instead.'
        }),
      };
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

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        user: {
          id: newUser.id,
          email: newUser.email,
          hasAccess: false
        },
        token: token
      }),
    };

  } catch (error) {
    console.error('Simple auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Registration failed: ' + error.message
      }),
    };
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

async function handleSimpleLogin(event, headers) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let client;
  try {
    const { email, password, deviceInfo } = JSON.parse(event.body);
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'validation_error',
          message: 'Email and password are required' 
        }),
      };
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
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'invalid_credentials',
          message: 'Invalid email or password'
        }),
      };
    }

    const user = userResult.rows[0];

    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password_hash);

    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'invalid_credentials',
          message: 'Invalid email or password'
        }),
      };
    }

    const subscriptionResult = await client.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [user.id, 'active']
    );

    let hasAccess = subscriptionResult.rows.length > 0;
    const subscription = subscriptionResult.rows[0] || null;
    
    // Developer account access - unlimited lifetime subscriptions
    if (email.toLowerCase() === 'm_kapin@outlook.com' || email.toLowerCase() === 'b_sharp@fanshawec.ca') {
      hasAccess = true;
      console.log('Granting unlimited developer access to:', email);
      
      // Create/update unlimited subscription for developer accounts
      if (!subscription) {
        const currentDate = new Date();
        const unlimitedDate = new Date('2099-12-31T23:59:59Z'); // Far future date
        
        await client.query(`
          INSERT INTO subscriptions 
          (user_id, status, plan, stripe_customer_id, stripe_subscription_id, 
           current_period_start, current_period_end, amount, currency, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            status = EXCLUDED.status,
            plan = EXCLUDED.plan,
            current_period_end = EXCLUDED.current_period_end,
            updated_at = NOW()
        `, [
          user.id,
          'active',
          'lifetime',
          `dev_cus_${user.id}`,
          `dev_sub_${user.id}`,
          currentDate,
          unlimitedDate,
          0, // Free for developers
          'usd'
        ]);
        
        // Re-fetch subscription data
        const updatedSubscriptionResult = await client.query(
          'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
          [user.id, 'active']
        );
        subscription = updatedSubscriptionResult.rows[0];
        
        console.log('Created lifetime developer subscription for', email, 'with expiry:', unlimitedDate);
      }
    }

    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
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
      }),
    };

  } catch (error) {
    console.error('Simple login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Login failed: ' + error.message
      }),
    };
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