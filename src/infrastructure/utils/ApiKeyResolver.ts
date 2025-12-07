/**
 * API Key Resolver
 * Resolves RevenueCat API key for current platform
 * Supports Test Store key for development/Expo Go environments
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
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
 * Get RevenueCat API key for current platform
 * Returns Test Store key if in dev/Expo Go environment
 */
export function resolveApiKey(config: RevenueCatConfig): string | null {
  if (shouldUseTestStore(config)) {
    return config.testStoreKey || null;
  }

  const iosKey =
    config.iosApiKey ||
    Constants.expoConfig?.extra?.revenueCatIosKey ||
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
    "";

  const androidKey =
    config.androidApiKey ||
    Constants.expoConfig?.extra?.revenueCatAndroidKey ||
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
    "";

  const key = Platform.select({
    ios: iosKey,
    android: androidKey,
    default: iosKey,
  });

  if (!key || key === "" || key.includes("YOUR_")) {
    return null;
  }

  return key;
}
