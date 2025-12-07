/**
 * RevenueCat Service Implementation
 * Secure RevenueCat wrapper with database-first approach
 */

import Purchases, { type PurchasesOffering } from "react-native-purchases";
import type {
  IRevenueCatService,
  InitializeResult,
  PurchaseResult,
  RestoreResult,
} from "../../application/ports/IRevenueCatService";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import { getErrorMessage } from "../../domain/types/RevenueCatTypes";
import { isExpoGo, isDevelopment } from "../utils/ExpoGoDetector";
import { resolveApiKey, shouldUseTestStore } from "../utils/ApiKeyResolver";
import { handlePurchase } from "./PurchaseHandler";
import { handleRestore } from "./RestoreHandler";
import type { PurchasesPackage } from "react-native-purchases";

export class RevenueCatService implements IRevenueCatService {
  private config: RevenueCatConfig;
  private isInitializedFlag: boolean = false;
  private usingTestStore: boolean = false;

  constructor(config: RevenueCatConfig = {}) {
    this.config = config;
    this.usingTestStore = shouldUseTestStore(config);
    this.logConfigStatus();
  }

  private logConfigStatus(): void {
    if (isDevelopment()) {
      const hasTestKey = !!this.config.testStoreKey;
      // eslint-disable-next-line no-console
      console.log("[RevenueCat] Config:", {
        hasTestKey,
        usingTestStore: this.usingTestStore,
        isExpoGo: isExpoGo(),
      });
    }
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
      this.logMissingKey();
      return { success: false, offering: null, hasPremium: false };
    }

    try {
      this.logInitStart();
      await Purchases.configure({ apiKey: key, appUserID: userId });
      this.isInitializedFlag = true;

      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      const hasPremium = !!customerInfo.entitlements.active["premium"];
      return { success: true, offering: offerings.current, hasPremium };
    } catch (error) {
      const errorMessage = getErrorMessage(error, "RevenueCat init failed");
      this.logInitError(errorMessage);
      return { success: false, offering: null, hasPremium: false };
    }
  }

  private logMissingKey(): void {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.warn("[RevenueCat] No API key available");
    }
  }

  private logInitStart(): void {
    if (isDevelopment() && this.usingTestStore) {
      // eslint-disable-next-line no-console
      console.log("[RevenueCat] Using Test Store key");
    }
  }

  private logInitError(message: string): void {
    if (isDevelopment()) {
      // eslint-disable-next-line no-console
      console.warn("[RevenueCat] Init failed:", message);
    }
  }

  async fetchOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isInitializedFlag) return null;
    if (isExpoGo() && !this.usingTestStore) return null;

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
    return handlePurchase(
      {
        config: this.config,
        isInitialized: () => this.isInitializedFlag,
        isUsingTestStore: () => this.usingTestStore,
      },
      pkg,
      userId
    );
  }

  async restorePurchases(userId: string): Promise<RestoreResult> {
    return handleRestore(
      {
        config: this.config,
        isInitialized: () => this.isInitializedFlag,
        isUsingTestStore: () => this.usingTestStore,
      },
      userId
    );
  }

  async reset(): Promise<void> {
    if (!this.isInitializedFlag) return;

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
