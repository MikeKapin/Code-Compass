// Vercel-based authentication service for Code Compass
// Replaces Firebase auth with Vercel Postgres backend

class VercelAuthService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://codecompass-api.vercel.app'  // Your actual Vercel domain
      : 'http://localhost:5173'; // Development URL
    
    this.currentUser = null;
    this.isInitialized = false;
    this.authToken = null;
  }

  // Initialize the auth service
  async init() {
    if (this.isInitialized) return this.currentUser;

    try {
      // Check for existing session token
      this.authToken = localStorage.getItem('codecompass_auth_token');
      
      if (this.authToken) {
        // Validate token and get user info
        const userInfo = await this.getCurrentUser();
        if (userInfo) {
          this.currentUser = userInfo;
          console.log('VercelAuth: Restored session for user:', userInfo.email);
        } else {
          // Invalid token, clear it
          this.clearSession();
        }
      }

      this.isInitialized = true;
      return this.currentUser;

    } catch (error) {
      console.error('VercelAuth: Initialization failed:', error);
      this.clearSession();
      this.isInitialized = true;
      return null;
    }
  }

  // Sign up new user
  async signUp(email, password, deviceInfo = null) {
    try {
      // Generate device fingerprint if not provided
      const deviceData = deviceInfo || this.generateDeviceInfo();

      const response = await fetch(`${this.baseURL}/api/simple-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          deviceInfo: deviceData
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token and user info
        if (data.token) {
          this.authToken = data.token;
          localStorage.setItem('codecompass_auth_token', data.token);
        }
        
        this.currentUser = data.user;
        
        return {
          success: true,
          user: data.user,
          device: data.device,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error,
          message: data.message,
          errors: data.errors
        };
      }

    } catch (error) {
      console.error('VercelAuth: Sign up failed:', error);
      return {
        success: false,
        error: 'network_error',
        message: 'Network error occurred. Please try again.'
      };
    }
  }

  // Sign in existing user
  async signIn(email, password, deviceInfo = null) {
    try {
      // Generate device fingerprint if not provided
      const deviceData = deviceInfo || this.generateDeviceInfo();

      const response = await fetch(`${this.baseURL}/api/simple-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          deviceInfo: deviceData
        })
      });

      const data = await response.json();
      console.log('VercelAuth signIn: Raw API response:', data);
      console.log('VercelAuth signIn: data.user:', data.user);
      console.log('VercelAuth signIn: data.user.hasAccess:', data.user?.hasAccess);

      if (data.success) {
        // Store auth token and user info
        if (data.token) {
          this.authToken = data.token;
          localStorage.setItem('codecompass_auth_token', data.token);
        }
        
        this.currentUser = data.user;
        console.log('VercelAuth signIn: Set currentUser to:', this.currentUser);
        
        return {
          success: true,
          user: data.user,
          device: data.device,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error,
          message: data.message,
          currentDevices: data.currentDevices,
          maxDevices: data.maxDevices,
          devices: data.devices
        };
      }

    } catch (error) {
      console.error('VercelAuth: Sign in failed:', error);
      return {
        success: false,
        error: 'network_error',
        message: 'Network error occurred. Please try again.'
      };
    }
  }

  // Sign out user
  async signOut() {
    try {
      if (this.authToken) {
        await fetch(`${this.baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
      }

      this.clearSession();
      
      return {
        success: true,
        message: 'Signed out successfully'
      };

    } catch (error) {
      console.error('VercelAuth: Sign out failed:', error);
      this.clearSession(); // Clear locally even if server request fails
      
      return {
        success: true, // Still return success since we cleared locally
        message: 'Signed out successfully'
      };
    }
  }

  // Get current user information
  async getCurrentUser() {
    if (!this.authToken) return null;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return {
          ...data.user,
          subscription: data.subscription,
          devices: data.devices,
          hasAccess: data.hasAccess
        };
      } else {
        // Invalid token, clear session
        this.clearSession();
        return null;
      }

    } catch (error) {
      console.error('VercelAuth: Get current user failed:', error);
      return null;
    }
  }

  // Check if user has valid access
  async hasValidAccess() {
    const user = await this.getCurrentUser();
    return user?.hasAccess || false;
  }

  // Get user devices
  async getUserDevices() {
    if (!this.authToken) return [];

    try {
      const response = await fetch(`${this.baseURL}/api/devices/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return data.devices || [];
      } else {
        return [];
      }

    } catch (error) {
      console.error('VercelAuth: Get devices failed:', error);
      return [];
    }
  }

  // Remove a device
  async removeDevice(deviceId) {
    if (!this.authToken) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${this.baseURL}/api/devices/remove/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();

      if (data.success && data.wasCurrentDevice) {
        // If user removed current device, clear session
        this.clearSession();
      }

      return data;

    } catch (error) {
      console.error('VercelAuth: Remove device failed:', error);
      return {
        success: false,
        message: 'Failed to remove device'
      };
    }
  }

  // Update user subscription (called after successful payment)
  async updateSubscription(subscriptionData) {
    // For Vercel setup, subscription updates are handled by Stripe webhooks
    // But we can refresh user data to get the latest subscription status
    try {
      const user = await this.getCurrentUser();
      if (user) {
        this.currentUser = user;
        return { success: true, message: 'Subscription updated successfully' };
      } else {
        return { success: false, message: 'Failed to refresh user data' };
      }
    } catch (error) {
      console.error('VercelAuth: Update subscription failed:', error);
      return { success: false, message: 'Failed to update subscription' };
    }
  }

  // Generate device information for registration
  generateDeviceInfo() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('CodeCompass', 2, 2);
    
    const fingerprint = this.hashString(JSON.stringify({
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.slice(0, 150),
      canvas: canvas.toDataURL().slice(-50),
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      timestamp: Date.now()
    }));

    return {
      fingerprint: fingerprint,
      name: this.getDeviceName(),
      browser: this.getBrowserName(),
      os: this.getOSName()
    };
  }

  // Hash function for fingerprinting
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  // Get user-friendly device name
  getDeviceName() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'Mobile Device';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('macintosh')) return 'Mac';
    if (ua.includes('linux')) return 'Linux PC';
    return 'Desktop';
  }

  // Get browser name
  getBrowserName() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    return 'Unknown';
  }

  // Get OS name
  getOSName() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  // Clear user session
  clearSession() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('codecompass_auth_token');
  }

  // Check if user exists (for migration)
  async checkUserExists(email) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/check-user?email=${encodeURIComponent(email)}`, {
        method: 'GET'
      });

      const data = await response.json();
      return data.exists || false;

    } catch (error) {
      console.error('VercelAuth: Check user exists failed:', error);
      return false;
    }
  }

  // Get error message from error code
  getErrorMessage(errorCode) {
    const errorMessages = {
      'invalid_credentials': 'Invalid email or password. Please check your credentials.',
      'user_exists': 'An account with this email already exists. Please sign in instead.',
      'user_not_found': 'No account found with this email address.',
      'invalid_token': 'Your session has expired. Please sign in again.',
      'device_limit_exceeded': 'You have reached the maximum device limit (3). Please remove a device first.',
      'rate_limited': 'Too many attempts. Please try again later.',
      'validation_error': 'Please check your input and try again.',
      'network_error': 'Network error. Please check your connection and try again.',
      'server_error': 'Server error. Please try again later.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  // Cleanup
  destroy() {
    this.clearSession();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const vercelAuth = new VercelAuthService();
export default vercelAuth;