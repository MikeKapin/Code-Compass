// Payment webhook endpoint for Netlify
import pkg from 'pg';
const { Client } = pkg;

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let client;
  try {
    const { email, sessionId, customerId, subscriptionType = 'annual' } = JSON.parse(event.body);
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Email is required' 
        }),
      };
    }

    console.log('Payment webhook received:', { email, sessionId, subscriptionType });

    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    // Find or create user
    let userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let userId;
    if (userResult.rows.length === 0) {
      const createUserResult = await client.query(
        'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [email.toLowerCase(), 'placeholder_hash']
      );
      userId = createUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Create or update subscription
    const existingSubscription = await client.query(
      'SELECT id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (existingSubscription.rows.length > 0) {
      await client.query(`
        UPDATE subscriptions 
        SET status = $2, plan = $3, current_period_end = $4, updated_at = NOW()
        WHERE user_id = $1
      `, [
        userId,
        'active',
        subscriptionType,
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      ]);
    } else {
      await client.query(`
        INSERT INTO subscriptions 
        (user_id, status, plan, stripe_customer_id, stripe_subscription_id, 
         current_period_start, current_period_end, amount, currency, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        userId,
        'active',
        subscriptionType,
        customerId || `cus_${Date.now()}`,
        sessionId || `sub_${Date.now()}`,
        new Date(),
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        7900,
        'usd'
      ]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Payment processed and subscription activated',
        userId,
        hasAccess: true
      }),
    };

  } catch (error) {
    console.error('Payment webhook error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Payment processing failed',
        message: error.message
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
};