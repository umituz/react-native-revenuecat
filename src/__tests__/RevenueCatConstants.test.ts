/**
 * RevenueCat Constants Tests
 */

import {
  DEFAULT_ENTITLEMENT_IDENTIFIER,
  REVENUECAT_LOG_PREFIX,
  CREDITS_PRODUCT_IDENTIFIERS,
} from '../domain/constants/RevenueCatConstants';

describe('RevenueCatConstants', () => {
  it('should have correct default entitlement identifier', () => {
    expect(DEFAULT_ENTITLEMENT_IDENTIFIER).toBe('premium');
  });

  it('should have correct log prefix', () => {
    expect(REVENUECAT_LOG_PREFIX).toBe('[RevenueCat]');
  });

  it('should have credits product identifiers', () => {
    expect(CREDITS_PRODUCT_IDENTIFIERS).toEqual(['credits', 'consumable']);
  });

  it('should have correct credits product identifiers', () => {
    expect(CREDITS_PRODUCT_IDENTIFIERS).toContain('credits');
    expect(CREDITS_PRODUCT_IDENTIFIERS).toContain('consumable');
    expect(CREDITS_PRODUCT_IDENTIFIERS).toHaveLength(2);
  });
});