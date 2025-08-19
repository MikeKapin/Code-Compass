// Enhanced access manager that works with VercelAuth + legacy local storage
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
      const authModule = await import('../services/vercelAuth.js');
      this.authService = authModule.vercelAuth;
      
      // Initialize VercelAuth
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
      // Check VercelAuth authentication first
      if (this.authService && this.authService.currentUser) {
        const vercelAccess = await this.checkVercelAccess();
        if (vercelAccess.hasAccess) {
          return {
            ...result,
            ...vercelAccess,
            source: 'vercel'
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

  // Check VercelAuth-based access
  async checkVercelAccess() {
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
            id: user.id,
            email: user.email,
            isAuthenticated: true
          },
          subscription: {
            isActive: user.hasAccess,
            plan: user.subscription?.plan || 'annual',
            source: 'vercel'
          },
          devices: devices
        };
      }

      return { hasAccess: false, user: { id: user.id, email: user.email, isAuthenticated: true } };

    } catch (error) {
      console.error('EnhancedAccessManager: VercelAuth access check failed:', error);
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
      // For VercelAuth users, search recording is handled by the backend
      if (accessStatus.source === 'vercel' && this.authService?.currentUser) {
        // Search recording is handled by the VercelAuth backend
        console.log('Search recorded for VercelAuth user:', query);
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


  // Get search statistics
  async getSearchStats() {
    const accessStatus = await this.getAccessStatus();
    
    if (accessStatus.source === 'vercel' && this.authService?.currentUser) {
      return await this.getVercelSearchStats();
    }
    
    // Fall back to trial manager stats
    return trialManager.getSearchStats();
  }

  // Get search stats from VercelAuth
  async getVercelSearchStats() {
    try {
      // For now, return unlimited stats for authenticated users
      // This could be enhanced to fetch actual stats from the backend
      return {
        totalSearches: 0, // Backend would track this
        unlimited: true
      };
    } catch (error) {
      console.error('EnhancedAccessManager: Failed to get VercelAuth search stats:', error);
      return { totalSearches: 0, unlimited: true };
    }
  }

  // Check if user should see migration prompt
  async shouldShowMigrationPrompt() {
    const accessStatus = await this.getAccessStatus();
    
    // Show migration prompt if:
    // 1. User has local access (subscription or trial)
    // 2. User is not authenticated with VercelAuth
    // 3. Migration hasn't been completed yet
    return (
      accessStatus.migrationNeeded && 
      accessStatus.source !== 'vercel' &&
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
        const user = await this.authService.getCurrentUser();
        if (user) {
          return {
            id: user.id,
            email: user.email,
            subscription: user.subscription,
            devices: user.devices || [],
            hasAccess: user.hasAccess,
            createdAt: user.createdAt
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
        id: this.currentUser.id,
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