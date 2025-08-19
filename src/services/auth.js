// Authentication service with device management
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
  }

  // Generate device fingerprint (using existing method)
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

  // Get device info
  getDeviceInfo() {
    const fingerprint = this.generateDeviceFingerprint();
    return {
      id: `device_${fingerprint}_${Date.now()}`,
      fingerprint: fingerprint,
      name: this.getDeviceName(),
      browser: this.getBrowserInfo(),
      os: navigator.platform,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
  }

  // Get user-friendly device name
  getDeviceName() {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile Device';
    if (ua.includes('Tablet')) return 'Tablet';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Desktop';
  }

  // Get browser info
  getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Initialize auth state listener
  init() {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve(this.currentUser);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user);
        this.currentUser = user;
        
        if (user && !this.isInitialized) {
          // Register current device if user is logged in
          await this.registerCurrentDevice();
        }
        
        if (!this.isInitialized) {
          this.isInitialized = true;
          resolve(user);
        }
      });

      // Store unsubscribe function
      this.unsubscribe = unsubscribe;
    });
  }

  // Sign up new user
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await this.createUserProfile(user);
      
      // Register the current device
      await this.registerCurrentDevice();

      return {
        success: true,
        user: user,
        message: 'Account created successfully!'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign in existing user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check device limit before registering
      const canRegister = await this.canRegisterDevice();
      if (!canRegister.allowed) {
        return {
          success: false,
          error: 'device_limit_exceeded',
          message: canRegister.message,
          maxDevices: 3
        };
      }

      // Register the current device
      await this.registerCurrentDevice();

      return {
        success: true,
        user: user,
        message: 'Signed in successfully!'
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      
      // Clear local storage
      localStorage.removeItem('codecompass_device_token');
      
      return {
        success: true,
        message: 'Signed out successfully!'
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.code,
        message: 'Failed to sign out'
      };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent!'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Create user profile in Firestore
  async createUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
      subscription: {
        isActive: false,
        plan: null,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      },
      devices: [],
      maxDevices: 3,
      stats: {
        totalSearches: 0,
        lastActiveAt: serverTimestamp()
      }
    };

    await setDoc(userRef, userData);
    return userData;
  }

  // Check if current device can be registered (device limit check)
  async canRegisterDevice() {
    if (!this.currentUser) {
      return { allowed: false, message: 'User not authenticated' };
    }

    const deviceInfo = this.getDeviceInfo();
    const userRef = doc(db, 'users', this.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { allowed: true, message: 'New user' };
    }

    const userData = userDoc.data();
    const devices = userData.devices || [];
    
    // Check if this device is already registered
    const existingDevice = devices.find(device => 
      device.fingerprint === deviceInfo.fingerprint
    );
    
    if (existingDevice) {
      // Update last active time for existing device
      await this.updateDeviceActivity(existingDevice.id);
      return { allowed: true, message: 'Device already registered' };
    }

    // Check device limit
    if (devices.length >= userData.maxDevices) {
      return {
        allowed: false,
        message: `Maximum ${userData.maxDevices} devices allowed. Please remove a device first.`,
        currentDevices: devices.length,
        maxDevices: userData.maxDevices
      };
    }

    return { allowed: true, message: 'Device can be registered' };
  }

  // Register current device
  async registerCurrentDevice() {
    if (!this.currentUser) {
      console.log('No user logged in, skipping device registration');
      return null;
    }

    try {
      const deviceInfo = this.getDeviceInfo();
      const userRef = doc(db, 'users', this.currentUser.uid);
      
      // Add device to user's devices array
      await updateDoc(userRef, {
        devices: arrayUnion(deviceInfo),
        'stats.lastActiveAt': serverTimestamp()
      });

      // Store device token locally for quick access checks
      localStorage.setItem('codecompass_device_token', deviceInfo.id);
      
      console.log('Device registered:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Failed to register device:', error);
      return null;
    }
  }

  // Update device activity
  async updateDeviceActivity(deviceId) {
    if (!this.currentUser) return;

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const devices = userData.devices || [];
        
        // Update the specific device's lastActiveAt
        const updatedDevices = devices.map(device => 
          device.id === deviceId 
            ? { ...device, lastActiveAt: new Date().toISOString() }
            : device
        );
        
        await updateDoc(userRef, {
          devices: updatedDevices,
          'stats.lastActiveAt': serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Failed to update device activity:', error);
    }
  }

  // Remove a device
  async removeDevice(deviceId) {
    if (!this.currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const devices = userData.devices || [];
        const deviceToRemove = devices.find(device => device.id === deviceId);
        
        if (deviceToRemove) {
          await updateDoc(userRef, {
            devices: arrayRemove(deviceToRemove)
          });
          
          return { success: true, message: 'Device removed successfully' };
        } else {
          return { success: false, message: 'Device not found' };
        }
      }
      
      return { success: false, message: 'User data not found' };
    } catch (error) {
      console.error('Failed to remove device:', error);
      return { success: false, message: 'Failed to remove device' };
    }
  }

  // Get user's devices
  async getUserDevices() {
    if (!this.currentUser) return [];

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().devices || [];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get user devices:', error);
      return [];
    }
  }

  // Check if user has valid access
  async hasValidAccess() {
    if (!this.currentUser) return false;

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      const subscription = userData.subscription;
      
      // Check if subscription is active and not expired
      if (subscription && subscription.isActive && subscription.expiresAt) {
        const expiresAt = new Date(subscription.expiresAt.toDate ? subscription.expiresAt.toDate() : subscription.expiresAt);
        return expiresAt > new Date();
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check access:', error);
      return false;
    }
  }

  // Update user subscription
  async updateSubscription(subscriptionData) {
    if (!this.currentUser) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      
      const subscriptionUpdate = {
        'subscription.isActive': true,
        'subscription.plan': subscriptionData.plan || 'annual',
        'subscription.expiresAt': subscriptionData.expiresAt,
        'subscription.stripeCustomerId': subscriptionData.customerId,
        'subscription.stripeSubscriptionId': subscriptionData.subscriptionId,
        'subscription.activatedAt': serverTimestamp(),
        'stats.lastActiveAt': serverTimestamp()
      };

      await updateDoc(userRef, subscriptionUpdate);
      
      return { success: true, message: 'Subscription updated successfully' };
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return { success: false, message: 'Failed to update subscription' };
    }
  }

  // Get user-friendly error messages
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  // Cleanup
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;