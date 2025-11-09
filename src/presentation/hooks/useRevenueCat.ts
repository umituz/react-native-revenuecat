/**
 * useRevenueCat Hook
 * React hook for RevenueCat subscription management
 */

import { useState, useCallback } from "react";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { getRevenueCatService } from "../infrastructure/services/RevenueCatService";

export interface UseRevenueCatResult {
  /** Current offering */
  offering: PurchasesOffering | null;
  /** Whether RevenueCat is loading */
  loading: boolean;
  /** Initialize RevenueCat SDK */
  initialize: (userId: string, apiKey?: string) => Promise<void>;
  /** Load offerings */
  loadOfferings: () => Promise<void>;
  /** Purchase a package */
  purchasePackage: (pkg: PurchasesPackage, userId: string) => Promise<any>;
  /** Restore purchases */
  restorePurchases: (userId: string) => Promise<any>;
}

/**
 * Hook for RevenueCat operations
 * Only initialize when subscription screen is opened
 * 
 * @example
 * ```typescript
 * const { offering, loading, initialize, purchasePackage } = useRevenueCat();
 * ```
 */
export function useRevenueCat(): UseRevenueCatResult {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(false);

  const initialize = useCallback(async (userId: string, apiKey?: string) => {
    setLoading(true);
    try {
      const service = getRevenueCatService();
      const result = await service.initialize(userId, apiKey);
      if (result.success) {
        setOffering(result.offering);
      }
    } catch (error) {
      // Error handling is done by service
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    try {
      const service = getRevenueCatService();
      const fetchedOffering = await service.fetchOfferings();
      setOffering(fetchedOffering);
    } catch (error) {
      // Error handling is done by service
    } finally {
      setLoading(false);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage, userId: string) => {
    const service = getRevenueCatService();
    return await service.purchasePackage(pkg, userId);
  }, []);

  const restorePurchases = useCallback(async (userId: string) => {
    const service = getRevenueCatService();
    return await service.restorePurchases(userId);
  }, []);

  return {
    offering,
    loading,
    initialize,
    loadOfferings,
    purchasePackage,
    restorePurchases,
  };
}

