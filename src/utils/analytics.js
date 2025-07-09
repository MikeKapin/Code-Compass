// utils/analytics.js
// Add this file for tracking user behavior and conversions

export const trackEvent = (eventName, parameters = {}) => {
  // Google Analytics 4 tracking
  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
  
  // Vercel Analytics (if using)
  if (window.va) {
    window.va('track', eventName, parameters);
  }
  
  // Console log for development
  console.log('Analytics Event:', eventName, parameters);
};

// Trial Events
export const trackTrialStarted = (email) => {
  trackEvent('trial_started', {
    method: 'email_gate',
    email_domain: email.split('@')[1],
    timestamp: new Date().toISOString()
  });
};

export const trackTrialExpired = (searchCount) => {
  trackEvent('trial_expired', {
    searches_performed: searchCount,
    conversion_opportunity: true
  });
};

export const trackSearch = (query, resultCount) => {
  trackEvent('search_performed', {
    search_term: query.toLowerCase(),
    result_count: resultCount,
    search_length: query.length
  });
};

// Conversion Events
export const trackSubscriptionAttempt = (source = 'trial_banner') => {
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: 49.99,
    source: source,
    items: [{
      item_id: 'codecompass_annual',
      item_name: 'Code Compass Annual Subscription',
      price: 49.99,
      quantity: 1
    }]
  });
};

export const trackEmailSubmission = (email) => {
  trackEvent('email_collected', {
    email_domain: email.split('@')[1],
    lead_source: 'trial_gate'
  });
};

// Abuse Detection Events
export const trackSuspiciousActivity = (type, details) => {
  trackEvent('suspicious_activity', {
    activity_type: type,
    details: details,
    timestamp: new Date().toISOString()
  });
};

// Page/Feature Usage
export const trackFeatureUsage = (feature, details = {}) => {
  trackEvent('feature_used', {
    feature_name: feature,
    ...details
  });
};