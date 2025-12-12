/**
 * RevenueCat Type Definitions
 * Proper typing for RevenueCat entitlements and errors
 */

import type { CustomerInfo } from "react-native-purchases";

/**
 * RevenueCat Entitlement Info
 * Represents active entitlement data from CustomerInfo
 */
export interface RevenueCatEntitlement {
  identifier: string;
  productIdentifier: string;
  isSandbox: boolean;
  willRenew: boolean;
  periodType: string;
  latestPurchaseDate: string | null;
  originalPurchaseDate: string | null;
  expirationDate: string | null;
  unsubscribeDetectedAt: string | null;
  billingIssueDetectedAt: string | null;
}

/**
 * RevenueCat Purchase Error with userCancelled flag
 */
export interface RevenueCatPurchaseErrorInfo extends Error {
  userCancelled?: boolean;
  code?: string;
}

/**
 * Extract entitlement from CustomerInfo
 */
export function getPremiumEntitlement(
  customerInfo: CustomerInfo,
  entitlementIdentifier: string = 'premium'
): RevenueCatEntitlement | null {
  const entitlement = customerInfo.entitlements.active[entitlementIdentifier];
  if (!entitlement) {
    return null;
  }

  return {
    identifier: entitlement.identifier,
    productIdentifier: entitlement.productIdentifier,
    isSandbox: entitlement.isSandbox,
    willRenew: entitlement.willRenew,
    periodType: entitlement.periodType,
    latestPurchaseDate: entitlement.latestPurchaseDate,
    originalPurchaseDate: entitlement.originalPurchaseDate,
    expirationDate: entitlement.expirationDate,
    unsubscribeDetectedAt: entitlement.unsubscribeDetectedAt,
    billingIssueDetectedAt: entitlement.billingIssueDetectedAt,
  };
}

/**
 * Check if error is a user cancellation
 */
export function isUserCancelledError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  return (error as RevenueCatPurchaseErrorInfo).userCancelled === true;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
