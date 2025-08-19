// Enhanced payment handler with VercelAuth integration
// This extends the existing paymentHandler to work with user accounts

import { trialManager } from './trialManager.js';
import { trackEvent } from './analytics.js';

class EnhancedPaymentHandler {
  constructor() {
    this.isInitialized = false;
    this.STRIPE_SUCCESS_URL_PARAMS = [
      'session_id',
      'success',
      'payment_intent'
    ];
  }

  // Initialize payment success detection
  init() {
    console.log('EnhancedPaymentHandler: Starting initialization...');
    
    if (this.isInitialized) {
      console.log('EnhancedPaymentHandler: Already initialized, skipping...');
      return;
    }
    
    // Check URL parameters for payment success
    this.checkURLForPaymentSuccess();
    
    // Listen for Stripe success messages
    this.listenForStripeSuccess();
    
    // Check for manual activation codes
    this.checkForActivationCode();
    
    this.isInitialized = true;
    console.log('EnhancedPaymentHandler: Initialization complete');
  }

  // Check URL parameters for payment success
  checkURLForPaymentSuccess() {
    console.log('EnhancedPaymentHandler: Checking URL for payment success...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const paymentIntent = urlParams.get('payment_intent');
    
    // Stripe Checkout success
    if (success === 'true' || sessionId) {
      console.log('EnhancedPaymentHandler: Payment success detected!');
      
      this.handlePaymentSuccess({
        source: 'stripe_checkout',
        session_id: sessionId,
        payment_intent: paymentIntent,
        timestamp: new Date().toISOString()
      });
      
      this.cleanupURL();
    }
    
    // Generic success parameter
    if (urlParams.get('payment_success') === 'true') {
      console.log('EnhancedPaymentHandler: Generic payment success detected');
      this.handlePaymentSuccess({
        source: 'generic',
        timestamp: new Date().toISOString()
      });
      
      this.cleanupURL();
    }
  }

  // Listen for Stripe success events
  listenForStripeSuccess() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'stripe_payment_success') {
        console.log('EnhancedPaymentHandler: Stripe payment success message received');
        this.handlePaymentSuccess({
          source: 'stripe_embedded',
          ...event.data.payload,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Check for manual activation codes
  checkForActivationCode() {
    const activationCode = localStorage.getItem('codecompass_activation_code');
    if (activationCode) {
      this.activateWithCode(activationCode);
      localStorage.removeItem('codecompass_activation_code');
    }
  }

  // Handle successful payment - MAIN METHOD with Firebase integration
  async handlePaymentSuccess(paymentData = {}) {
    try {
      console.log('EnhancedPaymentHandler: Processing payment success...', paymentData);
      
      // Import auth service dynamically
      const { vercelAuth } = await import('../services/vercelAuth.js');
      
      // Check if user is authenticated
      const currentUser = vercelAuth.currentUser;
      
      if (currentUser) {
        // User is logged in - update their Firebase subscription
        await this.handleAuthenticatedPayment(currentUser, paymentData);
      } else {
        // User not logged in - use legacy local storage method
        await this.handleUnauthenticatedPayment(paymentData);
      }

    } catch (error) {
      console.error('EnhancedPaymentHandler: Failed to handle payment success:', error);
      this.showErrorMessage('Payment processed but activation failed. Contact support.');
    }
  }

  // Handle payment for authenticated users
  async handleAuthenticatedPayment(user, paymentData) {
    console.log('EnhancedPaymentHandler: Processing authenticated payment...');
    
    try {
      const { vercelAuth } = await import('../services/vercelAuth.js');
      
      // Get email from current user or URL
      const email = user.email || this.extractEmailFromURL() || 'unknown@example.com';
      
      // Create subscription data for Firebase
      const subscriptionData = {
        plan: 'annual',
        expiresAt: paymentData.expiresAt || this.getYearFromNow(),
        customerId: paymentData.customer_id || `cus_${Date.now()}`,
        subscriptionId: paymentData.session_id || `sub_${Date.now()}`,
        amount: 7900, // $79.00
        activatedAt: new Date().toISOString(),
        source: paymentData.source || 'stripe'
      };

      // Update subscription in Firebase
      const result = await vercelAuth.updateSubscription(subscriptionData);
      
      if (result.success) {
        console.log('EnhancedPaymentHandler: Firebase subscription updated successfully');
        
        // Also update local storage for backwards compatibility
        const localSubscriptionData = {
          type: 'subscription',
          hasAccess: true,
          isActive: true,
          subscriptionId: subscriptionData.subscriptionId,
          customerId: subscriptionData.customerId,
          email: email,
          plan: subscriptionData.plan,
          amount: subscriptionData.amount,
          paymentSource: subscriptionData.source,
          startDate: subscriptionData.activatedAt,
          activatedAt: subscriptionData.activatedAt,
          expiresAt: subscriptionData.expiresAt
        };
        
        localStorage.setItem('subscriptionStatus', JSON.stringify(localSubscriptionData));
        
        // Track successful conversion
        if (typeof trackEvent === 'function') {
          trackEvent('subscription_activated', {
            subscription_id: subscriptionData.subscriptionId,
            customer_email: email,
            plan: 'annual',
            amount: 79.00,
            source: subscriptionData.source,
            user_authenticated: true
          });
        }

        // Dispatch events
        this.dispatchSuccessEvents(localSubscriptionData);
        
        // Show success message
        this.showSuccessMessage({
          expiresAt: subscriptionData.expiresAt,
          plan: subscriptionData.plan
        }, `🎉 Welcome to Code Compass! Your subscription is active across all your devices.`);
        
        return localSubscriptionData;
      } else {
        throw new Error('Failed to update Firebase subscription');
      }
      
    } catch (error) {
      console.error('EnhancedPaymentHandler: Error processing authenticated payment:', error);
      // Fall back to legacy method
      return await this.handleUnauthenticatedPayment(paymentData);
    }
  }

  // Handle payment for non-authenticated users (legacy method)
  async handleUnauthenticatedPayment(paymentData) {
    console.log('EnhancedPaymentHandler: Processing unauthenticated payment (legacy)...');
    
    // Get trial data to preserve email
    const trialStatus = trialManager.getTrialStatus();
    const email = trialStatus.email || this.extractEmailFromURL() || 'unknown@example.com';

    // Create subscription data
    const subscriptionData = {
      type: 'subscription',
      hasAccess: true,
      isActive: true,
      subscriptionId: paymentData.session_id || `sub_${Date.now()}`,
      customerId: paymentData.customer_id || `cus_${Date.now()}`,
      email: email,
      plan: 'annual',
      amount: 7900,
      paymentSource: paymentData.source || 'manual',
      startDate: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      expiresAt: paymentData.expiresAt || this.getYearFromNow()
    };

    // Store subscription in localStorage
    localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData));
    
    // Also activate through trial manager for consistency
    const subscription = trialManager.activateSubscription(subscriptionData);

    // Track successful conversion
    if (typeof trackEvent === 'function') {
      trackEvent('subscription_activated', {
        subscription_id: subscription.subscriptionId,
        customer_email: email,
        plan: 'annual',
        amount: 79.00,
        source: paymentData.source || 'manual',
        user_authenticated: false,
        converted_from_trial: trialStatus.trialUsed
      });
    }

    // Dispatch events
    this.dispatchSuccessEvents(subscriptionData);

    // Show success message
    this.showSuccessMessage(subscription, 
      `🎉 Welcome to Code Compass! Your subscription is now active. Consider creating an account to access from multiple devices.`
    );

    return subscription;
  }

  // Dispatch success events for UI updates
  dispatchSuccessEvents(subscriptionData) {
    // Trigger event to update UI
    window.dispatchEvent(new CustomEvent('paymentSuccess', {
      detail: subscriptionData
    }));
    
    // Also trigger storage event for cross-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'subscriptionStatus',
      newValue: JSON.stringify(subscriptionData)
    }));
  }

  // Migration helper - convert localStorage subscription to Firebase
  async migrateExistingSubscription(user) {
    try {
      console.log('EnhancedPaymentHandler: Attempting to migrate existing subscription...');
      
      // Check for existing subscription in localStorage
      const existingSubscription = localStorage.getItem('subscriptionStatus');
      if (!existingSubscription) {
        console.log('EnhancedPaymentHandler: No existing subscription to migrate');
        return null;
      }

      const subscriptionData = JSON.parse(existingSubscription);
      
      // Check if it's still valid
      if (!subscriptionData.isActive || new Date(subscriptionData.expiresAt) <= new Date()) {
        console.log('EnhancedPaymentHandler: Existing subscription is expired');
        return null;
      }

      // Migrate to Firebase
      const { vercelAuth } = await import('../services/vercelAuth.js');
      const result = await vercelAuth.updateSubscription({
        plan: subscriptionData.plan || 'annual',
        expiresAt: subscriptionData.expiresAt,
        customerId: subscriptionData.customerId,
        subscriptionId: subscriptionData.subscriptionId,
        source: 'migration'
      });

      if (result.success) {
        console.log('EnhancedPaymentHandler: Subscription migrated successfully');
        
        // Track migration
        if (typeof trackEvent === 'function') {
          trackEvent('subscription_migrated', {
            subscription_id: subscriptionData.subscriptionId,
            customer_email: user.email,
            plan: subscriptionData.plan
          });
        }
        
        return subscriptionData;
      }
      
    } catch (error) {
      console.error('EnhancedPaymentHandler: Failed to migrate subscription:', error);
    }
    
    return null;
  }

  // Create account linking flow for existing subscribers
  async linkSubscriptionToAccount(email, subscriptionData) {
    try {
      // Import auth service
      const { vercelAuth } = await import('../services/vercelAuth.js');
      
      // Check if user exists
      const currentUser = vercelAuth.currentUser;
      if (!currentUser || currentUser.email !== email) {
        throw new Error('User must be logged in with the correct email');
      }

      // Update Firebase with subscription
      const result = await vercelAuth.updateSubscription({
        plan: subscriptionData.plan || 'annual',
        expiresAt: subscriptionData.expiresAt,
        customerId: subscriptionData.customerId,
        subscriptionId: subscriptionData.subscriptionId,
        source: 'account_linking'
      });

      if (result.success) {
        // Track linking
        if (typeof trackEvent === 'function') {
          trackEvent('subscription_linked', {
            subscription_id: subscriptionData.subscriptionId,
            customer_email: email
          });
        }
        
        return { success: true, message: 'Subscription linked to your account successfully!' };
      } else {
        return { success: false, message: 'Failed to link subscription to account' };
      }
      
    } catch (error) {
      console.error('EnhancedPaymentHandler: Failed to link subscription:', error);
      return { success: false, message: error.message };
    }
  }

  // Test payment success (for development)
  testPaymentSuccess() {
    console.log('EnhancedPaymentHandler: Testing payment success...');
    
    const testPaymentData = {
      source: 'test',
      session_id: `test_sub_${Date.now()}`,
      customer_id: `test_cus_${Date.now()}`,
      customer_email: 'test@example.com',
      timestamp: new Date().toISOString()
    };
    
    return this.handlePaymentSuccess(testPaymentData);
  }

  // Utility methods (same as original)
  extractEmailFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email') || urlParams.get('customer_email');
  }

  getYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  cleanupURL() {
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location);
      const paramsToRemove = [
        'success', 'session_id', 'payment_intent', 
        'payment_success', 'customer_email'
      ];
      
      paramsToRemove.forEach(param => url.searchParams.delete(param));
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  showSuccessMessage(subscription, customMessage = null) {
    const message = customMessage || 
      `🎉 Welcome to Code Compass! Your subscription is now active until ${new Date(subscription.expiresAt).toLocaleDateString()}.`;
    
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      z-index: 10000;
      max-width: 500px;
      text-align: center;
      font-weight: 600;
    `;
    banner.textContent = message;
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 10000);
  }

  showErrorMessage(message) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FF5722, #D84315);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
      z-index: 10000;
      max-width: 500px;
      text-align: center;
      font-weight: 600;
    `;
    banner.textContent = message;
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 8000);
  }

  // Check subscription status (Firebase + localStorage fallback)
  async getSubscriptionStatus() {
    try {
      // Try Firebase first
      const { vercelAuth } = await import('../services/vercelAuth.js');
      if (vercelAuth.currentUser) {
        const hasAccess = await vercelAuth.hasValidAccess();
        if (hasAccess) {
          return { type: 'subscription', hasAccess: true, source: 'vercel' };
        }
      }
    } catch (error) {
      console.log('EnhancedPaymentHandler: Firebase check failed, using localStorage');
    }
    
    // Fall back to localStorage
    return trialManager.getAccessStatus();
  }

  // Activate with manual code
  activateWithCode(code) {
    const validCodes = ['CODECOMPASS2024', 'SUPPORT123', 'MANUAL_ACTIVATE'];
    
    if (validCodes.includes(code.toUpperCase())) {
      const subscriptionData = {
        source: 'activation_code',
        session_id: `manual_${Date.now()}`,
        customer_email: 'manual@codecompass.com',
        activationCode: code,
        timestamp: new Date().toISOString()
      };

      return this.handlePaymentSuccess(subscriptionData);
    } else {
      this.showErrorMessage('Invalid activation code');
      return null;
    }
  }
}

// Export singleton instance
export const enhancedPaymentHandler = new EnhancedPaymentHandler();

// Export individual functions for easier imports
export const {
  init,
  handlePaymentSuccess,
  testPaymentSuccess,
  getSubscriptionStatus,
  migrateExistingSubscription,
  linkSubscriptionToAccount
} = enhancedPaymentHandler;

// Export for manual testing in console
if (typeof window !== 'undefined') {
  window.codecompass_testPayment = () => enhancedPaymentHandler.testPaymentSuccess();
  window.codecompass_migrateSubscription = async () => {
    const { authService } = await import('../services/auth.js');
    if (vercelAuth.currentUser) {
      return enhancedPaymentHandler.migrateExistingSubscription(vercelAuth.currentUser);
    } else {
      console.log('No user logged in');
    }
  };
}