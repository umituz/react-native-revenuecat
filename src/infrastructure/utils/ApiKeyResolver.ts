/**
 * API Key Resolver
 * Resolves RevenueCat API key from configuration
 */

import { Platform } from "react-native";
import type { RevenueCatConfig } from "../../domain/value-objects/RevenueCatConfig";
import { isExpoGo, isDevelopment } from "./ExpoGoDetector";

/**
 * Check if Test Store key should be used
 */
export function shouldUseTestStore(config: RevenueCatConfig): boolean {
  const testKey = config.testStoreKey;
  return !!(testKey && (isExpoGo() || isDevelopment()));
}

/**
 * Get RevenueCat API key from config
 * Returns Test Store key if in dev/Expo Go environment
 */
export function resolveApiKey(config: RevenueCatConfig): string | null {
  if (shouldUseTestStore(config)) {
    return config.testStoreKey || null;
  }

  const key = Platform.select({
    ios: config.iosApiKey,
    android: config.androidApiKey,
    default: config.iosApiKey,
  });

  if (!key || key === "" || key.includes("YOUR_")) {
    return null;
  }

  return key;
}
