// User migration utility for existing subscribers
// This helps migrate existing users to the new Firebase auth system

class UserMigration {
  constructor() {
    this.migrationStorage = 'codecompass_migration_data';
  }

  // Check if user has existing subscription data to migrate
  hasExistingSubscription() {
    const subscriptionData = localStorage.getItem('subscriptionStatus');
    if (!subscriptionData) return false;

    try {
      const subscription = JSON.parse(subscriptionData);
      const isActive = subscription.isActive && new Date(subscription.expiresAt) > new Date();
      return isActive;
    } catch (error) {
      return false;
    }
  }

  // Get existing subscription data
  getExistingSubscriptionData() {
    try {
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      if (!subscriptionData) return null;

      const subscription = JSON.parse(subscriptionData);
      
      // Validate subscription is still active
      if (!subscription.isActive || new Date(subscription.expiresAt) <= new Date()) {
        return null;
      }

      return {
        email: subscription.email || subscription.customer_email,
        plan: subscription.plan || 'annual',
        subscriptionId: subscription.subscriptionId,
        customerId: subscription.customerId,
        expiresAt: subscription.expiresAt,
        activatedAt: subscription.activatedAt || subscription.startDate,
        amount: subscription.amount || 7900,
        paymentSource: subscription.paymentSource || 'stripe'
      };
    } catch (error) {
      console.error('UserMigration: Error parsing subscription data:', error);
      return null;
    }
  }

  // Show migration prompt to user
  showMigrationPrompt() {
    const existingData = this.getExistingSubscriptionData();
    if (!existingData) return null;

    return {
      shouldPrompt: true,
      email: existingData.email,
      message: `We found an existing Code Compass subscription${existingData.email ? ` for ${existingData.email}` : ''}. Would you like to create an account to access Code Compass from multiple devices?`,
      benefits: [
        'Access from up to 3 devices (desktop, mobile, tablet)',
        'Sync your preferences across devices',
        'Never lose access when switching devices',
        'Manage your devices from your account'
      ],
      subscriptionInfo: {
        plan: existingData.plan,
        expiresAt: existingData.expiresAt,
        daysRemaining: Math.max(0, Math.ceil((new Date(existingData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
      }
    };
  }

  // Create account for existing subscriber
  async createAccountForExistingUser(email, password) {
    try {
      const existingData = this.getExistingSubscriptionData();
      if (!existingData) {
        return {
          success: false,
          error: 'No existing subscription found'
        };
      }

      // Import auth service
      const { authService } = await import('../services/auth.js');
      
      // Create new account
      const signUpResult = await authService.signUp(email, password);
      
      if (!signUpResult.success) {
        return signUpResult;
      }

      // Migrate subscription to new account
      const migrationResult = await this.migrateSubscriptionToAccount(signUpResult.user, existingData);
      
      if (!migrationResult.success) {
        // Account was created but migration failed
        return {
          success: false,
          error: 'Account created but subscription migration failed. Contact support.',
          user: signUpResult.user
        };
      }

      // Store migration completion
      this.markMigrationComplete(email, existingData.subscriptionId);

      return {
        success: true,
        user: signUpResult.user,
        message: 'Account created and subscription migrated successfully!',
        migrationData: migrationResult.migrationData
      };

    } catch (error) {
      console.error('UserMigration: Error creating account for existing user:', error);
      return {
        success: false,
        error: 'Failed to create account and migrate subscription'
      };
    }
  }

  // Sign in existing user and migrate if needed
  async signInAndMigrate(email, password) {
    try {
      // Import auth service
      const { authService } = await import('../services/auth.js');
      
      // Sign in user
      const signInResult = await authService.signIn(email, password);
      
      if (!signInResult.success) {
        return signInResult;
      }

      // Check if we have subscription data to migrate
      const existingData = this.getExistingSubscriptionData();
      
      if (existingData) {
        // Migrate subscription
        const migrationResult = await this.migrateSubscriptionToAccount(signInResult.user, existingData);
        
        if (migrationResult.success) {
          this.markMigrationComplete(email, existingData.subscriptionId);
          
          return {
            ...signInResult,
            migrated: true,
            message: 'Signed in successfully and subscription migrated!',
            migrationData: migrationResult.migrationData
          };
        }
      }

      return {
        ...signInResult,
        migrated: false
      };

    } catch (error) {
      console.error('UserMigration: Error signing in and migrating:', error);
      return {
        success: false,
        error: 'Failed to sign in and migrate subscription'
      };
    }
  }

  // Migrate subscription data to Firebase account
  async migrateSubscriptionToAccount(user, subscriptionData) {
    try {
      const { authService } = await import('../services/auth.js');
      
      // Update subscription in Firebase
      const result = await authService.updateSubscription({
        plan: subscriptionData.plan,
        expiresAt: subscriptionData.expiresAt,
        customerId: subscriptionData.customerId,
        subscriptionId: subscriptionData.subscriptionId,
        source: 'migration'
      });

      if (result.success) {
        console.log('UserMigration: Subscription migrated successfully');
        
        // Track migration
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'subscription_migrated', {
            subscription_id: subscriptionData.subscriptionId,
            customer_email: user.email,
            plan: subscriptionData.plan
          });
        }
        
        return {
          success: true,
          migrationData: {
            subscriptionId: subscriptionData.subscriptionId,
            plan: subscriptionData.plan,
            expiresAt: subscriptionData.expiresAt,
            migratedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to update subscription in Firebase'
        };
      }
      
    } catch (error) {
      console.error('UserMigration: Error migrating subscription:', error);
      return {
        success: false,
        error: 'Migration process failed'
      };
    }
  }

  // Mark migration as complete
  markMigrationComplete(email, subscriptionId) {
    const migrationData = {
      email: email,
      subscriptionId: subscriptionId,
      migratedAt: new Date().toISOString(),
      completed: true
    };

    localStorage.setItem(this.migrationStorage, JSON.stringify(migrationData));
    
    // Keep the original subscription data for a while as backup
    const originalData = localStorage.getItem('subscriptionStatus');
    if (originalData) {
      localStorage.setItem('subscriptionStatus_backup', originalData);
    }
  }

  // Check if user has completed migration
  isMigrationComplete() {
    try {
      const migrationData = localStorage.getItem(this.migrationStorage);
      if (!migrationData) return false;

      const data = JSON.parse(migrationData);
      return data.completed === true;
    } catch (error) {
      return false;
    }
  }

  // Get migration status
  getMigrationStatus() {
    return {
      hasExistingSubscription: this.hasExistingSubscription(),
      migrationComplete: this.isMigrationComplete(),
      shouldPromptMigration: this.hasExistingSubscription() && !this.isMigrationComplete(),
      existingData: this.getExistingSubscriptionData()
    };
  }

  // Manual migration for customer support
  async manualMigration(email, subscriptionId) {
    try {
      console.log(`UserMigration: Starting manual migration for ${email}, subscription ${subscriptionId}`);
      
      // Import auth service
      const { authService } = await import('../services/auth.js');
      
      // Check if user is signed in
      const currentUser = authService.currentUser;
      if (!currentUser || currentUser.email !== email) {
        return {
          success: false,
          error: 'User must be signed in with the correct email address'
        };
      }

      // Look for subscription data
      let subscriptionData = this.getExistingSubscriptionData();
      
      if (!subscriptionData || subscriptionData.subscriptionId !== subscriptionId) {
        // Create subscription data for manual migration
        subscriptionData = {
          email: email,
          plan: 'annual',
          subscriptionId: subscriptionId,
          customerId: `manual_${Date.now()}`,
          expiresAt: this.getYearFromNow(),
          activatedAt: new Date().toISOString(),
          amount: 7900,
          paymentSource: 'manual_migration'
        };
      }

      // Migrate to Firebase
      const migrationResult = await this.migrateSubscriptionToAccount(currentUser, subscriptionData);
      
      if (migrationResult.success) {
        this.markMigrationComplete(email, subscriptionId);
        
        return {
          success: true,
          message: 'Manual migration completed successfully',
          migrationData: migrationResult.migrationData
        };
      } else {
        return migrationResult;
      }
      
    } catch (error) {
      console.error('UserMigration: Manual migration error:', error);
      return {
        success: false,
        error: 'Manual migration failed'
      };
    }
  }

  // Utility to get one year from now
  getYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  // Clean up migration data (after successful migration)
  cleanupMigrationData() {
    // Keep backup for 30 days
    const migrationData = localStorage.getItem(this.migrationStorage);
    if (migrationData) {
      try {
        const data = JSON.parse(migrationData);
        const migrationDate = new Date(data.migratedAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (migrationDate < thirtyDaysAgo) {
          localStorage.removeItem('subscriptionStatus_backup');
          console.log('UserMigration: Cleaned up old migration backup data');
        }
      } catch (error) {
        console.error('UserMigration: Error cleaning up migration data:', error);
      }
    }
  }
}

// Export singleton instance
export const userMigration = new UserMigration();

// Export individual functions
export const {
  hasExistingSubscription,
  getExistingSubscriptionData,
  showMigrationPrompt,
  createAccountForExistingUser,
  signInAndMigrate,
  getMigrationStatus,
  manualMigration,
  isMigrationComplete
} = userMigration;

// Export for console debugging
if (typeof window !== 'undefined') {
  window.codecompass_migrationStatus = () => userMigration.getMigrationStatus();
  window.codecompass_manualMigration = (email, subscriptionId) => 
    userMigration.manualMigration(email, subscriptionId);
}