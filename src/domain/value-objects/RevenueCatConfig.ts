/**
 * RevenueCat Configuration Value Object
 * Validates and stores RevenueCat configuration
 */

import type { CustomerInfo } from "react-native-purchases";

export interface RevenueCatConfig {
  /** iOS API key */
  iosApiKey?: string;
  /** Android API key */
  androidApiKey?: string;
  /** Test Store key for development/Expo Go testing */
  testStoreKey?: string;
  /** Entitlement identifier to check for premium status (default: 'premium') */
  entitlementIdentifier?: string;
  /** Callback for premium status sync to database */
  onPremiumStatusChanged?: (
    userId: string,
    isPremium: boolean,
    productId?: string,
    expiresAt?: string
  ) => Promise<void> | void;
  /** Callback for purchase completion */
  onPurchaseCompleted?: (
    userId: string,
    productId: string,
    customerInfo: CustomerInfo
  ) => Promise<void> | void;
  /** Callback for restore completion */
  onRestoreCompleted?: (
    userId: string,
    isPremium: boolean,
    customerInfo: CustomerInfo
  ) => Promise<void> | void;
}

export interface RevenueCatConfigRequired {
  iosApiKey: string;
  androidApiKey: string;
}

