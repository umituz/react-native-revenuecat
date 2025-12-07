/**
 * Restore Handler
 * Handles RevenueCat restore operations
 */

import Purchases from "react-native-purchases";
import type { RestoreResult } from "../../application/ports/IRevenueCatService";
import {
  RevenueCatRestoreError,
  RevenueCatExpoGoError,
  RevenueCatInitializationError,
} from "../../domain/errors/RevenueCatError";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import { getErrorMessage } from "../../domain/types/RevenueCatTypes";
import { isExpoGo } from "../utils/ExpoGoDetector";
import {
  syncPremiumStatus,
  notifyRestoreCompleted,
} from "../utils/PremiumStatusSyncer";

export interface RestoreHandlerDeps {
  config: RevenueCatConfig;
  isInitialized: () => boolean;
  isUsingTestStore: () => boolean;
}

/**
 * Handle restore purchases
 */
export async function handleRestore(
  deps: RestoreHandlerDeps,
  userId: string
): Promise<RestoreResult> {
  if (!deps.isInitialized()) {
    throw new RevenueCatInitializationError();
  }

  if (isExpoGo() && !deps.isUsingTestStore()) {
    throw new RevenueCatExpoGoError();
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = !!customerInfo.entitlements.active["premium"];

    if (isPremium) {
      await syncPremiumStatus(deps.config, userId, customerInfo);
    }
    await notifyRestoreCompleted(deps.config, userId, isPremium, customerInfo);

    return { success: isPremium, isPremium, customerInfo };
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Restore failed");
    throw new RevenueCatRestoreError(errorMessage);
  }
}
