/**
 * Premium Status Syncer
 * Syncs premium status to database via callbacks
 */

import type { CustomerInfo } from "react-native-purchases";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import { getPremiumEntitlement } from "../../domain/types/RevenueCatTypes";
import { getExpirationDate } from "./ExpirationDateCalculator";
import { Logger } from "./Logger";

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

  const entitlementIdentifier = config.entitlementIdentifier || 'premium';
  const premiumEntitlement = getPremiumEntitlement(customerInfo, entitlementIdentifier);

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
    const message =
      error instanceof Error ? error.message : "Premium sync failed";
    Logger.warn('Premium status sync failed', { error: message });
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
    const message =
      error instanceof Error ? error.message : "Purchase callback failed";
    Logger.warn('Purchase completion callback failed', { error: message });
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
    const message =
      error instanceof Error ? error.message : "Restore callback failed";
    Logger.warn('Restore completion callback failed', { error: message });
  }
}
