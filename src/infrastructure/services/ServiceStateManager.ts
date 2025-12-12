/**
 * Service State Manager
 * Manages RevenueCat service state
 */

import type { RevenueCatConfig } from '../../domain/value-objects/RevenueCatConfig';
import { Logger } from '../utils/Logger';
import { isExpoGo, isDevelopment } from '../utils/ExpoGoDetector';

export class ServiceStateManager {
  private isInitializedFlag: boolean = false;
  private usingTestStore: boolean = false;
  private config: RevenueCatConfig;

  constructor(config: RevenueCatConfig) {
    this.config = config;
    this.usingTestStore = this.shouldUseTestStore();
    this.logConfigStatus();
  }

  private shouldUseTestStore(): boolean {
    const testKey = this.config.testStoreKey;
    return !!(testKey && (isExpoGo() || isDevelopment()));
  }

  private logConfigStatus(): void {
    Logger.log('Config', {
      hasTestKey: !!this.config.testStoreKey,
      usingTestStore: this.usingTestStore,
    });
  }

  setInitialized(value: boolean): void {
    this.isInitializedFlag = value;
  }

  isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  isUsingTestStore(): boolean {
    return this.usingTestStore;
  }

  getConfig(): RevenueCatConfig {
    return this.config;
  }

  updateConfig(config: RevenueCatConfig): void {
    this.config = config;
    this.usingTestStore = this.shouldUseTestStore();
    this.logConfigStatus();
  }
}