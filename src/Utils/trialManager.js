// utils/trialManager.js
// Advanced trial management with multiple protection layers

import { trackTrialStarted, trackTrialExpired, trackSuspiciousActivity } from './analytics.js';
import { validateEmail, submitEmailToService } from './emailCollection.js';

class TrialManager {
  constructor() {
    this.TRIAL_DURATION_DAYS = 7;
    this.MAX_SEARCHES_PER_DAY = 50; // Reasonable limit
    this.STORAGE_KEYS = {
      TRIAL_DATA: 'codecompass_trial_data',
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

  // Validate trial integrity
  validateTrialIntegrity(trialData) {
    const currentFingerprint = this.generateDeviceFingerprint();
    const deviceId = this.getDeviceId();
    
    // Check if device fingerprint matches
    if (trialData.deviceId && trialData.deviceId !== deviceId) {
      trackSuspiciousActivity('device_mismatch', {
        stored: trialData.deviceId,
        current: deviceId
      });
      return false;
    }
    
    // Check for time manipulation
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
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        errors: emailValidation.errors
      };
    }

    // Check if trial already exists
    const existingTrial = this.getTrialStatus();
    if (existingTrial.trialUsed) {
      return {
        success: false,
        errors: ['Trial already used on this device']
      };
    }

    try {
      // Submit email to collection service
      await submitEmailToService(email, 'trial_start');

      // Create trial data
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

      // Store trial data
      localStorage.setItem(this.STORAGE_KEYS.TRIAL_DATA, JSON.stringify(trialData));
      
      // Initialize search log
      localStorage.setItem(this.STORAGE_KEYS.SEARCH_LOG, JSON.stringify([]));

      // Track trial start
      trackTrialStarted(email);

      return {
        success: true,
        trialData: this.getTrialStatus()
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
      
      // Validate trial integrity
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

      // Track trial expiration
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
      // Corrupted data - treat as used trial
      return {
        trialActive: false,
        trialUsed: true,
        eligible: false,
        daysRemaining: 0,
        searchCount: 0
      };
    }
  }

  // Record a search
  recordSearch(query, resultCount = 0) {
    const trialStatus = this.getTrialStatus();
    
    if (!trialStatus.trialActive) {
      return false;
    }

    // Check daily search limit
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

    // Record the search
    const searchRecord = {
      query: query.toLowerCase().trim(),
      resultCount,
      timestamp: new Date().toISOString(),
      deviceId: this.getDeviceId()
    };

    searchLog.push(searchRecord);
    localStorage.setItem(this.STORAGE_KEYS.SEARCH_LOG, JSON.stringify(searchLog));

    // Update trial data
    const trialData = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRIAL_DATA));
    trialData.searchCount = (trialData.searchCount || 0) + 1;
    trialData.lastSearchDate = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEYS.TRIAL_DATA, JSON.stringify(trialData));

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

  // Reset trial (for testing - remove in production)
  resetTrial() {
    localStorage.removeItem(this.STORAGE_KEYS.TRIAL_DATA);
    localStorage.removeItem(this.STORAGE_KEYS.SEARCH_LOG);
    localStorage.removeItem(this.STORAGE_KEYS.DEVICE_ID);
  }

  // Check if user can access premium features
  canAccessPremiumFeatures() {
    const trialStatus = this.getTrialStatus();
    
    // Allow access if trial is active
    if (trialStatus.trialActive) {
      return true;
    }

    // Check for subscription status (implement based on your payment system)
    const subscriptionStatus = this.getSubscriptionStatus();
    return subscriptionStatus.isActive;
  }

  // Get subscription status (placeholder - implement based on your payment system)
  getSubscriptionStatus() {
    // This would typically check with Stripe or your payment processor
    // For now, return default status
    return {
      isActive: false,
      plan: null,
      expiresAt: null
    };
  }
}

// Export singleton instance
export const trialManager = new TrialManager();

// Export individual functions for easier imports
export const {
  startTrial,
  getTrialStatus,
  recordSearch,
  getSearchStats,
  canAccessPremiumFeatures,
  resetTrial
} = trialManager;