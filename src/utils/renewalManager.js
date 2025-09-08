// utils/renewalManager.js
// Handle automatic renewal of annual subscription codes

export class RenewalManager {
  constructor() {
    this.RENEWAL_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    this.RENEWAL_GRACE_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days before expiration (for 12-month renewals)
  }

  // Check if subscription needs renewal
  checkForRenewal() {
    const subscriptionData = this.getSubscriptionData();
    if (!subscriptionData || !subscriptionData.isActive) {
      return { needsRenewal: false, reason: 'No active subscription' };
    }

    // Only handle annual subscription codes
    if (subscriptionData.codeType !== 'annual_subscription') {
      return { needsRenewal: false, reason: 'Not an annual subscription code' };
    }

    const now = new Date().getTime();
    const expiresAt = new Date(subscriptionData.expiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;

    console.log('RenewalManager: Checking renewal for code:', subscriptionData.activationCode);
    console.log('RenewalManager: Expires at:', new Date(expiresAt).toISOString());
    console.log('RenewalManager: Time until expiry:', timeUntilExpiry, 'ms');

    // Check if we're within the grace period
    if (timeUntilExpiry <= this.RENEWAL_GRACE_PERIOD && timeUntilExpiry > 0) {
      return {
        needsRenewal: true,
        reason: 'Within renewal grace period',
        daysUntilExpiry: Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000)),
        subscriptionData
      };
    }

    // Check if subscription has expired
    if (timeUntilExpiry <= 0) {
      return {
        needsRenewal: true,
        reason: 'Subscription expired',
        daysUntilExpiry: 0,
        subscriptionData
      };
    }

    return { needsRenewal: false, reason: 'Not yet time for renewal' };
  }

  // Automatically renew subscription
  async renewSubscription(subscriptionData) {
    console.log('RenewalManager: Starting automatic renewal...');

    try {
      // Determine API endpoint based on environment
      const isAndroidOrLocal = window.location.protocol === 'capacitor:' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
      
      const apiEndpoint = isAndroidOrLocal 
        ? 'https://codecompassapp.netlify.app/.netlify/functions/activation-manager'
        : '/.netlify/functions/activation-manager';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'renew_subscription',
          oldCode: subscriptionData.activationCode,
          email: subscriptionData.email
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local storage with new code
        const renewedSubscriptionData = {
          ...subscriptionData,
          activationCode: result.activationCode,
          subscriptionYear: result.subscriptionYear,
          expiresAt: result.expiresAt,
          renewalDate: result.renewalDate,
          lastRenewalAt: new Date().toISOString(),
          codeType: 'annual_subscription_renewal'
        };

        this.saveSubscriptionData(renewedSubscriptionData);

        // Show renewal success message
        this.showRenewalSuccessMessage(result.activationCode, result.subscriptionYear);

        console.log('RenewalManager: Renewal successful:', result.activationCode);
        return { success: true, newCode: result.activationCode, subscriptionData: renewedSubscriptionData };

      } else {
        console.error('RenewalManager: Renewal failed:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('RenewalManager: Renewal request failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get subscription data from localStorage
  getSubscriptionData() {
    const subscriptionStr = localStorage.getItem('codecompass_subscription_data') || 
                           localStorage.getItem('subscriptionStatus');
    
    if (!subscriptionStr) return null;

    try {
      return JSON.parse(subscriptionStr);
    } catch (error) {
      console.error('RenewalManager: Failed to parse subscription data:', error);
      return null;
    }
  }

  // Save subscription data to localStorage
  saveSubscriptionData(subscriptionData) {
    localStorage.setItem('codecompass_subscription_data', JSON.stringify(subscriptionData));
    localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData));
    
    // Trigger storage event for cross-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'subscriptionStatus',
      newValue: JSON.stringify(subscriptionData)
    }));
  }

  // Show renewal success message
  showRenewalSuccessMessage(newCode, subscriptionYear) {
    const message = `🔄 Subscription Renewed! Your new ${subscriptionYear} activation code is: ${newCode}. Valid until January ${subscriptionYear + 1}. Your premium access continues uninterrupted!`;
    
    // Create success banner
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #2196F3, #1976D2);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
      z-index: 10000;
      max-width: 600px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    `;
    banner.textContent = message;
    
    document.body.appendChild(banner);
    
    // Remove banner after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 10000);

    console.log('RenewalManager: Showed renewal success message');
  }

  // Initialize renewal checking
  init() {
    console.log('RenewalManager: Initializing automatic renewal checking...');
    
    // Check immediately
    this.performRenewalCheck();
    
    // Set up interval checking
    setInterval(() => {
      this.performRenewalCheck();
    }, this.RENEWAL_CHECK_INTERVAL);
  }

  // Perform renewal check
  async performRenewalCheck() {
    const renewalCheck = this.checkForRenewal();
    
    if (renewalCheck.needsRenewal) {
      console.log('RenewalManager: Renewal needed:', renewalCheck.reason);
      
      // Only auto-renew if user has been recently active (to avoid renewing inactive users)
      const lastActivity = localStorage.getItem('codecompass_last_activity');
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      if (lastActivity && (now - parseInt(lastActivity)) < oneWeek) {
        console.log('RenewalManager: User is active, proceeding with renewal');
        await this.renewSubscription(renewalCheck.subscriptionData);
      } else {
        console.log('RenewalManager: User inactive, skipping auto-renewal');
      }
    }
  }

  // Track user activity (call this from your main app)
  trackActivity() {
    localStorage.setItem('codecompass_last_activity', Date.now().toString());
  }

  // Manual renewal trigger (for testing)
  async manualRenewal() {
    console.log('RenewalManager: Manual renewal triggered');
    const subscriptionData = this.getSubscriptionData();
    
    if (!subscriptionData) {
      console.error('RenewalManager: No subscription data found for manual renewal');
      return { success: false, error: 'No subscription data found' };
    }
    
    return await this.renewSubscription(subscriptionData);
  }
}

// Export singleton instance
export const renewalManager = new RenewalManager();

// Export individual functions for easier imports
export const {
  checkForRenewal,
  renewSubscription,
  init: initRenewalManager,
  trackActivity,
  manualRenewal
} = renewalManager;

// Make available in console for testing
if (typeof window !== 'undefined') {
  window.codecompass_renewalManager = renewalManager;
  window.codecompass_checkRenewal = () => renewalManager.checkForRenewal();
  window.codecompass_manualRenewal = () => renewalManager.manualRenewal();
}