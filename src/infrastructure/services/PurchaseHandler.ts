/**
 * Purchase Handler
 * Handles RevenueCat purchase operations for both subscriptions and consumables
 */

import Purchases, { type PurchasesPackage } from "react-native-purchases";
import type { PurchaseResult } from "../../application/ports/IRevenueCatService";
import {
  RevenueCatPurchaseError,
  RevenueCatExpoGoError,
  RevenueCatInitializationError,
} from "../../domain/errors/RevenueCatError";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import {
  isUserCancelledError,
  getErrorMessage,
} from "../../domain/types/RevenueCatTypes";
import { CREDITS_PRODUCT_IDENTIFIERS } from "../../domain/constants/RevenueCatConstants";
import { isExpoGo } from "../utils/ExpoGoDetector";
import {
  syncPremiumStatus,
  notifyPurchaseCompleted,
} from "../utils/PremiumStatusSyncer";

export interface PurchaseHandlerDeps {
  config: RevenueCatConfig;
  isInitialized: () => boolean;
  isUsingTestStore: () => boolean;
}

/**
 * Check if product is a consumable (credits package)
 */
function isConsumableProduct(pkg: PurchasesPackage): boolean {
  const identifier = pkg.product.identifier.toLowerCase();
  return CREDITS_PRODUCT_IDENTIFIERS.some(id => identifier.includes(id));
}

/**
 * Handle package purchase - supports both subscriptions and consumables
 */
export async function handlePurchase(
  deps: PurchaseHandlerDeps,
  pkg: PurchasesPackage,
  userId: string
): Promise<PurchaseResult> {
  if (!deps.isInitialized()) {
    throw new RevenueCatInitializationError();
  }

  if (isExpoGo() && !deps.isUsingTestStore()) {
    throw new RevenueCatExpoGoError();
  }

  const isConsumable = isConsumableProduct(pkg);

  try {
    const purchaseResult = await Purchases.purchasePackage(pkg);
    const customerInfo = purchaseResult.customerInfo;

    // For consumable products (credits), purchase success is enough
    if (isConsumable) {
      return {
        success: true,
        isPremium: false,
        customerInfo,
        isConsumable: true,
        productId: pkg.product.identifier,
      };
    }

    // For subscriptions, check premium entitlement
    const entitlementIdentifier = deps.config.entitlementIdentifier || 'premium';
    const isPremium = !!customerInfo.entitlements.active[entitlementIdentifier];

    if (isPremium) {
      await syncPremiumStatus(deps.config, userId, customerInfo);
      await notifyPurchaseCompleted(
        deps.config,
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
