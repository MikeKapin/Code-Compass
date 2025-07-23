// utils/analytics.js
// Simple analytics tracking for CodeCompass

class Analytics {
  constructor() {
    this.isEnabled = true;
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId() {
    let userId = localStorage.getItem('codecompass_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('codecompass_user_id', userId);
    }
    return userId;
  }

  // Generic event tracking
  trackEvent(eventName, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...properties
    };

    // Log to console for now - you can replace with your analytics service
    console.log('📊 Analytics Event:', event);

    // Store events locally for debugging
    this.storeEventLocally(event);

    // Send to analytics service (implement based on your provider)
    this.sendToAnalyticsService(event);
  }

  storeEventLocally(event) {
    try {
      const events = JSON.parse(localStorage.getItem('codecompass_analytics_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('codecompass_analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store analytics event locally:', error);
    }
  }

  sendToAnalyticsService(event) {
    // Replace this with your actual analytics service
    // Examples:
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.event, event);
    }

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(event.event, event);
    }

    // Custom API endpoint
    if (this.shouldSendToAPI()) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(error => {
        console.warn('Failed to send analytics event:', error);
      });
    }
  }

  shouldSendToAPI() {
    // Only send to API in production or when specifically enabled
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }

  // Page view tracking
  trackPageView(page = window.location.pathname) {
    this.trackEvent('page_view', {
      page,
      title: document.title,
      referrer: document.referrer
    });
  }

  // User properties
  setUserProperties(properties) {
    this.trackEvent('user_properties_updated', properties);
  }
}

// Create singleton instance
const analytics = new Analytics();

// Specific tracking functions for CodeCompass

export const trackTrialStarted = (email) => {
  analytics.trackEvent('trial_started', {
    email_domain: email.split('@')[1],
    timestamp: new Date().toISOString()
  });
};

export const trackTrialExpired = (searchCount) => {
  analytics.trackEvent('trial_expired', {
    searches_performed: searchCount,
    timestamp: new Date().toISOString()
  });
};

export const trackSearch = (query, resultCount) => {
  analytics.trackEvent('search_performed', {
    query_length: query.length,
    result_count: resultCount,
    has_results: resultCount > 0,
    timestamp: new Date().toISOString()
  });
};

export const trackEmailSubmission = (email) => {
  analytics.trackEvent('email_submitted', {
    email_domain: email.split('@')[1],
    timestamp: new Date().toISOString()
  });
};

export const trackSubscriptionAttempt = (source) => {
  analytics.trackEvent('subscription_attempt', {
    source,
    timestamp: new Date().toISOString()
  });
};

export const trackSuspiciousActivity = (activityType, details) => {
  analytics.trackEvent('suspicious_activity', {
    activity_type: activityType,
    details,
    timestamp: new Date().toISOString()
  });
};

export const trackEvent = (eventName, properties = {}) => {
  analytics.trackEvent(eventName, properties);
};

export const trackPageView = (page) => {
  analytics.trackPageView(page);
};

export const setUserProperties = (properties) => {
  analytics.setUserProperties(properties);
};

// Auto-track page views
if (typeof window !== 'undefined') {
  // Track initial page view
  analytics.trackPageView();
  
  // Track page views on navigation (for SPAs)
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      analytics.trackPageView();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export default analytics;