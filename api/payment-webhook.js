// Payment webhook endpoint to handle Stripe payment success
import pkg from 'pg';
const { Client } = pkg;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    // For now, handle both Stripe webhooks and direct payment success notifications
    const { email, sessionId, customerId, subscriptionType = 'annual' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    console.log('Payment webhook received:', { email, sessionId, subscriptionType });

    // Create postgres client
    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    await client.connect();
    console.log('Database connected for payment webhook');

    // Find or create user
    let userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    let userId;
    if (userResult.rows.length === 0) {
      // User doesn't exist yet, create a placeholder
      const createUserResult = await client.query(
        'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [email.toLowerCase(), 'placeholder_hash'] // They'll set password when they sign up
      );
      userId = createUserResult.rows[0].id;
      console.log('Created new user for payment:', userId);
    } else {
      userId = userResult.rows[0].id;
      console.log('Found existing user for payment:', userId);
    }

    // Create or update subscription
    const subscriptionData = {
      userId,
      status: 'active',
      plan: subscriptionType,
      stripeCustomerId: customerId || `cus_${Date.now()}`,
      stripeSubscriptionId: sessionId || `sub_${Date.now()}`,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      amount: 7900, // $79.00 in cents
      currency: 'usd'
    };

    // Check if subscription already exists
    const existingSubscription = await client.query(
      'SELECT id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (existingSubscription.rows.length > 0) {
      // Update existing subscription
      await client.query(`
        UPDATE subscriptions 
        SET status = $2, plan = $3, stripe_customer_id = $4, stripe_subscription_id = $5,
            current_period_start = $6, current_period_end = $7, updated_at = NOW()
        WHERE user_id = $1
      `, [
        userId,
        subscriptionData.status,
        subscriptionData.plan,
        subscriptionData.stripeCustomerId,
        subscriptionData.stripeSubscriptionId,
        subscriptionData.currentPeriodStart,
        subscriptionData.currentPeriodEnd
      ]);
      console.log('Updated existing subscription for user:', userId);
    } else {
      // Create new subscription
      await client.query(`
        INSERT INTO subscriptions 
        (user_id, status, plan, stripe_customer_id, stripe_subscription_id, 
         current_period_start, current_period_end, amount, currency, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        userId,
        subscriptionData.status,
        subscriptionData.plan,
        subscriptionData.stripeCustomerId,
        subscriptionData.stripeSubscriptionId,
        subscriptionData.currentPeriodStart,
        subscriptionData.currentPeriodEnd,
        subscriptionData.amount,
        subscriptionData.currency
      ]);
      console.log('Created new subscription for user:', userId);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment processed and subscription activated',
      userId,
      hasAccess: true
    });

  } catch (error) {
    console.error('Payment webhook error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Payment processing failed',
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