/**
 * RevenueCat Service Implementation
 * Secure RevenueCat wrapper with database-first approach
 *
 * IMPORTANT: RevenueCat is ONLY used for purchases.
 * Premium status should always be checked from your database.
 */

import Purchases, {
  type PurchasesPackage,
  type PurchasesOffering,
} from "react-native-purchases";
import type {
  IRevenueCatService,
  InitializeResult,
  PurchaseResult,
  RestoreResult,
} from "../../application/ports/IRevenueCatService";
import {
  RevenueCatInitializationError,
  RevenueCatPurchaseError,
  RevenueCatRestoreError,
  RevenueCatExpoGoError,
} from "../../domain/errors/RevenueCatError";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import {
  isUserCancelledError,
  getErrorMessage,
} from "../../domain/types/RevenueCatTypes";
import { isExpoGo, isDevelopment } from "../utils/ExpoGoDetector";
import { resolveApiKey, shouldUseTestStore } from "../utils/ApiKeyResolver";
import {
  syncPremiumStatus,
  notifyPurchaseCompleted,
  notifyRestoreCompleted,
} from "../utils/PremiumStatusSyncer";

export class RevenueCatService implements IRevenueCatService {
  private config: RevenueCatConfig;
  private isInitializedFlag: boolean = false;
  private usingTestStore: boolean = false;

  constructor(config: RevenueCatConfig = {}) {
    this.config = config;
    this.usingTestStore = shouldUseTestStore(config);
  }

  getRevenueCatKey(): string | null {
    return resolveApiKey(this.config);
  }

  isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  isUsingTestStore(): boolean {
    return this.usingTestStore;
  }

  async initialize(userId: string, apiKey?: string): Promise<InitializeResult> {
    if (isExpoGo() && !this.usingTestStore) {
      return { success: false, offering: null, hasPremium: false };
    }

    const key = apiKey || this.getRevenueCatKey();
    if (!key) {
      return { success: false, offering: null, hasPremium: false };
    }

    try {
      this.logTestStoreUsage();
      await Purchases.configure({ apiKey: key, appUserID: userId });
      this.isInitializedFlag = true;

      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      const hasPremium = !!customerInfo.entitlements.active["premium"];
      const offering = offerings.current;

      return { success: true, offering, hasPremium };
    } catch (error) {
      const errorMessage = getErrorMessage(error, "RevenueCat init failed");
      this.logInitError(errorMessage);
      return { success: false, offering: null, hasPremium: false };
    }
  }

  private logTestStoreUsage(): void {
    if (isDevelopment() && this.usingTestStore) {
      // eslint-disable-next-line no-console
      console.log("[RevenueCat] Using Test Store key for development");
    }
  }

  private logInitError(message: string): void {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.warn("[RevenueCat] Initialization failed:", message);
    }
  }

  async fetchOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isInitializedFlag) {
      return null;
    }

    if (isExpoGo() && !this.usingTestStore) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch {
      return null;
    }
  }

  async purchasePackage(
    pkg: PurchasesPackage,
    userId: string
  ): Promise<PurchaseResult> {
    if (!this.isInitializedFlag) {
      throw new RevenueCatInitializationError();
    }

    if (isExpoGo() && !this.usingTestStore) {
      throw new RevenueCatExpoGoError();
    }

    try {
      const purchaseResult = await Purchases.purchasePackage(pkg);
      const customerInfo = purchaseResult.customerInfo;
      const isPremium = !!customerInfo.entitlements.active["premium"];

      if (isPremium) {
        await syncPremiumStatus(this.config, userId, customerInfo);
        await notifyPurchaseCompleted(
          this.config,
          userId,
          pkg.product.identifier,
          customerInfo
        );
        return { success: true, isPremium: true, customerInfo };
      }

      throw new RevenueCatPurchaseError(
        "Purchase completed but premium entitlement not active",
        pkg.product.identifier
      );
    } catch (error) {
      if (isUserCancelledError(error)) {
        return { success: false, isPremium: false };
      }
      const errorMessage = getErrorMessage(error, "Purchase failed");
      throw new RevenueCatPurchaseError(errorMessage, pkg.product.identifier);
    }
  }

  async restorePurchases(userId: string): Promise<RestoreResult> {
    if (!this.isInitializedFlag) {
      throw new RevenueCatInitializationError();
    }

    if (isExpoGo() && !this.usingTestStore) {
      throw new RevenueCatExpoGoError();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = !!customerInfo.entitlements.active["premium"];

      if (isPremium) {
        await syncPremiumStatus(this.config, userId, customerInfo);
      }
      await notifyRestoreCompleted(this.config, userId, isPremium, customerInfo);

      return { success: isPremium, isPremium, customerInfo };
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Restore failed");
      throw new RevenueCatRestoreError(errorMessage);
    }
  }

  async reset(): Promise<void> {
    if (!this.isInitializedFlag) {
      return;
    }

    try {
      await Purchases.logOut();
      this.isInitializedFlag = false;
    } catch {
      // Reset errors are non-critical
    }
  }
}

let revenueCatServiceInstance: RevenueCatService | null = null;

export function initializeRevenueCatService(
  config?: RevenueCatConfig
): RevenueCatService {
  if (!revenueCatServiceInstance) {
    revenueCatServiceInstance = new RevenueCatService(config);
  }
  return revenueCatServiceInstance;
}

export function getRevenueCatService(): RevenueCatService | null {
  return revenueCatServiceInstance;
}

export function resetRevenueCatService(): void {
  revenueCatServiceInstance = null;
}
