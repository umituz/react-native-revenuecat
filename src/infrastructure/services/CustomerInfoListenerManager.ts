/**
 * Customer Info Listener Manager
 * Handles RevenueCat customer info update listeners
 */

import Purchases, { type CustomerInfo, type CustomerInfoUpdateListener } from 'react-native-purchases';
import type { RevenueCatConfig } from '../../domain/value-objects/RevenueCatConfig';
import { DEFAULT_ENTITLEMENT_IDENTIFIER } from '../../domain/constants/RevenueCatConstants';
import { syncPremiumStatus } from '../utils/PremiumStatusSyncer';
import { Logger } from '../utils/Logger';

export class CustomerInfoListenerManager {
  private listener: CustomerInfoUpdateListener | null = null;
  private currentUserId: string | null = null;
  private entitlementIdentifier: string;

  constructor(entitlementIdentifier: string = DEFAULT_ENTITLEMENT_IDENTIFIER) {
    this.entitlementIdentifier = entitlementIdentifier;
  }

  setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  clearUserId(): void {
    this.currentUserId = null;
  }

  setupListener(config: RevenueCatConfig): void {
    this.removeListener();

    this.listener = (customerInfo: CustomerInfo) => {
      if (!this.currentUserId) return;

      const hasPremium = !!customerInfo.entitlements.active[this.entitlementIdentifier];
      
      Logger.log('CustomerInfo updated', {
        userId: this.currentUserId,
        hasPremium,
        entitlementIdentifier: this.entitlementIdentifier,
      });

      syncPremiumStatus(config, this.currentUserId, customerInfo);
    };

    Purchases.addCustomerInfoUpdateListener(this.listener);
  }

  removeListener(): void {
    if (this.listener) {
      Purchases.removeCustomerInfoUpdateListener(this.listener);
      this.listener = null;
    }
  }

  destroy(): void {
    this.removeListener();
    this.clearUserId();
  }
}