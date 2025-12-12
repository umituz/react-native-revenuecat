/**
 * RevenueCat Logger
 * Centralized logging with __DEV__ checks
 */

import { REVENUECAT_LOG_PREFIX } from '../../domain/constants/RevenueCatConstants';

export class Logger {
  static log(message: string, data?: unknown): void {
    if (__DEV__) {
      if (data) {
        // eslint-disable-next-line no-console
        console.log(`${REVENUECAT_LOG_PREFIX} ${message}`, data);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${REVENUECAT_LOG_PREFIX} ${message}`);
      }
    }
  }

  static warn(message: string, data?: unknown): void {
    if (__DEV__) {
      if (data) {
        // eslint-disable-next-line no-console
        console.warn(`${REVENUECAT_LOG_PREFIX} ${message}`, data);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`${REVENUECAT_LOG_PREFIX} ${message}`);
      }
    }
  }

  static error(message: string, data?: unknown): void {
    if (__DEV__) {
      if (data) {
        // eslint-disable-next-line no-console
        console.error(`${REVENUECAT_LOG_PREFIX} ${message}`, data);
      } else {
        // eslint-disable-next-line no-console
        console.error(`${REVENUECAT_LOG_PREFIX} ${message}`);
      }
    }
  }
}