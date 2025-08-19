// Simple database connection test
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Testing database connection...');
    console.log('Environment variables:', {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasPostgresUrlNoSsl: !!process.env.POSTGRES_URL_NO_SSL,
      hasPostgresHost: !!process.env.POSTGRES_HOST,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
    
    // Simple query to test connection
    const result = await sql`SELECT NOW() as current_time`;
    
    return res.status(200).json({
      success: true,
      message: 'Database connected successfully',
      timestamp: result.rows[0]?.current_time,
      environmentCheck: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresUrlNoSsl: !!process.env.POSTGRES_URL_NO_SSL,
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      environmentCheck: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresUrlNoSsl: !!process.env.POSTGRES_URL_NO_SSL,
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  }
}