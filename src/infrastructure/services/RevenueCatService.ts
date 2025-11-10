/**
 * RevenueCat Service Implementation
 * Secure RevenueCat wrapper with database-first approach
 *
 * IMPORTANT: RevenueCat is ONLY used for purchases.
 * Premium status should always be checked from your database.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases, {
  type PurchasesPackage,
  type PurchasesOffering,
  type CustomerInfo,
} from "react-native-purchases";
import type { IRevenueCatService, InitializeResult, PurchaseResult, RestoreResult } from "../../application/ports/IRevenueCatService";
import {
  RevenueCatInitializationError,
  RevenueCatConfigurationError,
  RevenueCatPurchaseError,
  RevenueCatRestoreError,
  RevenueCatNetworkError,
  RevenueCatExpoGoError,
} from "../../domain/errors/RevenueCatError";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";

/**
 * Check if running in Expo Go
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === "storeClient";
}

/**
 * Get expiration date from RevenueCat entitlement
 */
function getExpirationDate(entitlement: any): string | null {
  if (!entitlement || !entitlement.expirationDate) {
    return null;
  }
  return new Date(entitlement.expirationDate).toISOString();
}

export class RevenueCatService implements IRevenueCatService {
  private config: RevenueCatConfig;
  private isInitializedFlag: boolean = false;

  constructor(config: RevenueCatConfig = {}) {
    this.config = config;
  }

  /**
   * Get RevenueCat API key for current platform
   */
  getRevenueCatKey(): string | null {
    const iosKey =
      this.config.iosApiKey ||
      Constants.expoConfig?.extra?.revenueCatIosKey ||
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
      "";
    const androidKey =
      this.config.androidApiKey ||
      Constants.expoConfig?.extra?.revenueCatAndroidKey ||
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
      "";

    const key = Platform.select({
      ios: iosKey,
      android: androidKey,
      default: iosKey,
    });

    // Return null instead of throwing - let initialize() handle the error
    if (!key || key === "" || key.includes("YOUR_")) {
      return null;
    }

    return key;
  }

  /**
   * Check if RevenueCat is initialized
   */
  isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  /**
   * Initialize RevenueCat SDK
   * Only called when subscription screen is opened (lazy initialization)
   */
  async initialize(userId: string, apiKey?: string): Promise<InitializeResult> {
    try {
      // Check if running in Expo Go
      if (isExpoGo()) {
        /* eslint-disable-next-line no-console */
        if (__DEV__) console.log("Expo Go app detected. Using RevenueCat in Browser Mode.");
        return {
          success: false,
          offering: null,
          hasPremium: false,
        };
      }

      const key = apiKey || this.getRevenueCatKey();
      if (!key) {
        /* eslint-disable-next-line no-console */
        if (__DEV__) {
          console.warn(
            "RevenueCat API key not found. Please provide iosApiKey or androidApiKey in config."
          );
        }
        return {
          success: false,
          offering: null,
          hasPremium: false,
        };
      }

      /* eslint-disable-next-line no-console */
      if (__DEV__) {
        console.log("🔑 RevenueCat API Key:", {
          keyPrefix: key.substring(0, 8) + "...",
          keyLength: key.length,
          platform: Platform.OS,
          isValidFormat: key.startsWith("appl_") || key.startsWith("goog_"),
        });
      }

      await Purchases.configure({ apiKey: key, appUserID: userId });
      this.isInitializedFlag = true;

      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      const hasPremium = !!customerInfo.entitlements.active["premium"];
      const offering = offerings.current;

      /* eslint-disable-next-line no-console */
      if (__DEV__) {
        console.log("🔵 RevenueCat initialized:", {
          hasPremium,
          hasOffering: !!offering,
          offeringIdentifier: offering?.identifier || "null",
          availableOfferings: Object.keys(offerings.all || {}),
          currentOfferingId: offerings.current?.identifier || "null",
        });

        if (!offering) {
          console.warn("⚠️ RevenueCat offering is null! Check RevenueCat dashboard:");
          console.warn("  1. Offering identifier must be 'default' (lowercase)");
          console.warn("  2. Offering must have packages added");
          console.warn("  3. Products must be matched in RevenueCat");
          console.warn("  4. App Store Connect products must be 'Ready to Submit'");
        }
      }

      return {
        success: true,
        offering,
        hasPremium,
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "RevenueCat init failed";

      /* eslint-disable-next-line no-console */
      if (__DEV__) {
        console.warn("RevenueCat initialization failed:", errorMessage);
      }

      // Check if it's Expo Go error
      if (
        errorMessage.includes("Expo Go") ||
        errorMessage.includes("native store is not available")
      ) {
        return {
          success: false,
          offering: null,
          hasPremium: false,
        };
      }

      // Return failure instead of throwing - graceful degradation
      return {
        success: false,
        offering: null,
        hasPremium: false,
      };
    }
  }

  /**
   * Fetch offerings from RevenueCat
   */
  async fetchOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isInitializedFlag) {
      /* eslint-disable-next-line no-console */
      if (__DEV__) {
        console.warn("RevenueCat is not initialized. Call initialize() first.");
      }
      return null;
    }

    if (isExpoGo()) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      /* eslint-disable-next-line no-console */
      if (__DEV__) {
        console.log("🔵 RevenueCat fetchOfferings:", {
          hasOffering: !!currentOffering,
          offeringIdentifier: currentOffering?.identifier || "null",
          availableOfferings: Object.keys(offerings.all || {}),
          packagesCount: currentOffering?.availablePackages?.length || 0,
        });

        if (!currentOffering) {
          console.warn("⚠️ RevenueCat offering is null after fetchOfferings!");
          console.warn("  1. Check RevenueCat dashboard - offering identifier must be 'default'");
          console.warn("  2. Ensure offering has packages with products");
          console.warn("  3. Verify App Store Connect products are 'Ready to Submit'");
        }
      }

      return currentOffering;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Fetch offerings failed";
      /* eslint-disable-next-line no-console */
      if (__DEV__) {
        console.warn("RevenueCat fetchOfferings failed:", errorMessage);
      }
      return null; // Return null instead of throwing - graceful degradation
    }
  }

  /**
   * Sync premium status to database
   */
  private async syncPremiumStatus(
    userId: string,
    customerInfo: CustomerInfo
  ): Promise<void> {
    const premiumEntitlement = customerInfo.entitlements.active["premium"];

    if (premiumEntitlement) {
      const productId = premiumEntitlement.productIdentifier;
      const expiresAt = getExpirationDate(premiumEntitlement);

      // Call callback if provided
      if (this.config.onPremiumStatusChanged) {
        try {
          await this.config.onPremiumStatusChanged(userId, true, productId, expiresAt || undefined);
        } catch (error) {
          // Don't fail purchase if callback fails
        }
      }
    } else {
      // Call callback if provided
      if (this.config.onPremiumStatusChanged) {
        try {
          await this.config.onPremiumStatusChanged(userId, false);
        } catch (error) {
          // Don't fail if callback fails
        }
      }
    }
  }

  /**
   * Purchase a package and sync to database
   */
  async purchasePackage(pkg: PurchasesPackage, userId: string): Promise<PurchaseResult> {
    if (!this.isInitializedFlag) {
      throw new RevenueCatInitializationError();
    }

    if (isExpoGo()) {
      throw new RevenueCatExpoGoError();
    }

    try {
      // Perform purchase
      const purchaseResult = await Purchases.purchasePackage(pkg);
      const customerInfo = purchaseResult.customerInfo;
      const isPremium = !!customerInfo.entitlements.active["premium"];

      if (isPremium) {
        // Sync to database
        await this.syncPremiumStatus(userId, customerInfo);

        // Call purchase completed callback if provided
        if (this.config.onPurchaseCompleted) {
          try {
            await this.config.onPurchaseCompleted(
              userId,
              pkg.product.identifier,
              customerInfo
            );
          } catch (error) {
            // Don't fail purchase if callback fails
          }
        }

        return {
          success: true,
          isPremium: true,
          customerInfo,
        };
      } else {
        throw new RevenueCatPurchaseError(
          "Purchase completed but premium entitlement not active",
          pkg.product.identifier
        );
      }
    } catch (error: any) {
      // Check if user cancelled
      if (error.userCancelled) {
        return {
          success: false,
          isPremium: false,
        };
      }

      const errorMessage = error instanceof Error ? error.message : "Purchase failed";
      throw new RevenueCatPurchaseError(errorMessage, pkg.product.identifier);
    }
  }

  /**
   * Restore purchases and sync to database
   */
  async restorePurchases(userId: string): Promise<RestoreResult> {
    if (!this.isInitializedFlag) {
      throw new RevenueCatInitializationError();
    }

    if (isExpoGo()) {
      throw new RevenueCatExpoGoError();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = !!customerInfo.entitlements.active["premium"];

      if (isPremium) {
        // Sync to database
        await this.syncPremiumStatus(userId, customerInfo);

        // Call restore completed callback if provided
        if (this.config.onRestoreCompleted) {
          try {
            await this.config.onRestoreCompleted(userId, true, customerInfo);
          } catch (error) {
            // Don't fail restore if callback fails
          }
        }

        return {
          success: true,
          isPremium: true,
          customerInfo,
        };
      } else {
        // Call restore completed callback even if no premium
        if (this.config.onRestoreCompleted) {
          try {
            await this.config.onRestoreCompleted(userId, false, customerInfo);
          } catch (error) {
            // Don't fail if callback fails
          }
        }

        return {
          success: false,
          isPremium: false,
        };
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Restore failed";
      throw new RevenueCatRestoreError(errorMessage);
    }
  }

  /**
   * Reset RevenueCat SDK (for logout)
   */
  async reset(): Promise<void> {
    if (!this.isInitializedFlag) {
      return;
    }

    try {
      await Purchases.logOut();
      this.isInitializedFlag = false;
    } catch (error) {
      // Ignore reset errors
    }
  }
}

/**
 * Singleton instance
 * Apps should use initializeRevenueCatService() to set up with their config
 */
let revenueCatServiceInstance: RevenueCatService | null = null;

/**
 * Initialize RevenueCat service with configuration
 */
export function initializeRevenueCatService(config?: RevenueCatConfig): RevenueCatService {
  if (!revenueCatServiceInstance) {
    revenueCatServiceInstance = new RevenueCatService(config);
  }
  return revenueCatServiceInstance;
}

/**
 * Get RevenueCat service instance
 * Returns null if service is not initialized (graceful degradation)
 */
export function getRevenueCatService(): RevenueCatService | null {
  if (!revenueCatServiceInstance) {
    /* eslint-disable-next-line no-console */
    if (__DEV__) {
      console.warn(
        "RevenueCat service is not initialized. Call initializeRevenueCatService() first."
      );
    }
    return null;
  }
  return revenueCatServiceInstance;
}

/**
 * Reset RevenueCat service (useful for testing)
 */
export function resetRevenueCatService(): void {
  revenueCatServiceInstance = null;
}

