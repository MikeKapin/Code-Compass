import { getStore } from '@netlify/blobs';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    const analyticsEvent = JSON.parse(event.body);
    console.log('Analytics event received:', analyticsEvent);

    // Store event in Netlify Blobs
    const store = getStore('analytics');

    // Generate unique ID for this event
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store individual event
    await store.set(eventId, JSON.stringify(analyticsEvent));

    // Update daily aggregate
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyKey = `daily_${today}`;

    let dailyData = {};
    try {
      const existing = await store.get(dailyKey);
      if (existing) {
        dailyData = JSON.parse(existing);
      }
    } catch (e) {
      // No existing data, start fresh
    }

    // Initialize daily stats if needed
    if (!dailyData.date) {
      dailyData = {
        date: today,
        pageViews: 0,
        searches: 0,
        subscriptionAttempts: 0,
        uniqueUsers: new Set(),
        events: []
      };
    } else {
      // Convert uniqueUsers array back to Set
      dailyData.uniqueUsers = new Set(dailyData.uniqueUsers || []);
    }

    // Update stats based on event type
    if (analyticsEvent.event === 'page_view') {
      dailyData.pageViews++;
    } else if (analyticsEvent.event === 'search_performed') {
      dailyData.searches++;
    } else if (analyticsEvent.event === 'subscription_attempt') {
      dailyData.subscriptionAttempts++;
    }

    // Track unique users
    if (analyticsEvent.userId) {
      dailyData.uniqueUsers.add(analyticsEvent.userId);
    }

    // Add event summary (keep last 100)
    if (!Array.isArray(dailyData.events)) {
      dailyData.events = [];
    }
    dailyData.events.push({
      event: analyticsEvent.event,
      timestamp: analyticsEvent.timestamp,
      userId: analyticsEvent.userId
    });
    if (dailyData.events.length > 100) {
      dailyData.events = dailyData.events.slice(-100);
    }

    // Convert Set to Array for JSON storage
    const dataToStore = {
      ...dailyData,
      uniqueUsers: Array.from(dailyData.uniqueUsers),
      uniqueUserCount: dailyData.uniqueUsers.size
    };

    await store.set(dailyKey, JSON.stringify(dataToStore));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Analytics event recorded',
        eventId
      }),
    };
  } catch (error) {
    console.error('Analytics error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Analytics recording failed: ' + error.message
      }),
    };
  }
};
