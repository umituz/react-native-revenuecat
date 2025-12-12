/**
 * Logger Tests
 */

import { Logger } from '../infrastructure/utils/Logger';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock __DEV__
const originalDev = global.__DEV__;

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
    global.__DEV__ = originalDev;
  });

  describe('when __DEV__ is true', () => {
    beforeEach(() => {
      global.__DEV__ = true;
    });

    it('should log messages with prefix', () => {
      Logger.log('Test message');
      expect(mockConsoleLog).toHaveBeenCalledWith('[RevenueCat] Test message');
    });

    it('should log messages with data', () => {
      const data = { key: 'value' };
      Logger.log('Test message', data);
      expect(mockConsoleLog).toHaveBeenCalledWith('[RevenueCat] Test message', data);
    });

    it('should log warnings with prefix', () => {
      Logger.warn('Warning message');
      expect(mockConsoleWarn).toHaveBeenCalledWith('[RevenueCat] Warning message');
    });

    it('should log errors with prefix', () => {
      Logger.error('Error message');
      expect(mockConsoleError).toHaveBeenCalledWith('[RevenueCat] Error message');
    });
  });

  describe('when __DEV__ is false', () => {
    beforeEach(() => {
      global.__DEV__ = false;
    });

    it('should not log any messages', () => {
      Logger.log('Test message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });
});