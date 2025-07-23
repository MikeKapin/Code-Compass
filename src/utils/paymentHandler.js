// utils/paymentHandler.js - DEBUG VERSION
// Handle payment success and subscription activation

import { trialManager } from './trialManager.js';
import { trackEvent } from './analytics.js';

class PaymentHandler {
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
    console.log('PaymentHandler: Starting initialization...');
    console.log('PaymentHandler: Current URL:', window.location.href);
    console.log('PaymentHandler: URL search params:', window.location.search);
    
    if (this.isInitialized) {
      console.log('PaymentHandler: Already initialized, skipping...');
      return;
    }
    
    // Check URL parameters for payment success
    this.checkURLForPaymentSuccess();
    
    // Listen for Stripe success messages (if using Stripe)
    this.listenForStripeSuccess();
    
    // Check for manual activation codes
    this.checkForActivationCode();
    
    this.isInitialized = true;
    console.log('PaymentHandler: Initialization complete');
  }

  // Method 1: Check URL parameters for payment success
  checkURLForPaymentSuccess() {
    console.log('PaymentHandler: Checking URL for payment success...');
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('PaymentHandler: All URL params:', Array.from(urlParams.entries()));
    
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const paymentIntent = urlParams.get('payment_intent');
    
    console.log('PaymentHandler: Extracted params:', {
      sessionId,
      success,
      paymentIntent
    });
    
    // Stripe Checkout success
    if (success === 'true' || sessionId) {
      console.log('PaymentHandler: ✅ Payment success detected!');
      console.log('PaymentHandler: Session ID:', sessionId);
      console.log('PaymentHandler: Payment Intent:', paymentIntent);
      
      this.handlePaymentSuccess({
        source: 'stripe_checkout',
        session_id: sessionId,
        payment_intent: paymentIntent,
        timestamp: new Date().toISOString()
      });
      
      // Clean up URL
      this.cleanupURL();
    } else {
      console.log('PaymentHandler: ❌ No payment success detected');
      console.log('PaymentHandler: success parameter:', success);
      console.log('PaymentHandler: session_id parameter:', sessionId);
    }
    
    // Generic success parameter
    if (urlParams.get('payment_success') === 'true') {
      console.log('PaymentHandler: Generic payment success detected');
      this.handlePaymentSuccess({
        source: 'generic',
        timestamp: new Date().toISOString()
      });
      
      this.cleanupURL();
    }
  }

  // Method 2: Listen for Stripe success events
  listenForStripeSuccess() {
    console.log('PaymentHandler: Setting up Stripe success event listener...');
    
    // If you're using Stripe Elements or embedded checkout
    window.addEventListener('message', (event) => {
      console.log('PaymentHandler: Received message event:', event);
      
      if (event.data && event.data.type === 'stripe_payment_success') {
        console.log('PaymentHandler: Stripe payment success message received');
        this.handlePaymentSuccess({
          source: 'stripe_embedded',
          ...event.data.payload,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Method 3: Check for manual activation codes (for customer service)
  checkForActivationCode() {
    console.log('PaymentHandler: Checking for activation code...');
    
    const activationCode = localStorage.getItem('codecompass_activation_code');
    console.log('PaymentHandler: Activation code found:', activationCode);
    
    if (activationCode) {
      this.activateWithCode(activationCode);
      localStorage.removeItem('codecompass_activation_code');
    }
  }

  // Handle successful payment - MAIN METHOD
  handlePaymentSuccess(paymentData = {}) {
    try {
      console.log('PaymentHandler: 🎉 Processing payment success...', paymentData);
      
      // Get trial data to preserve email
      const trialStatus = trialManager.getTrialStatus();
      console.log('PaymentHandler: Current trial status:', trialStatus);
      
      const email = trialStatus.email || this.extractEmailFromURL() || 'unknown@example.com';
      console.log('PaymentHandler: Using email:', email);

      // Create subscription data
      const subscriptionData = {
        type: 'subscription',
        hasAccess: true,
        isActive: true,
        subscriptionId: paymentData.session_id || `sub_${Date.now()}`,
        customerId: paymentData.customer_id || `cus_${Date.now()}`,
        email: email,
        plan: 'annual',
        amount: 4999,
        paymentSource: paymentData.source || 'manual',
        startDate: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
        expiresAt: paymentData.expiresAt || this.getYearFromNow()
      };

      console.log('PaymentHandler: Created subscription data:', subscriptionData);

      // Store subscription in localStorage (using the format App.jsx expects)
      localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData));
      console.log('PaymentHandler: Stored in localStorage');
      
      // Also activate through trial manager for consistency
      const subscription = trialManager.activateSubscription(subscriptionData);
      console.log('PaymentHandler: Trial manager activation result:', subscription);

      // Track successful conversion
      if (typeof trackEvent === 'function') {
        console.log('PaymentHandler: Tracking conversion event...');
        trackEvent('subscription_activated', {
          subscription_id: subscription.subscriptionId,
          customer_email: email,
          plan: 'annual',
          amount: 49.99,
          source: paymentData.source || 'manual',
          converted_from_trial: trialStatus.trialUsed
        });
      }

      // Trigger event to update UI
      console.log('PaymentHandler: Dispatching paymentSuccess event...');
      window.dispatchEvent(new CustomEvent('paymentSuccess', {
        detail: subscriptionData
      }));
      
      // Also trigger storage event for cross-tab updates
      console.log('PaymentHandler: Dispatching storage event...');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'subscriptionStatus',
        newValue: JSON.stringify(subscriptionData)
      }));

      // Show success message
      this.showSuccessMessage(subscription);

      console.log('PaymentHandler: ✅ Payment success processing complete!');
      console.log('PaymentHandler: Final subscription:', subscription);
      
      return subscription;

    } catch (error) {
      console.error('PaymentHandler: ❌ Failed to handle payment success:', error);
      this.showErrorMessage('Payment processed but activation failed. Contact support.');
    }
  }

  // Test payment success (for development)
  testPaymentSuccess() {
    console.log('PaymentHandler: 🧪 Testing payment success...');
    
    const testPaymentData = {
      source: 'test',
      session_id: `test_sub_${Date.now()}`,
      customer_id: `test_cus_${Date.now()}`,
      customer_email: 'test@example.com',
      timestamp: new Date().toISOString()
    };
    
    console.log('PaymentHandler: Test payment data:', testPaymentData);
    return this.handlePaymentSuccess(testPaymentData);
  }

  // Activate with manual code (for customer service)
  activateWithCode(code) {
    console.log('PaymentHandler: Activating with code:', code);
    
    // Simple code validation - replace with your own logic
    const validCodes = ['CODECOMPASS2024', 'SUPPORT123', 'MANUAL_ACTIVATE'];
    
    if (validCodes.includes(code.toUpperCase())) {
      const subscriptionData = {
        source: 'activation_code',
        session_id: `manual_${Date.now()}`,
        customer_email: 'manual@codecompass.com',
        activationCode: code,
        timestamp: new Date().toISOString()
      };

      const subscription = this.handlePaymentSuccess(subscriptionData);
      this.showSuccessMessage(subscription, 'Manual activation successful!');
      
      return subscription;
    } else {
      console.log('PaymentHandler: Invalid activation code');
      this.showErrorMessage('Invalid activation code');
      return null;
    }
  }

  // Extract email from URL parameters (if available)
  extractEmailFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || urlParams.get('customer_email');
    console.log('PaymentHandler: Extracted email from URL:', email);
    return email;
  }

  // Get date one year from now
  getYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  // Clean up URL parameters
  cleanupURL() {
    console.log('PaymentHandler: Cleaning up URL...');
    
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location);
      console.log('PaymentHandler: URL before cleanup:', url.toString());
      
      // Remove payment-related parameters
      const paramsToRemove = [
        'success', 'session_id', 'payment_intent', 
        'payment_success', 'customer_email'
      ];
      
      paramsToRemove.forEach(param => {
        if (url.searchParams.has(param)) {
          console.log(`PaymentHandler: Removing parameter: ${param}`);
          url.searchParams.delete(param);
        }
      });
      
      console.log('PaymentHandler: URL after cleanup:', url.toString());
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  // Show success message to user
  showSuccessMessage(subscription, customMessage = null) {
    console.log('PaymentHandler: Showing success message...');
    
    const message = customMessage || 
      `🎉 Welcome to Code Compass! Your subscription is now active until ${new Date(subscription.expiresAt).toLocaleDateString()}.`;
    
    console.log('PaymentHandler: Success message:', message);
    
    // Create success banner
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
    
    // Remove banner after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 10000);
  }

  // Show error message to user
  showErrorMessage(message) {
    console.log('PaymentHandler: Showing error message:', message);
    
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

  // Check if user has paid subscription
  hasActiveSubscription() {
    const accessStatus = trialManager.getAccessStatus();
    return accessStatus.type === 'subscription' && accessStatus.hasAccess;
  }

  // Get subscription details
  getSubscriptionDetails() {
    if (!this.hasActiveSubscription()) {
      return null;
    }
    
    return trialManager.getSubscriptionStatus();
  }

  // Manual subscription activation (for testing)
  manualActivate(email = 'test@example.com') {
    console.log('PaymentHandler: Manual activation for email:', email);
    return this.handlePaymentSuccess({
      source: 'manual',
      customer_email: email,
      session_id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const paymentHandler = new PaymentHandler();

// Export individual functions for easier imports
export const {
  init,
  handlePaymentSuccess,
  testPaymentSuccess,
  hasActiveSubscription,
  getSubscriptionDetails,
  manualActivate
} = paymentHandler;

// Export for manual testing in console
if (typeof window !== 'undefined') {
  window.codecompass_activateSubscription = (email) => {
    return paymentHandler.manualActivate(email);
  };
  
  // Add debug function
  window.codecompass_debugPayment = () => {
    console.log('=== PAYMENT DEBUG INFO ===');
    console.log('Current URL:', window.location.href);
    console.log('URL Params:', new URLSearchParams(window.location.search));
    console.log('Trial Status:', trialManager.getTrialStatus());
    console.log('Access Status:', trialManager.getAccessStatus());
    console.log('LocalStorage subscriptionStatus:', localStorage.getItem('subscriptionStatus'));
    console.log('=========================');
  };
}