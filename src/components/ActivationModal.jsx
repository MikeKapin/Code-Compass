// src/components/ActivationModal.jsx
// Modal for entering activation codes on multiple devices

import React, { useState } from 'react';

const ActivationModal = ({ isVisible, onClose, onActivationSuccess }) => {
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isVisible) return null;

  // Offline activation code validation for Android APK and network failures
  const validateOfflineCodes = (code) => {
    const upperCode = code.toUpperCase();
    
    // Master developer codes with unlimited access
    const masterCodes = [
      'DEV79MK1', // Master code for Mike (developer access)
      'CODECMPS', // Code Compass master
      'DEVUNLTD'  // Developer unlimited backup
    ];
    
    // 7-day trial codes for trade shows (can be used by multiple people)
    const trialCodes = [
      'SHOW2024', // Trade show demo code
      'TRIAL7DY', // 7-day trial code
      'EXPO2024', // Exhibition code
      'DEMO7DAY'  // Demo code
    ];
    
    if (masterCodes.includes(upperCode)) {
      return {
        success: true,
        activated: true,
        masterCode: true,
        message: 'Developer master code activated - unlimited device access!',
        usedActivations: 0,
        remainingActivations: 999,
        expiresAt: '2030-12-31T23:59:59.000Z' // Long expiration for testing
      };
    }
    
    if (trialCodes.includes(upperCode)) {
      // Calculate 7 days from now
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      
      return {
        success: true,
        activated: true,
        trialCode: true,
        message: 'Trade show trial activated! Full access for 7 days, then reverts to free version.',
        usedActivations: 0,
        remainingActivations: 1, // Single use per device
        expiresAt: expirationDate.toISOString(),
        trialDays: 7,
        isTrialActivation: true
      };
    }
    
    // Check if it's a paid user code format (XXXXXXXX with year suffix)
    if (/^[A-Z0-9]{6}\d{2}$/.test(upperCode)) {
      // Extract year from last 2 digits
      const yearSuffix = parseInt(upperCode.slice(-2));
      const currentYear = new Date().getFullYear() % 100;
      
      // Allow codes for current year, previous year, and next year (for flexibility)
      if (yearSuffix >= (currentYear - 1) && yearSuffix <= (currentYear + 1)) {
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 12 months from activation
        
        return {
          success: true,
          activated: true,
          paidCode: true,
          message: `Annual subscription activated! Valid until ${expirationDate.toLocaleDateString()}.`,
          usedActivations: 1,
          remainingActivations: 3, // 4 devices total - 1 used
          expiresAt: expirationDate.toISOString(),
          subscriptionYear: 2000 + yearSuffix
        };
      }
    }
    
    return {
      success: false,
      error: 'Invalid activation code. Please check your code and try again.'
    };
  };

  // Determine API endpoint based on environment
  const getApiEndpoint = () => {
    // Check if we're in Android APK (Capacitor) or localhost
    const isAndroidOrLocal = window.location.protocol === 'capacitor:' || 
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';
    
    if (isAndroidOrLocal) {
      // Use live web app URL for Android APK and localhost
      return 'https://codecompassapp.netlify.app/.netlify/functions/activation-manager';
    } else {
      // Use relative path for web deployment
      return '/.netlify/functions/activation-manager';
    }
  };

  const handleActivation = async () => {
    if (!activationCode.trim()) {
      setError('Please enter an activation code');
      return;
    }

    if (activationCode.length !== 8) {
      setError('Activation code must be 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Generate device ID
      const deviceId = getDeviceId();
      let result;
      
      try {
        // Try online validation first
        const apiEndpoint = getApiEndpoint();
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'use_activation_code',
            activationCode: activationCode.toUpperCase(),
            deviceId: deviceId
          })
        });

        if (!response.ok) {
          throw new Error('Network request failed');
        }
        
        result = await response.json();
      } catch (networkError) {
        console.log('Network validation failed, trying offline validation:', networkError.message);
        
        // Fall back to offline validation
        result = validateOfflineCodes(activationCode);
      }

      if (result.success) {
        // Store premium status locally
        const premiumData = {
          isActive: true,
          activatedAt: new Date().toISOString(),
          expiresAt: result.expiresAt,
          activationCode: activationCode.toUpperCase(),
          deviceId: deviceId,
          remainingActivations: result.remainingActivations,
          // Mark different code types
          isTrialActivation: result.isTrialActivation || false,
          trialCode: result.trialCode || false,
          masterCode: result.masterCode || false,
          paidCode: result.paidCode || false,
          subscriptionYear: result.subscriptionYear || null
        };

        localStorage.setItem('codecompass_subscription_data', JSON.stringify(premiumData));
        localStorage.setItem('subscriptionStatus', JSON.stringify(premiumData));

        // Different success messages for different code types
        let displayMessage = result.message || 'Activation successful!';
        if (result.trialCode) {
          displayMessage = `🎉 7-Day Trial Activated! Full access until ${new Date(result.expiresAt).toLocaleDateString()}. After trial expires, app reverts to free version.`;
        } else if (result.masterCode) {
          displayMessage = '🎉 Developer Access Activated! Unlimited premium features unlocked.';
        } else if (result.paidCode) {
          displayMessage = `🎉 Annual Subscription Activated! Premium access until ${new Date(result.expiresAt).toLocaleDateString()}.`;
        }
        
        setSuccessMessage(displayMessage);
        
        // Close modal and refresh app after delay
        const delay = result.trialCode ? 3000 : 2000;
        setTimeout(() => {
          onActivationSuccess(premiumData);
          onClose();
          window.location.reload();
        }, delay);

      } else {
        setError(result.error || 'Activation failed');
      }

    } catch (error) {
      console.error('Activation error:', error);
      // Try offline validation as final fallback
      const offlineResult = validateOfflineCodes(activationCode);
      if (offlineResult.success) {
        // Handle offline success
        const premiumData = {
          isActive: true,
          activatedAt: new Date().toISOString(),
          expiresAt: offlineResult.expiresAt,
          activationCode: activationCode.toUpperCase(),
          deviceId: getDeviceId(),
          remainingActivations: offlineResult.remainingActivations,
          isTrialActivation: offlineResult.isTrialActivation || false,
          trialCode: offlineResult.trialCode || false,
          masterCode: offlineResult.masterCode || false,
          paidCode: offlineResult.paidCode || false,
          offlineActivation: true // Mark as offline activation
        };

        localStorage.setItem('codecompass_subscription_data', JSON.stringify(premiumData));
        localStorage.setItem('subscriptionStatus', JSON.stringify(premiumData));
        
        setSuccessMessage(offlineResult.message);
        setTimeout(() => {
          onActivationSuccess(premiumData);
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setError('Unable to validate activation code. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('codecompass_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('codecompass_device_id', deviceId);
    }
    return deviceId;
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setActivationCode(value);
      setError('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>

      {/* Modal content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        padding: '40px 30px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔑</div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#333'
          }}>
            Activate Code Compass
          </h2>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '1rem'
          }}>
            Enter your 8-character activation code to unlock premium features
          </p>
        </div>

        {/* Activation code input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333'
          }}>
            Activation Code
          </label>
          <input
            type="text"
            value={activationCode}
            onChange={handleInputChange}
            placeholder="XXXXXXXX"
            maxLength={8}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '4px',
              borderRadius: '8px',
              border: '2px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              outline: 'none',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              textTransform: 'uppercase'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4CAF50';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.backgroundColor = '#f8fafc';
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            border: '1px solid #bbf7d0'
          }}>
            {successMessage}
          </div>
        )}

        {/* Activate button */}
        <button
          onClick={handleActivation}
          disabled={isLoading || activationCode.length !== 8}
          style={{
            width: '100%',
            background: activationCode.length === 8 && !isLoading ? 
              'linear-gradient(135deg, #4CAF50, #45a049)' : '#94a3b8',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: activationCode.length === 8 && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            marginBottom: '20px'
          }}
        >
          {isLoading ? 'Activating...' : 'Activate Premium Features'}
        </button>

        {/* Help text */}
        <div style={{
          textAlign: 'center',
          padding: '16px 0',
          borderTop: '1px solid #e2e8f0',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Don't have an activation code?</strong>
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            Purchase Code Compass for $79 and get 4 device activations.
          </p>
          <p style={{ margin: 0 }}>
            Each activation code works on: Phone + Tablet + Computer + 1 Spare
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivationModal;