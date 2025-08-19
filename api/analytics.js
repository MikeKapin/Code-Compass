// Simple analytics endpoint to prevent 404 errors
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

  try {
    // For now, just log analytics events and return success
    console.log('Analytics event:', req.body);
    
    return res.status(200).json({
      success: true,
      message: 'Analytics event recorded'
    });
  } catch (error) {
    console.error('Analytics error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Analytics recording failed'
    });
  }
}