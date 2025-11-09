/**
 * React Native RevenueCat - Public API
 *
 * Domain-Driven Design (DDD) Architecture
 *
 * This is the SINGLE SOURCE OF TRUTH for all RevenueCat operations.
 * ALL imports from the RevenueCat package MUST go through this file.
 *
 * Architecture:
 * - domain: Entities, value objects, errors (business logic)
 * - application: Ports (interfaces)
 * - infrastructure: RevenueCat service implementation
 * - presentation: Hooks (React integration)
 *
 * Usage:
 *   import { initializeRevenueCatService, useRevenueCat } from '@umituz/react-native-revenuecat';
 */

// =============================================================================
// DOMAIN LAYER - Business Logic
// =============================================================================

export {
  RevenueCatError,
  RevenueCatInitializationError,
  RevenueCatConfigurationError,
  RevenueCatPurchaseError,
  RevenueCatRestoreError,
  RevenueCatNetworkError,
  RevenueCatExpoGoError,
} from './domain/errors/RevenueCatError';

export type { RevenueCatConfig } from './domain/value-objects/RevenueCatConfig';

// =============================================================================
// APPLICATION LAYER - Ports
// =============================================================================

export type {
  IRevenueCatService,
  InitializeResult,
  PurchaseResult,
  RestoreResult,
} from './application/ports/IRevenueCatService';

// =============================================================================
// INFRASTRUCTURE LAYER - Implementation
// =============================================================================

export {
  RevenueCatService,
  initializeRevenueCatService,
  getRevenueCatService,
  resetRevenueCatService,
} from './infrastructure/services/RevenueCatService';

// =============================================================================
// PRESENTATION LAYER - Hooks
// =============================================================================

export { useRevenueCat } from './presentation/hooks/useRevenueCat';
export type { UseRevenueCatResult } from './presentation/hooks/useRevenueCat';

