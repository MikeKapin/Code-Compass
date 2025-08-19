// Database utilities for Vercel Postgres
import { sql } from '@vercel/postgres';

// Database connection wrapper with error handling
export async function query(text, params = []) {
  try {
    console.log('Executing query:', text);
    console.log('Environment check:', {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasPostgresUrlNoSsl: !!process.env.POSTGRES_URL_NO_SSL,
      hasPostgresHost: !!process.env.POSTGRES_HOST
    });
    
    const result = await sql.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// User management functions
export const userQueries = {
  // Create new user
  async createUser(email, passwordHash) {
    const result = await query(`
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, created_at
    `, [email, passwordHash]);
    
    return result.rows[0];
  },

  // Find user by email
  async findByEmail(email) {
    const result = await query(`
      SELECT id, email, password_hash, created_at, last_login_at, email_verified
      FROM users 
      WHERE email = $1
    `, [email]);
    
    return result.rows[0];
  },

  // Find user by ID
  async findById(userId) {
    const result = await query(`
      SELECT id, email, created_at, last_login_at, email_verified
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    return result.rows[0];
  },

  // Update user's last login
  async updateLastLogin(userId) {
    await query(`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE id = $1
    `, [userId]);
  }
};

// Subscription management functions
export const subscriptionQueries = {
  // Create subscription
  async createSubscription(userId, subscriptionData) {
    const {
      stripeCustomerId,
      stripeSubscriptionId,
      plan = 'annual',
      amountPaid,
      startsAt,
      expiresAt
    } = subscriptionData;

    const result = await query(`
      INSERT INTO subscriptions (
        user_id, stripe_customer_id, stripe_subscription_id, 
        plan, amount_paid, starts_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, stripeCustomerId, stripeSubscriptionId, plan, amountPaid, startsAt, expiresAt]);
    
    return result.rows[0];
  },

  // Get user's active subscription
  async getActiveSubscription(userId) {
    const result = await query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 
        AND status = 'active' 
        AND expires_at > NOW()
      ORDER BY expires_at DESC
      LIMIT 1
    `, [userId]);
    
    return result.rows[0];
  },

  // Update subscription
  async updateSubscription(subscriptionId, updateData) {
    const { status, expiresAt } = updateData;
    
    const result = await query(`
      UPDATE subscriptions 
      SET status = COALESCE($2, status),
          expires_at = COALESCE($3, expires_at),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [subscriptionId, status, expiresAt]);
    
    return result.rows[0];
  }
};

// Device management functions
export const deviceQueries = {
  // Register new device
  async registerDevice(userId, deviceData) {
    const { fingerprint, name, browser, os } = deviceData;
    
    const result = await query(`
      INSERT INTO devices (user_id, device_fingerprint, device_name, browser, os)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, device_fingerprint) 
      DO UPDATE SET 
        last_active_at = NOW(),
        device_name = EXCLUDED.device_name,
        browser = EXCLUDED.browser,
        os = EXCLUDED.os
      RETURNING *
    `, [userId, fingerprint, name, browser, os]);
    
    return result.rows[0];
  },

  // Get user's devices
  async getUserDevices(userId) {
    const result = await query(`
      SELECT id, device_fingerprint, device_name, browser, os, 
             last_active_at, created_at
      FROM devices 
      WHERE user_id = $1
      ORDER BY last_active_at DESC
    `, [userId]);
    
    return result.rows;
  },

  // Remove device
  async removeDevice(userId, deviceId) {
    const result = await query(`
      DELETE FROM devices 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [deviceId, userId]);
    
    return result.rows[0];
  },

  // Check device count
  async getDeviceCount(userId) {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM devices 
      WHERE user_id = $1
    `, [userId]);
    
    return parseInt(result.rows[0].count);
  },

  // Update device activity
  async updateDeviceActivity(deviceId) {
    await query(`
      UPDATE devices 
      SET last_active_at = NOW() 
      WHERE id = $1
    `, [deviceId]);
  }
};

// Session management functions
export const sessionQueries = {
  // Create session
  async createSession(userId, deviceId, sessionToken, expiresAt) {
    const result = await query(`
      INSERT INTO user_sessions (user_id, device_id, session_token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, deviceId, sessionToken, expiresAt]);
    
    return result.rows[0];
  },

  // Find session by token
  async findByToken(sessionToken) {
    const result = await query(`
      SELECT us.*, u.email, d.device_name, d.device_fingerprint
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      JOIN devices d ON us.device_id = d.id
      WHERE us.session_token = $1 
        AND us.expires_at > NOW()
    `, [sessionToken]);
    
    return result.rows[0];
  },

  // Delete session
  async deleteSession(sessionToken) {
    await query(`
      DELETE FROM user_sessions 
      WHERE session_token = $1
    `, [sessionToken]);
  },

  // Delete all user sessions (logout from all devices)
  async deleteUserSessions(userId) {
    await query(`
      DELETE FROM user_sessions 
      WHERE user_id = $1
    `, [userId]);
  },

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    const result = await query(`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `);
    
    return result.rowCount;
  },

  // Update session last used
  async updateLastUsed(sessionToken) {
    await query(`
      UPDATE user_sessions 
      SET last_used_at = NOW() 
      WHERE session_token = $1
    `, [sessionToken]);
  }
};

// Search logging functions
export const searchQueries = {
  // Log search
  async logSearch(userId, deviceId, query, resultsCount, searchType = 'csa_code') {
    const result = await query(`
      INSERT INTO search_logs (user_id, device_id, search_query, results_count, search_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, deviceId, query, resultsCount, searchType]);
    
    return result.rows[0];
  },

  // Get user search stats
  async getUserSearchStats(userId, days = 30) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_searches,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(results_count) as avg_results
      FROM search_logs 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '${days} days'
    `, [userId]);
    
    return result.rows[0];
  }
};

// Migration functions
export const migrationQueries = {
  // Create migration record
  async createMigration(userId, migrationData) {
    const { legacyEmail, legacySubscriptionId, migrationType, data } = migrationData;
    
    const result = await query(`
      INSERT INTO migrations (user_id, legacy_email, legacy_subscription_id, migration_type, migration_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, legacyEmail, legacySubscriptionId, migrationType, JSON.stringify(data)]);
    
    return result.rows[0];
  },

  // Find migration by legacy email
  async findByLegacyEmail(email) {
    const result = await query(`
      SELECT * FROM migrations 
      WHERE legacy_email = $1
    `, [email]);
    
    return result.rows[0];
  }
};

// Database health check
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as timestamp, version() as version');
    return {
      healthy: true,
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

// Initialize database (run schema if needed)
export async function initializeDatabase() {
  try {
    // Check if users table exists
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    return {
      initialized: result.rows[0].exists,
      message: result.rows[0].exists ? 'Database already initialized' : 'Database needs initialization'
    };
  } catch (error) {
    console.error('Database initialization check failed:', error);
    return {
      initialized: false,
      error: error.message
    };
  }
}