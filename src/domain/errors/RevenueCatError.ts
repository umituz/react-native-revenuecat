/**
 * RevenueCat Error Types
 * Domain-specific error classes for subscription operations
 */

export class RevenueCatError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "RevenueCatError";
    Object.setPrototypeOf(this, RevenueCatError.prototype);
  }
}

export class RevenueCatInitializationError extends RevenueCatError {
  constructor(message: string = "RevenueCat is not initialized") {
    super(message, "REVENUECAT_NOT_INITIALIZED");
    this.name = "RevenueCatInitializationError";
    Object.setPrototypeOf(this, RevenueCatInitializationError.prototype);
  }
}

export class RevenueCatConfigurationError extends RevenueCatError {
  constructor(message: string = "Invalid RevenueCat configuration") {
    super(message, "REVENUECAT_CONFIG_ERROR");
    this.name = "RevenueCatConfigurationError";
    Object.setPrototypeOf(this, RevenueCatConfigurationError.prototype);
  }
}

export class RevenueCatPurchaseError extends RevenueCatError {
  constructor(message: string = "Purchase failed", public productId?: string) {
    super(message, "REVENUECAT_PURCHASE_ERROR");
    this.name = "RevenueCatPurchaseError";
    Object.setPrototypeOf(this, RevenueCatPurchaseError.prototype);
  }
}

export class RevenueCatRestoreError extends RevenueCatError {
  constructor(message: string = "Restore purchases failed") {
    super(message, "REVENUECAT_RESTORE_ERROR");
    this.name = "RevenueCatRestoreError";
    Object.setPrototypeOf(this, RevenueCatRestoreError.prototype);
  }
}

export class RevenueCatNetworkError extends RevenueCatError {
  constructor(message: string = "Network error during subscription operation") {
    super(message, "REVENUECAT_NETWORK_ERROR");
    this.name = "RevenueCatNetworkError";
    Object.setPrototypeOf(this, RevenueCatNetworkError.prototype);
  }
}

export class RevenueCatExpoGoError extends RevenueCatError {
  constructor(message: string = "RevenueCat is not available in Expo Go. Please build the app.") {
    super(message, "REVENUECAT_EXPO_GO_ERROR");
    this.name = "RevenueCatExpoGoError";
    Object.setPrototypeOf(this, RevenueCatExpoGoError.prototype);
  }
}

