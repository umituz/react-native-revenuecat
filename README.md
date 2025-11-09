# @umituz/react-native-revenuecat

RevenueCat wrapper for React Native apps - Secure subscription management with database-first approach.

Built with **SOLID**, **DRY**, and **KISS** principles.

## Installation

```bash
npm install @umituz/react-native-revenuecat
```

## Peer Dependencies

- `react-native-purchases` >= 9.0.0
- `react` >= 18.2.0
- `react-native` >= 0.74.0
- `expo-constants` >= 15.0.0

## Features

- ✅ Domain-Driven Design (DDD) architecture
- ✅ SOLID principles (Single Responsibility, Open/Closed, etc.)
- ✅ DRY (Don't Repeat Yourself)
- ✅ KISS (Keep It Simple, Stupid)
- ✅ **Security**: Database-first approach - RevenueCat only for purchases
- ✅ Type-safe operations
- ✅ React hooks for easy integration
- ✅ Works with Expo and React Native CLI
- ✅ Expo Go detection and graceful handling

## Important: Database-First Approach

**This package follows a database-first approach:**

- RevenueCat is ONLY used for purchases
- Premium status should always be checked from your database
- This ensures 10-50x faster premium checks
- Works offline (database cache)
- More reliable than SDK-dependent checks

## Usage

### 1. Initialize RevenueCat Service

Initialize the service early in your app (e.g., in `App.tsx`):

```typescript
import { initializeRevenueCatService } from '@umituz/react-native-revenuecat';

// Initialize RevenueCat service
initializeRevenueCatService({
  iosApiKey: 'appl_YOUR_IOS_KEY',
  androidApiKey: 'goog_YOUR_ANDROID_KEY',
  onPremiumStatusChanged: async (userId, isPremium, productId, expiresAt) => {
    // Sync premium status to your database
    await updatePremiumStatusInDatabase(userId, {
      isPremium,
      productId,
      expiresAt,
    });
  },
  onPurchaseCompleted: async (userId, productId, customerInfo) => {
    // Optional: Handle purchase completion
    console.log('Purchase completed:', productId);
  },
  onRestoreCompleted: async (userId, isPremium, customerInfo) => {
    // Optional: Handle restore completion
    console.log('Restore completed:', isPremium);
  },
});
```

### 2. Use RevenueCat Hook in Components

```typescript
import { useRevenueCat } from '@umituz/react-native-revenuecat';
import { useAuth } from '@umituz/react-native-auth';

function SubscriptionScreen() {
  const { user } = useAuth();
  const { offering, loading, initialize, purchasePackage, restorePurchases } = useRevenueCat();

  // Lazy initialize when screen opens
  useEffect(() => {
    if (user && !isGuest) {
      initialize(user.uid).catch(() => {
        // Error handling
      });
    }
  }, [user, initialize]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      const result = await purchasePackage(pkg, user.uid);
      if (result.success) {
        console.log('Purchase successful!');
      }
    } catch (error) {
      if (error instanceof RevenueCatExpoGoError) {
        console.error('Not available in Expo Go');
      } else {
        console.error('Purchase failed:', error.message);
      }
    }
  };

  return (
    <View>
      {loading && <LoadingSpinner />}
      {offering && (
        <PackageList
          packages={offering.availablePackages}
          onPurchase={handlePurchase}
        />
      )}
    </View>
  );
}
```

### 3. Purchase a Package

```typescript
import { getRevenueCatService } from '@umituz/react-native-revenuecat';

const service = getRevenueCatService();

try {
  const result = await service.purchasePackage(pkg, userId);
  if (result.success) {
    console.log('Purchase successful!');
  }
} catch (error) {
  if (error instanceof RevenueCatPurchaseError) {
    console.error('Purchase failed:', error.message);
  }
}
```

### 4. Restore Purchases

```typescript
try {
  const result = await service.restorePurchases(userId);
  if (result.success && result.isPremium) {
    console.log('Purchases restored!');
  } else {
    console.log('No active subscriptions found');
  }
} catch (error) {
  if (error instanceof RevenueCatRestoreError) {
    console.error('Restore failed:', error.message);
  }
}
```

### 5. Reset on Logout

```typescript
import { getRevenueCatService } from '@umituz/react-native-revenuecat';

const service = getRevenueCatService();
await service.reset();
```

## API

### Functions

- `initializeRevenueCatService(config?)`: Initialize RevenueCat service with configuration
- `getRevenueCatService()`: Get RevenueCat service instance (throws if not initialized)
- `resetRevenueCatService()`: Reset service instance (useful for testing)

### Hook

- `useRevenueCat()`: React hook for RevenueCat operations

### Types

- `RevenueCatConfig`: Configuration interface
- `InitializeResult`: Initialize result type
- `PurchaseResult`: Purchase result type
- `RestoreResult`: Restore result type
- `UseRevenueCatResult`: Hook return type

### Errors

- `RevenueCatError`: Base error class
- `RevenueCatInitializationError`: Initialization errors
- `RevenueCatConfigurationError`: Configuration errors
- `RevenueCatPurchaseError`: Purchase errors
- `RevenueCatRestoreError`: Restore errors
- `RevenueCatNetworkError`: Network errors
- `RevenueCatExpoGoError`: Expo Go errors

## Security Best Practices

1. **Database-First**: Always check premium status from your database, not RevenueCat SDK
2. **Error Handling**: Always handle errors gracefully
3. **Expo Go**: Detect Expo Go and show appropriate error messages
4. **Callbacks**: Use callbacks to sync premium status to your database
5. **Lazy Initialization**: Only initialize RevenueCat when subscription screen opens

## Integration with Database

This package is designed to work with your database:

```typescript
initializeRevenueCatService({
  onPremiumStatusChanged: async (userId, isPremium, productId, expiresAt) => {
    // Update your database
    await db.collection('users').doc(userId).update({
      isPremium,
      premiumProductId: productId,
      premiumExpiresAt: expiresAt,
    });
  },
});
```

## License

MIT

