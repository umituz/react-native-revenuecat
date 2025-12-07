/**
 * Expiration Date Calculator
 * Handles RevenueCat expiration date calculations
 */

import type { RevenueCatEntitlement } from "../../domain/types/RevenueCatTypes";

/**
 * Get expiration date from RevenueCat entitlement
 * Uses calculateExpirationDate from @umituz/react-native-subscription
 * to handle sandbox accelerated timers
 */
export function getExpirationDate(
  entitlement: RevenueCatEntitlement | null
): string | null {
  if (!entitlement) {
    return null;
  }

  const productId = entitlement.productIdentifier;
  const revenueCatExpiresAt = entitlement.expirationDate
    ? new Date(entitlement.expirationDate).toISOString()
    : null;

  // Try to use subscription package for accurate calculation
  try {
    // Dynamic import to avoid hard dependency (peer dependency)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const subscriptionUtils = require("@umituz/react-native-subscription");
    if (subscriptionUtils.calculateExpirationDate) {
      return subscriptionUtils.calculateExpirationDate(
        productId,
        revenueCatExpiresAt
      );
    }
  } catch {
    // Fallback if package not available - this is expected
  }

  return revenueCatExpiresAt;
}
