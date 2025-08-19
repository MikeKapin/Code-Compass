// Simple endpoint to add subscription to existing user
import pkg from 'pg';
const { Client } = pkg;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    console.log('Adding subscription for user:', email);

    // Create postgres client
    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    await client.connect();
    console.log('Database connected for subscription addition');

    // Find user by email
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userId = userResult.rows[0].id;
    console.log('Found user:', userId);

    // Create active subscription
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
      userId,
      'active',
      'annual',
      `debug_cus_${Date.now()}`,
      `debug_sub_${Date.now()}`,
      new Date(),
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      7900, // $79.00
      'usd'
    ]);

    console.log('Created/updated subscription for user');

    return res.status(200).json({
      success: true,
      message: 'Subscription added successfully',
      userId,
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Add subscription error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to add subscription',
      message: error.message
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