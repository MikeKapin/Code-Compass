// Enhanced access manager that works with Firebase + legacy local storage
// This provides unified access control across authentication methods

import { trialManager } from './trialManager.js';

class EnhancedAccessManager {
  constructor() {
    this.currentUser = null;
    this.authService = null;
    this.isInitialized = false;
  }

  // Initialize the access manager
  async init() {
    if (this.isInitialized) return;

    try {
      // Import auth service
      const authModule = await import('../services/auth.js');
      this.authService = authModule.authService;
      
      // Initialize Firebase auth
      await this.authService.init();
      this.currentUser = this.authService.currentUser;
      
      console.log('EnhancedAccessManager: Initialized with user:', this.currentUser?.email || 'no user');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('EnhancedAccessManager: Failed to initialize:', error);
      this.isInitialized = true; // Continue without Firebase
    }
  }

  // Get comprehensive access status (Firebase + local storage)
  async getAccessStatus() {
    await this.init();

    const result = {
      hasAccess: false,
      type: null,
      source: null,
      user: null,
      subscription: null,
      trial: null,
      devices: [],
      migrationNeeded: false
    };

    try {
      // Check Firebase authentication first
      if (this.authService && this.authService.currentUser) {
        const firebaseAccess = await this.checkFirebaseAccess();
        if (firebaseAccess.hasAccess) {
          return {
            ...result,
            ...firebaseAccess,
            source: 'firebase'
          };
        }
      }

      // Fall back to local storage (legacy system)
      const localAccess = this.checkLocalStorageAccess();
      return {
        ...result,
        ...localAccess,
        source: 'localStorage',
        migrationNeeded: localAccess.hasAccess // If they have local access, they should migrate
      };

    } catch (error) {
      console.error('EnhancedAccessManager: Error checking access:', error);
      
      // Emergency fallback to trial manager
      const trialAccess = trialManager.getAccessStatus();
      return {
        ...result,
        hasAccess: trialAccess.hasAccess,
        type: trialAccess.type,
        source: 'trialManager',
        trial: trialAccess
      };
    }
  }

  // Check Firebase-based access
  async checkFirebaseAccess() {
    try {
      if (!this.authService || !this.authService.currentUser) {
        return { hasAccess: false };
      }

      const user = this.authService.currentUser;
      const hasValidAccess = await this.authService.hasValidAccess();
      
      if (hasValidAccess) {
        // Get user devices
        const devices = await this.authService.getUserDevices();
        
        return {
          hasAccess: true,
          type: 'subscription',
          user: {
            uid: user.uid,
            email: user.email,
            isAuthenticated: true
          },
          subscription: {
            isActive: true,
            plan: 'annual', // You might want to fetch this from Firebase
            source: 'firebase'
          },
          devices: devices
        };
      }

      return { hasAccess: false, user: { uid: user.uid, email: user.email, isAuthenticated: true } };

    } catch (error) {
      console.error('EnhancedAccessManager: Firebase access check failed:', error);
      return { hasAccess: false };
    }
  }

  // Check local storage access (legacy)
  checkLocalStorageAccess() {
    try {
      // First check for active subscription in localStorage
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        
        if (subscription.isActive && new Date(subscription.expiresAt) > new Date()) {
          return {
            hasAccess: true,
            type: 'subscription',
            subscription: {
              ...subscription,
              source: 'localStorage'
            }
          };
        }
      }

      // Fall back to trial manager
      const trialAccess = trialManager.getAccessStatus();
      return {
        hasAccess: trialAccess.hasAccess,
        type: trialAccess.type,
        trial: trialAccess
      };

    } catch (error) {
      console.error('EnhancedAccessManager: Local storage access check failed:', error);
      return { hasAccess: false };
    }
  }

  // Check if user can perform searches
  async canPerformSearch() {
    const accessStatus = await this.getAccessStatus();
    return accessStatus.hasAccess;
  }

  // Record a search (works across all access types)
  async recordSearch(query, resultCount = 0) {
    const accessStatus = await this.getAccessStatus();
    
    if (!accessStatus.hasAccess) {
      return {
        success: false,
        error: 'No valid access for search'
      };
    }

    try {
      // For Firebase users, you might want to record searches in Firestore
      if (accessStatus.source === 'firebase' && this.authService?.currentUser) {
        await this.recordSearchInFirebase(query, resultCount);
      }

      // Also record in trial manager for backwards compatibility
      const recordResult = trialManager.recordSearch(query, resultCount);
      
      return {
        success: recordResult,
        accessType: accessStatus.type,
        source: accessStatus.source
      };

    } catch (error) {
      console.error('EnhancedAccessManager: Error recording search:', error);
      return {
        success: false,
        error: 'Failed to record search'
      };
    }
  }

  // Record search in Firebase (for authenticated users)
  async recordSearchInFirebase(query, resultCount) {
    try {
      if (!this.authService?.currentUser) return;

      // Import Firestore functions
      const { doc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebase.js');
      
      const userRef = doc(db, 'users', this.authService.currentUser.uid);
      
      // Update search stats
      await updateDoc(userRef, {
        'stats.totalSearches': increment(1),
        'stats.lastSearchAt': serverTimestamp(),
        'stats.lastSearchQuery': query.toLowerCase().trim(),
        'stats.lastActiveAt': serverTimestamp()
      });

    } catch (error) {
      console.error('EnhancedAccessManager: Failed to record search in Firebase:', error);
      // Don't throw - search recording is not critical
    }
  }

  // Get search statistics
  async getSearchStats() {
    const accessStatus = await this.getAccessStatus();
    
    if (accessStatus.source === 'firebase' && this.authService?.currentUser) {
      return await this.getFirebaseSearchStats();
    }
    
    // Fall back to trial manager stats
    return trialManager.getSearchStats();
  }

  // Get search stats from Firebase
  async getFirebaseSearchStats() {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase.js');
      
      const userRef = doc(db, 'users', this.authService.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const stats = userData.stats || {};
        
        return {
          totalSearches: stats.totalSearches || 0,
          lastSearchAt: stats.lastSearchAt,
          lastSearchQuery: stats.lastSearchQuery,
          // Note: Daily search limits don't apply to paid subscribers
          dailyLimit: null,
          unlimited: true
        };
      }
      
      return { totalSearches: 0, unlimited: true };

    } catch (error) {
      console.error('EnhancedAccessManager: Failed to get Firebase search stats:', error);
      return { totalSearches: 0, unlimited: true };
    }
  }

  // Check if user should see migration prompt
  async shouldShowMigrationPrompt() {
    const accessStatus = await this.getAccessStatus();
    
    // Show migration prompt if:
    // 1. User has local access (subscription or trial)
    // 2. User is not authenticated with Firebase
    // 3. Migration hasn't been completed yet
    return (
      accessStatus.migrationNeeded && 
      accessStatus.source !== 'firebase' &&
      !this.isMigrationCompleted()
    );
  }

  // Check if migration has been completed
  isMigrationCompleted() {
    try {
      const migrationData = localStorage.getItem('codecompass_migration_data');
      if (!migrationData) return false;

      const data = JSON.parse(migrationData);
      return data.completed === true;
    } catch (error) {
      return false;
    }
  }

  // Get user profile information
  async getUserProfile() {
    await this.init();

    if (this.authService && this.authService.currentUser) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase.js');
        
        const userRef = doc(db, 'users', this.authService.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            uid: this.authService.currentUser.uid,
            email: this.authService.currentUser.email,
            subscription: userData.subscription,
            devices: userData.devices || [],
            stats: userData.stats || {},
            createdAt: userData.createdAt
          };
        }
      } catch (error) {
        console.error('EnhancedAccessManager: Failed to get user profile:', error);
      }
    }

    // Fall back to local data
    const localSubscription = localStorage.getItem('subscriptionStatus');
    if (localSubscription) {
      try {
        const subscription = JSON.parse(localSubscription);
        return {
          email: subscription.email,
          subscription: subscription,
          isLocal: true
        };
      } catch (error) {
        console.error('EnhancedAccessManager: Failed to parse local subscription:', error);
      }
    }

    return null;
  }

  // Sign out user
  async signOut() {
    if (this.authService) {
      await this.authService.signOut();
      this.currentUser = null;
    }
  }

  // Emergency access check (when Firebase is down)
  emergencyAccessCheck() {
    console.warn('EnhancedAccessManager: Using emergency access check');
    return this.checkLocalStorageAccess();
  }

  // Get debug information
  async getDebugInfo() {
    await this.init();
    
    return {
      isInitialized: this.isInitialized,
      hasAuthService: !!this.authService,
      currentUser: this.currentUser ? {
        uid: this.currentUser.uid,
        email: this.currentUser.email
      } : null,
      localStorage: {
        subscriptionStatus: !!localStorage.getItem('subscriptionStatus'),
        trialData: !!localStorage.getItem('codecompass_trial_data'),
        migrationData: !!localStorage.getItem('codecompass_migration_data')
      },
      accessStatus: await this.getAccessStatus()
    };
  }
}

// Export singleton instance
export const enhancedAccessManager = new EnhancedAccessManager();

// Export individual functions for easier imports
export const {
  getAccessStatus,
  canPerformSearch,
  recordSearch,
  getSearchStats,
  shouldShowMigrationPrompt,
  getUserProfile,
  signOut,
  getDebugInfo
} = enhancedAccessManager;

// Export for console debugging
if (typeof window !== 'undefined') {
  window.codecompass_accessDebug = () => enhancedAccessManager.getDebugInfo();
  window.codecompass_accessStatus = () => enhancedAccessManager.getAccessStatus();
  window.codecompass_canSearch = () => enhancedAccessManager.canPerformSearch();
}