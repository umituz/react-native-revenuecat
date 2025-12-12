/**
 * Expo Go Detector
 * Detects runtime environment for RevenueCat configuration
 */

import Constants from "expo-constants";

/**
 * Check if running in Expo Go
 */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === "storeClient";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

/**
 * Check if Test Store should be used (Expo Go or development)
 */
export function isTestStoreEnvironment(): boolean {
  return isExpoGo() || isDevelopment();
}
