// utils/paymentHandler.js - Freemium Model
// Handle payment success and subscription activation (no trial system)

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
  async handlePaymentSuccess(paymentData = {}) {
    try {
      console.log('PaymentHandler: 🎉 Processing payment success...', paymentData);
      
      // Extract email from payment data or URL
      const email = paymentData.customer_email || this.extractEmailFromURL() || 'unknown@example.com';
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
        amount: 7900,
        paymentSource: paymentData.source || 'manual',
        startDate: new Date().toISOString(),
        activatedAt: new Date().toISOString(),
        expiresAt: paymentData.expiresAt || this.getYearFromNow()
      };

      console.log('PaymentHandler: Created subscription data:', subscriptionData);

      // Generate annual subscription activation code for multi-device use
      console.log('PaymentHandler: Generating annual subscription activation code...');
      let activationCode = null;
      let subscriptionYear = new Date().getFullYear();
      try {
        // Determine API endpoint based on environment (same logic as ActivationModal)
        const isAndroidOrLocal = window.location.protocol === 'capacitor:' || 
                               window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';
        
        const apiEndpoint = isAndroidOrLocal 
          ? 'https://codecompassapp.netlify.app/.netlify/functions/activation-manager'
          : '/.netlify/functions/activation-manager';

        const activationResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'create_paid_user_code',
            email: email,
            paymentData: {
              session_id: subscriptionData.subscriptionId,
              customer_id: subscriptionData.customerId,
              paymentId: paymentData.session_id || paymentData.payment_intent
            }
          })
        });

        const activationResult = await activationResponse.json();
        if (activationResult.success) {
          activationCode = activationResult.activationCode;
          subscriptionYear = activationResult.subscriptionYear;
          console.log('PaymentHandler: Generated annual activation code:', activationCode, 'for year:', subscriptionYear);
          
          // Update subscription data with annual info
          subscriptionData.subscriptionYear = subscriptionYear;
          subscriptionData.renewalDate = activationResult.renewalDate;
          subscriptionData.codeType = 'annual_subscription';
        }
      } catch (error) {
        console.error('PaymentHandler: Failed to generate activation code:', error);
        // Fallback: generate local annual code format
        const yearSuffix = (subscriptionYear % 100).toString().padStart(2, '0');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        activationCode = code + yearSuffix;
        console.log('PaymentHandler: Generated fallback activation code:', activationCode);
      }

      // Add activation code to subscription data
      if (activationCode) {
        subscriptionData.activationCode = activationCode;
        subscriptionData.maxActivations = 4;
        subscriptionData.usedActivations = 1; // This device counts as first activation
      }

      // Send activation code email to customer
      if (activationCode && email && email !== 'unknown@example.com') {
        console.log('PaymentHandler: Sending activation email to:', email);
        try {
          const emailApiEndpoint = window.location.protocol === 'capacitor:' ||
                                  window.location.hostname === 'localhost' ||
                                  window.location.hostname === '127.0.0.1'
            ? 'https://codecompassapp.netlify.app/.netlify/functions/send-activation-email'
            : '/.netlify/functions/send-activation-email';

          const emailResponse = await fetch(emailApiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              activationCode: activationCode,
              customerName: paymentData.customer_name || null,
              subscriptionData: {
                subscriptionYear: subscriptionYear,
                expiresAt: subscriptionData.expiresAt,
                plan: subscriptionData.plan
              }
            })
          });

          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            console.log('PaymentHandler: ✅ Activation email sent successfully!');
          } else {
            console.error('PaymentHandler: Failed to send email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('PaymentHandler: Email sending failed:', emailError);
          // Continue even if email fails - user still has the code in the modal
        }
      }

      // Call payment webhook to update database
      console.log('PaymentHandler: Calling payment webhook...');
      try {
        const baseURL = window.location.origin;
        const response = await fetch(`${baseURL}/api/payment-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            sessionId: subscriptionData.subscriptionId,
            customerId: subscriptionData.customerId,
            subscriptionType: subscriptionData.plan
          })
        });

        const webhookResult = await response.json();
        console.log('PaymentHandler: Webhook response:', webhookResult);

        if (!webhookResult.success) {
          console.error('PaymentHandler: Webhook failed:', webhookResult);
        }
      } catch (webhookError) {
        console.error('PaymentHandler: Webhook call failed:', webhookError);
        // Continue with local storage activation even if webhook fails
      }

      // Store subscription in localStorage (using the format App.jsx expects)
      localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData));
      localStorage.setItem('codecompass_subscription_data', JSON.stringify(subscriptionData));
      console.log('PaymentHandler: Stored in localStorage');
      
      const subscription = subscriptionData;
      console.log('PaymentHandler: Subscription data:', subscription);

      // Track successful conversion
      if (typeof trackEvent === 'function') {
        console.log('PaymentHandler: Tracking conversion event...');
        trackEvent('subscription_activated', {
          subscription_id: subscription.subscriptionId,
          customer_email: email,
          plan: 'annual',
          amount: 79.00,
          source: paymentData.source || 'manual',
          freemium_conversion: true
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

      // Show success message with activation code
      this.showSuccessMessage(subscription, activationCode);

      console.log('PaymentHandler: ✅ Payment success processing complete!');
      console.log('PaymentHandler: Final subscription:', subscription);
      
      return subscription;

    } catch (error) {
      console.error('PaymentHandler: ❌ Failed to handle payment success:', error);
      this.showErrorMessage('Payment processed but activation failed. Contact support.');
    }
  }

  // Test payment success (for development)
  async testPaymentSuccess() {
    console.log('PaymentHandler: 🧪 Testing payment success...');
    
    const testPaymentData = {
      source: 'test',
      session_id: `test_sub_${Date.now()}`,
      customer_id: `test_cus_${Date.now()}`,
      customer_email: 'test@example.com',
      timestamp: new Date().toISOString()
    };
    
    console.log('PaymentHandler: Test payment data:', testPaymentData);
    return await this.handlePaymentSuccess(testPaymentData);
  }

  // Activate with manual code (for customer service)
  async activateWithCode(code) {
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

      const subscription = await this.handlePaymentSuccess(subscriptionData);
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
  showSuccessMessage(subscription, activationCode = null) {
    console.log('PaymentHandler: Showing success message...');

    let message;
    let codeDisplay = '';
    if (activationCode) {
      const subscriptionYear = subscription.subscriptionYear || new Date().getFullYear();
      const expiryDate = new Date(subscription.expiresAt).toLocaleDateString();
      message = `🎉 Welcome to Code Compass! Your ${subscriptionYear} activation code is valid until ${expiryDate} and can be used on up to 4 devices (Phone + Tablet + Computer + 1 Spare).`;
      codeDisplay = activationCode;
    } else {
      message = `🎉 Welcome to Code Compass! Your subscription is now active until ${new Date(subscription.expiresAt).toLocaleDateString()}.`;
    }

    console.log('PaymentHandler: Success message:', message);

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create success modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 40px 30px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    `;

    modal.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 16px;">🎉</div>
      <h2 style="color: #333; font-size: 1.8rem; font-weight: 700; margin: 0 0 16px 0;">Payment Successful!</h2>
      <p style="color: #666; font-size: 1rem; margin: 0 0 24px 0;">${message}</p>
      ${codeDisplay ? `
        <div style="background: #f8fafc; border: 2px solid #4CAF50; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #333; font-weight: 600; margin: 0 0 12px 0;">Your Activation Code:</p>
          <div style="font-size: 2rem; font-weight: 700; color: #4CAF50; letter-spacing: 4px; font-family: monospace; margin-bottom: 16px;">${codeDisplay}</div>
          <button id="copyCodeBtn" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
            📋 Copy Code
          </button>
          <p style="color: #888; font-size: 0.85rem; margin: 12px 0 0 0;">⚠️ Please save this code! You'll need it to activate the app on your devices.</p>
        </div>
      ` : ''}
      <button id="closeSuccessBtn" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1.1rem; width: 100%;">
        Continue to Code Compass
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Copy code functionality
    if (codeDisplay) {
      const copyBtn = document.getElementById('copyCodeBtn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeDisplay).then(() => {
          copyBtn.textContent = '✓ Copied!';
          copyBtn.style.background = '#45a049';
          setTimeout(() => {
            copyBtn.innerHTML = '📋 Copy Code';
            copyBtn.style.background = '#4CAF50';
          }, 2000);
        });
      });
    }

    // Close modal
    const closeBtn = document.getElementById('closeSuccessBtn');
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      // Reload page to show premium features
      window.location.reload();
    });
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
    const subscriptionData = localStorage.getItem('codecompass_subscription_data') || localStorage.getItem('subscriptionStatus');
    
    if (!subscriptionData) return false;
    
    try {
      const subscription = JSON.parse(subscriptionData);
      const now = new Date().getTime();
      const expiresAt = new Date(subscription.expiresAt).getTime();
      
      return subscription.isActive && expiresAt > now;
    } catch (error) {
      return false;
    }
  }

  // Get subscription details
  getSubscriptionDetails() {
    if (!this.hasActiveSubscription()) {
      return null;
    }
    
    const subscriptionData = localStorage.getItem('codecompass_subscription_data') || localStorage.getItem('subscriptionStatus');
    try {
      return JSON.parse(subscriptionData);
    } catch (error) {
      return null;
    }
  }

  // Manual subscription activation (for testing)
  async manualActivate(email = 'test@example.com') {
    console.log('PaymentHandler: Manual activation for email:', email);
    return await this.handlePaymentSuccess({
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

// Start payment process (freemium upgrade)
PaymentHandler.prototype.startPayment = function() {
  console.log('PaymentHandler: Starting payment process...');
  
  // Replace with your actual payment URL
  const paymentURL = 'https://buy.stripe.com/your-payment-link';
  
  // Open payment in new window
  window.open(paymentURL, '_blank');
};

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
    console.log('Has Active Subscription:', paymentHandler.hasActiveSubscription());
    console.log('Subscription Details:', paymentHandler.getSubscriptionDetails());
    console.log('LocalStorage subscriptionStatus:', localStorage.getItem('subscriptionStatus'));
    console.log('LocalStorage codecompass_subscription_data:', localStorage.getItem('codecompass_subscription_data'));
    console.log('=========================');
  };
}