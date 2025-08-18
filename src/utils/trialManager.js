// utils/trialManager.js
// Enhanced trial management with subscription support

import { trackTrialStarted, trackTrialExpired, trackSuspiciousActivity } from './analytics.js';
import { validateEmail, submitEmailToService } from './emailcollection.js';

class TrialManager {
  constructor() {
    this.TRIAL_DURATION_DAYS = 7;
    this.MAX_SEARCHES_PER_DAY = 50;
    this.STORAGE_KEYS = {
      TRIAL_DATA: 'codecompass_trial_data',
      SUBSCRIPTION_DATA: 'codecompass_subscription_data',
      SUBSCRIPTION_STATUS: 'subscriptionStatus', // For payment success
      DEVICE_ID: 'codecompass_device_id',
      SEARCH_LOG: 'codecompass_search_log'
    };
  }

  // Generate enhanced device fingerprint
  generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('CodeCompass', 2, 2);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.slice(0, 150),
      canvas: canvas.toDataURL().slice(-100),
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      timestamp: Date.now()
    };
    
    return this.hashString(JSON.stringify(fingerprint));
  }

  // Simple hash function
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Get or create device ID
  getDeviceId() {
    let deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      const fingerprint = this.generateDeviceFingerprint();
      deviceId = `cc_${fingerprint}_${Date.now().toString(36)}`;
      localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  }

  // Helper to get date one year from now
  getYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  // Activate paid subscription
  activateSubscription(subscriptionData) {
    const subscription = {
      isActive: true,
      plan: subscriptionData.plan || 'annual',
      subscriptionId: subscriptionData.subscriptionId,
      customerId: subscriptionData.customerId,
      email: subscriptionData.email,
      activatedAt: new Date().toISOString(),
      expiresAt: subscriptionData.expiresAt || this.getYearFromNow(),
      deviceId: this.getDeviceId(),
      status: 'active'
    };

    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTION_DATA, JSON.stringify(subscription));
    
    // Track subscription activation
    console.log('Subscription activated:', subscription);
    
    return subscription;
  }

  // Get subscription status
  getSubscriptionStatus() {
    // First check the payment success format (subscriptionStatus)
    const paymentSubscriptionStr = localStorage.getItem(this.STORAGE_KEYS.SUBSCRIPTION_STATUS);
    if (paymentSubscriptionStr) {
      try {
        const subscription = JSON.parse(paymentSubscriptionStr);
        const now = new Date().getTime();
        const expiresAt = new Date(subscription.expiresAt).getTime();
        
        if (subscription.isActive && expiresAt > now) {
          return {
            ...subscription,
            isActive: true,
            daysUntilExpiry: Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
          };
        }
      } catch (error) {
        console.error('Error parsing payment subscription data:', error);
      }
    }

    // Then check the main subscription data format
    const subscriptionDataStr = localStorage.getItem(this.STORAGE_KEYS.SUBSCRIPTION_DATA);
    if (subscriptionDataStr) {
      try {
        const subscription = JSON.parse(subscriptionDataStr);
        const now = new Date().getTime();
        const expiresAt = new Date(subscription.expiresAt).getTime();
        
        const isActive = subscription.isActive && expiresAt > now;
        
        return {
          ...subscription,
          isActive,
          daysUntilExpiry: Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
        };
      } catch (error) {
        console.error('Error parsing subscription data:', error);
      }
    }
    
    return {
      isActive: false,
      plan: null,
      expiresAt: null
    };
  }

  // Validate trial integrity
  validateTrialIntegrity(trialData) {
    const currentFingerprint = this.generateDeviceFingerprint();
    const deviceId = this.getDeviceId();
    
    if (trialData.deviceId && trialData.deviceId !== deviceId) {
      trackSuspiciousActivity('device_mismatch', {
        stored: trialData.deviceId,
        current: deviceId
      });
      return false;
    }
    
    const now = Date.now();
    const trialStart = new Date(trialData.trialStart).getTime();
    if (trialStart > now) {
      trackSuspiciousActivity('time_manipulation', {
        trialStart: trialData.trialStart,
        currentTime: new Date().toISOString()
      });
      return false;
    }
    
    return true;
  }

  // Start trial with email
  async startTrial(email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        errors: emailValidation.errors
      };
    }

    const existingTrial = this.getTrialStatus();
    if (existingTrial.trialUsed) {
      return {
        success: false,
        errors: ['Trial already used on this device']
      };
    }

    try {
      await submitEmailToService(email, 'trial_start');

      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialStart.getDate() + this.TRIAL_DURATION_DAYS);

      const trialData = {
        email: email,
        emailDomain: email.split('@')[1],
        trialStart: trialStart.toISOString(),
        trialEnd: trialEnd.toISOString(),
        deviceId: this.getDeviceId(),
        fingerprint: this.generateDeviceFingerprint(),
        searchCount: 0,
        lastSearchDate: null,
        version: '1.0'
      };

      localStorage.setItem(this.STORAGE_KEYS.TRIAL_DATA, JSON.stringify(trialData));
      localStorage.setItem(this.STORAGE_KEYS.SEARCH_LOG, JSON.stringify([]));

      trackTrialStarted(email);

      return {
        success: true,
        trialData: this.getAccessStatus()
      };

    } catch (error) {
      return {
        success: false,
        errors: ['Failed to start trial. Please try again.']
      };
    }
  }

  // Get current trial status
  getTrialStatus() {
    const trialDataStr = localStorage.getItem(this.STORAGE_KEYS.TRIAL_DATA);
    
    if (!trialDataStr) {
      return {
        trialActive: false,
        trialUsed: false,
        eligible: true,
        daysRemaining: 0,
        searchCount: 0
      };
    }

    try {
      const trialData = JSON.parse(trialDataStr);
      
      if (!this.validateTrialIntegrity(trialData)) {
        return {
          trialActive: false,
          trialUsed: true,
          eligible: false,
          daysRemaining: 0,
          searchCount: trialData.searchCount || 0,
          email: trialData.email,
          suspiciousActivity: true
        };
      }

      const now = new Date().getTime();
      const trialEnd = new Date(trialData.trialEnd).getTime();
      const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
      const isActive = daysRemaining > 0;

      if (trialData.searchCount > 0 && !isActive && !trialData.expirationTracked) {
        trackTrialExpired(trialData.searchCount);
        trialData.expirationTracked = true;
        localStorage.setItem(this.STORAGE_KEYS.TRIAL_DATA, JSON.stringify(trialData));
      }

      return {
        trialActive: isActive,
        trialUsed: true,
        eligible: false,
        daysRemaining,
        searchCount: trialData.searchCount || 0,
        email: trialData.email,
        emailDomain: trialData.emailDomain,
        trialStart: trialData.trialStart,
        trialEnd: trialData.trialEnd
      };

    } catch (error) {
      return {
        trialActive: false,
        trialUsed: true,
        eligible: false,
        daysRemaining: 0,
        searchCount: 0
      };
    }
  }

  // Enhanced access control
  canAccessPremiumFeatures() {
    // First check subscription status
    const subscriptionStatus = this.getSubscriptionStatus();
    if (subscriptionStatus.isActive) {
      return true;
    }

    // Fall back to trial status
    const trialStatus = this.getTrialStatus();
    return trialStatus.trialActive;
  }

  // Get comprehensive access status - MAIN METHOD
  getAccessStatus() {
    const subscriptionStatus = this.getSubscriptionStatus();
    const trialStatus = this.getTrialStatus();

    // If user has active subscription, that takes precedence
    if (subscriptionStatus.isActive) {
      return {
        hasAccess: true,
        type: 'subscription',
        plan: subscriptionStatus.plan,
        expiresAt: subscriptionStatus.expiresAt,
        daysUntilExpiry: subscriptionStatus.daysUntilExpiry,
        isActive: true,
        trialUsed: trialStatus.trialUsed,
        subscriptionId: subscriptionStatus.subscriptionId
      };
    }

    // Otherwise return trial status
    return {
      hasAccess: trialStatus.trialActive,
      type: 'trial',
      trialActive: trialStatus.trialActive,
      trialUsed: trialStatus.trialUsed,
      eligible: trialStatus.eligible,
      daysRemaining: trialStatus.daysRemaining,
      searchCount: trialStatus.searchCount,
      email: trialStatus.email
    };
  }

  // Record a search (works for both trial and subscription)
  recordSearch(query, resultCount = 0) {
    const accessStatus = this.getAccessStatus();
    
    if (!accessStatus.hasAccess) {
      return false;
    }

    // Check daily search limit (only for trial users)
    if (accessStatus.type === 'trial') {
      const today = new Date().toDateString();
      const searchLog = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEARCH_LOG) || '[]');
      const todaySearches = searchLog.filter(log => 
        new Date(log.timestamp).toDateString() === today
      );

      if (todaySearches.length >= this.MAX_SEARCHES_PER_DAY) {
        trackSuspiciousActivity('daily_limit_exceeded', {
          searchCount: todaySearches.length,
          limit: this.MAX_SEARCHES_PER_DAY
        });
        return false;
      }
    }

    // Record the search
    const searchRecord = {
      query: query.toLowerCase().trim(),
      resultCount,
      timestamp: new Date().toISOString(),
      deviceId: this.getDeviceId(),
      accessType: accessStatus.type
    };

    const searchLog = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEARCH_LOG) || '[]');
    searchLog.push(searchRecord);
    localStorage.setItem(this.STORAGE_KEYS.SEARCH_LOG, JSON.stringify(searchLog));

    // Update trial data if user is on trial
    if (accessStatus.type === 'trial') {
      const trialData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRIAL_DATA));
      trialData.searchCount = (trialData.searchCount || 0) + 1;
      trialData.lastSearchDate = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEYS.TRIAL_DATA, JSON.stringify(trialData));
    }

    return true;
  }

  // Get search statistics
  getSearchStats() {
    const searchLog = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SEARCH_LOG) || '[]');
    const today = new Date().toDateString();
    
    return {
      totalSearches: searchLog.length,
      todaySearches: searchLog.filter(log => 
        new Date(log.timestamp).toDateString() === today
      ).length,
      popularQueries: this.getPopularQueries(searchLog),
      dailyLimit: this.MAX_SEARCHES_PER_DAY
    };
  }

  // Get popular search queries
  getPopularQueries(searchLog, limit = 5) {
    const queryCount = {};
    
    searchLog.forEach(log => {
      queryCount[log.query] = (queryCount[log.query] || 0) + 1;
    });

    return Object.entries(queryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  // Handle successful payment - called from payment success
  handlePaymentSuccess(paymentData = {}) {
    const subscriptionData = {
      type: 'subscription',
      isActive: true,
      hasAccess: true,
      plan: paymentData.plan || 'annual',
      subscriptionId: paymentData.subscription_id || `sub_${Date.now()}`,
      customerId: paymentData.customer_id || `cus_${Date.now()}`,
      email: paymentData.customer_email || 'unknown@example.com',
      amount: paymentData.amount || 7900, // $79.00 in cents
      activatedAt: new Date().toISOString(),
      expiresAt: paymentData.expiresAt || this.getYearFromNow(),
      deviceId: this.getDeviceId()
    };

    // Store in the payment success format
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTION_STATUS, JSON.stringify(subscriptionData));
    
    // Also store in main subscription format for consistency
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTION_DATA, JSON.stringify(subscriptionData));
    
    console.log('Payment success handled:', subscriptionData);
    
    return subscriptionData;
  }

  // Reset trial (for testing)
  resetTrial() {
    localStorage.removeItem(this.STORAGE_KEYS.TRIAL_DATA);
    localStorage.removeItem(this.STORAGE_KEYS.SEARCH_LOG);
    localStorage.removeItem(this.STORAGE_KEYS.DEVICE_ID);
    localStorage.removeItem(this.STORAGE_KEYS.SUBSCRIPTION_DATA);
    localStorage.removeItem(this.STORAGE_KEYS.SUBSCRIPTION_STATUS);
  }
}

// Export singleton instance
export const trialManager = new TrialManager();

// Export individual functions for easier imports
export const {
  startTrial,
  getTrialStatus,
  getSubscriptionStatus,
  getAccessStatus,
  recordSearch,
  getSearchStats,
  canAccessPremiumFeatures,
  activateSubscription,
  handlePaymentSuccess,
  resetTrial
} = trialManager;