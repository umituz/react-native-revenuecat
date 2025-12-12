// Jest setup file
global.__DEV__ = true;

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn((obj) => obj.ios || obj.default),
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  executionEnvironment: 'standalone',
}));

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  logOut: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
}));