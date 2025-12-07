/**
 * Purchase Handler
 * Handles RevenueCat purchase operations
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
 * Handle package purchase
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

  try {
    const purchaseResult = await Purchases.purchasePackage(pkg);
    const customerInfo = purchaseResult.customerInfo;
    const isPremium = !!customerInfo.entitlements.active["premium"];

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
