/**
 * RevenueCat Service Implementation
 * Secure RevenueCat wrapper with database-first approach
 */

import Purchases, {
  type PurchasesOffering,
} from "react-native-purchases";
import type {
  IRevenueCatService,
  InitializeResult,
  PurchaseResult,
  RestoreResult,
} from "../../application/ports/IRevenueCatService";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import { getErrorMessage } from "../../domain/types/RevenueCatTypes";
import { isExpoGo } from "../utils/ExpoGoDetector";
import { resolveApiKey } from "../utils/ApiKeyResolver";
import { Logger } from "../utils/Logger";
import { handlePurchase } from "./PurchaseHandler";
import { handleRestore } from "./RestoreHandler";
import { CustomerInfoListenerManager } from "./CustomerInfoListenerManager";
import { ServiceStateManager } from "./ServiceStateManager";
import type { PurchasesPackage } from "react-native-purchases";

export class RevenueCatService implements IRevenueCatService {
  private stateManager: ServiceStateManager;
  private listenerManager: CustomerInfoListenerManager;

  constructor(config: RevenueCatConfig = {}) {
    this.stateManager = new ServiceStateManager(config);
    this.listenerManager = new CustomerInfoListenerManager(config.entitlementIdentifier);
  }

  getRevenueCatKey(): string | null {
    return resolveApiKey(this.stateManager.getConfig());
  }

  isInitialized(): boolean {
    return this.stateManager.isInitialized();
  }

  isUsingTestStore(): boolean {
    return this.stateManager.isUsingTestStore();
  }

  async initialize(userId: string, apiKey?: string): Promise<InitializeResult> {
    if (isExpoGo() && !this.isUsingTestStore()) {
      return { success: false, offering: null, hasPremium: false };
    }

    const key = apiKey || this.getRevenueCatKey();
    if (!key) {
      Logger.warn('No API key available');
      return { success: false, offering: null, hasPremium: false };
    }

    try {
      if (this.isUsingTestStore()) {
        Logger.log('Using Test Store key');
      }
      
      await Purchases.configure({ apiKey: key, appUserID: userId });
      this.stateManager.setInitialized(true);

      // Set up listener for subscription status changes (renewals, expirations)
      this.listenerManager.setUserId(userId);
      this.listenerManager.setupListener(this.stateManager.getConfig());

      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      const entitlementIdentifier = this.stateManager.getConfig().entitlementIdentifier || 'premium';
      const hasPremium = !!customerInfo.entitlements.active[entitlementIdentifier];
      return { success: true, offering: offerings.current, hasPremium };
    } catch (error) {
      const errorMessage = getErrorMessage(error, "RevenueCat init failed");
      Logger.warn('Init failed', { error: errorMessage });
      return { success: false, offering: null, hasPremium: false };
    }
  }

  async fetchOfferings(): Promise<PurchasesOffering | null> {
    if (!this.isInitialized()) return null;
    if (isExpoGo() && !this.isUsingTestStore()) return null;

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
        config: this.stateManager.getConfig(),
        isInitialized: () => this.isInitialized(),
        isUsingTestStore: () => this.isUsingTestStore(),
      },
      pkg,
      userId
    );
  }

  async restorePurchases(userId: string): Promise<RestoreResult> {
    return handleRestore(
      {
        config: this.stateManager.getConfig(),
        isInitialized: () => this.isInitialized(),
        isUsingTestStore: () => this.isUsingTestStore(),
      },
      userId
    );
  }

  async reset(): Promise<void> {
    if (!this.isInitialized()) return;

    // Clean up listener
    this.listenerManager.destroy();

    try {
      await Purchases.logOut();
      this.stateManager.setInitialized(false);
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
