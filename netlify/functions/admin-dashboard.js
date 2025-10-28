import { getStore } from '@netlify/blobs';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const store = getStore('analytics');

    // Get last 30 days of data
    const dailyStats = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dailyKey = `daily_${dateStr}`;

      try {
        const data = await store.get(dailyKey);
        if (data) {
          const parsed = JSON.parse(data);
          dailyStats.push(parsed);
        } else {
          // No data for this day
          dailyStats.push({
            date: dateStr,
            pageViews: 0,
            searches: 0,
            subscriptionAttempts: 0,
            uniqueUserCount: 0,
            events: []
          });
        }
      } catch (e) {
        // Error reading this day, add empty data
        dailyStats.push({
          date: dateStr,
          pageViews: 0,
          searches: 0,
          subscriptionAttempts: 0,
          uniqueUserCount: 0,
          events: []
        });
      }
    }

    // Calculate totals and trends
    const last7Days = dailyStats.slice(0, 7);
    const previous7Days = dailyStats.slice(7, 14);

    const totals = {
      last7Days: {
        pageViews: last7Days.reduce((sum, day) => sum + (day.pageViews || 0), 0),
        searches: last7Days.reduce((sum, day) => sum + (day.searches || 0), 0),
        subscriptionAttempts: last7Days.reduce((sum, day) => sum + (day.subscriptionAttempts || 0), 0),
        uniqueUsers: new Set(last7Days.flatMap(day => day.uniqueUsers || [])).size
      },
      previous7Days: {
        pageViews: previous7Days.reduce((sum, day) => sum + (day.pageViews || 0), 0),
        searches: previous7Days.reduce((sum, day) => sum + (day.searches || 0), 0),
        subscriptionAttempts: previous7Days.reduce((sum, day) => sum + (day.subscriptionAttempts || 0), 0),
        uniqueUsers: new Set(previous7Days.flatMap(day => day.uniqueUsers || [])).size
      }
    };

    // Calculate percentage changes
    const changes = {
      pageViews: calculateChange(totals.last7Days.pageViews, totals.previous7Days.pageViews),
      searches: calculateChange(totals.last7Days.searches, totals.previous7Days.searches),
      subscriptionAttempts: calculateChange(totals.last7Days.subscriptionAttempts, totals.previous7Days.subscriptionAttempts),
      uniqueUsers: calculateChange(totals.last7Days.uniqueUsers, totals.previous7Days.uniqueUsers)
    };

    // Get today's stats
    const todayStats = dailyStats[0] || {
      pageViews: 0,
      searches: 0,
      subscriptionAttempts: 0,
      uniqueUserCount: 0
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          today: todayStats,
          last7Days: totals.last7Days,
          previous7Days: totals.previous7Days,
          changes,
          dailyStats: dailyStats.reverse(), // Oldest first for charts
          lastUpdated: new Date().toISOString()
        }
      }),
    };
  } catch (error) {
    console.error('Admin dashboard error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to retrieve analytics data: ' + error.message
      }),
    };
  }
};

function calculateChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}
