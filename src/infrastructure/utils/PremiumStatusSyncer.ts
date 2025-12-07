/**
 * Premium Status Syncer
 * Syncs premium status to database via callbacks
 */

import type { CustomerInfo } from "react-native-purchases";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import { getPremiumEntitlement } from "../../domain/types/RevenueCatTypes";
import { getExpirationDate } from "./ExpirationDateCalculator";

/**
 * Sync premium status to database via config callbacks
 * Errors are caught and logged to prevent purchase failures
 */
export async function syncPremiumStatus(
  config: RevenueCatConfig,
  userId: string,
  customerInfo: CustomerInfo
): Promise<void> {
  if (!config.onPremiumStatusChanged) {
    return;
  }

  const premiumEntitlement = getPremiumEntitlement(customerInfo);

  try {
    if (premiumEntitlement) {
      const productId = premiumEntitlement.productIdentifier;
      const expiresAt = getExpirationDate(premiumEntitlement);
      await config.onPremiumStatusChanged(
        userId,
        true,
        productId,
        expiresAt || undefined
      );
    } else {
      await config.onPremiumStatusChanged(userId, false);
    }
  } catch (error) {
    // Log error but don't fail the purchase/restore operation
    if (__DEV__) {
      const message =
        error instanceof Error ? error.message : "Premium sync failed";
      console.warn("[RevenueCat] Premium status sync failed:", message);
    }
  }
}

/**
 * Notify purchase completion via config callback
 */
export async function notifyPurchaseCompleted(
  config: RevenueCatConfig,
  userId: string,
  productId: string,
  customerInfo: CustomerInfo
): Promise<void> {
  if (!config.onPurchaseCompleted) {
    return;
  }

  try {
    await config.onPurchaseCompleted(userId, productId, customerInfo);
  } catch (error) {
    if (__DEV__) {
      const message =
        error instanceof Error ? error.message : "Purchase callback failed";
      console.warn("[RevenueCat] Purchase completion callback failed:", message);
    }
  }
}

/**
 * Notify restore completion via config callback
 */
export async function notifyRestoreCompleted(
  config: RevenueCatConfig,
  userId: string,
  isPremium: boolean,
  customerInfo: CustomerInfo
): Promise<void> {
  if (!config.onRestoreCompleted) {
    return;
  }

  try {
    await config.onRestoreCompleted(userId, isPremium, customerInfo);
  } catch (error) {
    if (__DEV__) {
      const message =
        error instanceof Error ? error.message : "Restore callback failed";
      console.warn("[RevenueCat] Restore completion callback failed:", message);
    }
  }
}
