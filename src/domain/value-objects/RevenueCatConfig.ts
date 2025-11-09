/**
 * RevenueCat Configuration Value Object
 * Validates and stores RevenueCat configuration
 */

export interface RevenueCatConfig {
  /** iOS API key */
  iosApiKey?: string;
  /** Android API key */
  androidApiKey?: string;
  /** Callback for premium status sync to database */
  onPremiumStatusChanged?: (userId: string, isPremium: boolean, productId?: string, expiresAt?: string) => Promise<void> | void;
  /** Callback for purchase completion */
  onPurchaseCompleted?: (userId: string, productId: string, customerInfo: any) => Promise<void> | void;
  /** Callback for restore completion */
  onRestoreCompleted?: (userId: string, isPremium: boolean, customerInfo: any) => Promise<void> | void;
}

export interface RevenueCatConfigRequired {
  iosApiKey: string;
  androidApiKey: string;
}

