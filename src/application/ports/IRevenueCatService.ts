/**
 * RevenueCat Service Interface
 * Port for subscription operations
 */

import type { PurchasesPackage, PurchasesOffering, CustomerInfo } from "react-native-purchases";

export interface InitializeResult {
  success: boolean;
  offering: PurchasesOffering | null;
  hasPremium: boolean;
}

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  customerInfo?: CustomerInfo;
  isConsumable?: boolean;
  productId?: string;
}

export interface RestoreResult {
  success: boolean;
  isPremium: boolean;
  customerInfo?: CustomerInfo;
}

export interface IRevenueCatService {
  /**
   * Initialize RevenueCat SDK
   */
  initialize(userId: string, apiKey: string): Promise<InitializeResult>;

  /**
   * Fetch offerings from RevenueCat
   */
  fetchOfferings(): Promise<PurchasesOffering | null>;

  /**
   * Purchase a package
   */
  purchasePackage(pkg: PurchasesPackage, userId: string): Promise<PurchaseResult>;

  /**
   * Restore purchases
   */
  restorePurchases(userId: string): Promise<RestoreResult>;

  /**
   * Reset RevenueCat SDK (for logout)
   */
  reset(): Promise<void>;

  /**
   * Get RevenueCat API key for current platform
   */
  getRevenueCatKey(): string | null;

  /**
   * Check if RevenueCat is initialized
   */
  isInitialized(): boolean;
}

