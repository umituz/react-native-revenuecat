/**
 * Service State Manager Tests
 */

import { ServiceStateManager } from '../infrastructure/services/ServiceStateManager';
import type { RevenueCatConfig } from '../domain/value-objects/RevenueCatConfig';

describe('ServiceStateManager', () => {
  let manager: ServiceStateManager;
  let mockConfig: RevenueCatConfig;

  beforeEach(() => {
    mockConfig = {
      iosApiKey: 'test-ios-key',
      androidApiKey: 'test-android-key',
    };
    manager = new ServiceStateManager(mockConfig);
  });

  it('should initialize with correct state', () => {
    expect(manager.isInitialized()).toBe(false);
    expect(manager.isUsingTestStore()).toBe(false);
  });

  it('should set initialized state', () => {
    manager.setInitialized(true);
    expect(manager.isInitialized()).toBe(true);

    manager.setInitialized(false);
    expect(manager.isInitialized()).toBe(false);
  });

  it('should return config', () => {
    const config = manager.getConfig();
    expect(config).toEqual(mockConfig);
  });

  it('should update config', () => {
    const newConfig: RevenueCatConfig = {
      testStoreKey: 'test-key',
      entitlementIdentifier: 'premium',
    };
    
    manager.updateConfig(newConfig);
    expect(manager.getConfig()).toEqual(newConfig);
  });

  it('should use test store when test key is provided in development', () => {
    const devConfig: RevenueCatConfig = {
      testStoreKey: 'test-key',
    };
    
    const devManager = new ServiceStateManager(devConfig);
    expect(devManager.isUsingTestStore()).toBe(true);
  });
});