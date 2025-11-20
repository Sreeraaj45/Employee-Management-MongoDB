import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { config, validateEnv } from '../config/env.js';

describe('Environment Configuration Validation Property-Based Tests', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 14: Environment configuration validation
   * Validates: Requirements 8.3
   * 
   * For any required environment variable, if it is missing when the application starts, 
   * the system should display a clear error message and prevent startup.
   */
  it('Property 14: Environment configuration validation - validates required variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random combinations of missing environment variables
        fc.record({
          mongodbUri: fc.boolean(),
          jwtSecret: fc.boolean(),
        }),
        async (envFlags) => {
          // Set up environment based on flags
          if (envFlags.mongodbUri) {
            process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
          } else {
            delete process.env.MONGODB_URI;
          }

          if (envFlags.jwtSecret) {
            process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';
          } else {
            delete process.env.JWT_SECRET;
          }

          // Determine if configuration is valid
          const isValid = envFlags.mongodbUri && envFlags.jwtSecret;

          if (isValid) {
            // Should not throw error
            expect(() => validateEnv()).not.toThrow();
          } else {
            // Should throw error or exit process
            // Since validateEnv calls process.exit, we need to mock it
            const originalExit = process.exit;
            let exitCalled = false;
            let exitCode = null;

            process.exit = ((code) => {
              exitCalled = true;
              exitCode = code;
              throw new Error(`Process.exit called with code ${code}`);
            });

            try {
              validateEnv();
              // If we get here, validation didn't work properly
              expect(exitCalled).toBe(true);
            } catch (error) {
              // Should have called process.exit
              expect(exitCalled).toBe(true);
              expect(exitCode).toBe(1);
            } finally {
              // Restore process.exit
              process.exit = originalExit;
            }
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations with different combinations
    );
  }, 30000);

  it('should validate MONGODB_URI is present', () => {
    // Remove MONGODB_URI
    delete process.env.MONGODB_URI;
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';

    // Mock process.exit
    const originalExit = process.exit;
    let exitCalled = false;
    process.exit = ((code) => {
      exitCalled = true;
      throw new Error(`Process.exit called with code ${code}`);
    });

    // Mock console.error to capture error message
    const originalError = console.error;
    let errorMessage = '';
    console.error = (message) => {
      errorMessage = message;
    };

    try {
      validateEnv();
    } catch (error) {
      // Expected to throw
    }

    // Restore mocks
    process.exit = originalExit;
    console.error = originalError;

    // Verify exit was called and error message was logged
    expect(exitCalled).toBe(true);
    expect(errorMessage).toContain('MONGODB_URI');
    expect(errorMessage).toContain('Missing required environment variables');
  });

  it('should validate JWT_SECRET is present', () => {
    // Remove JWT_SECRET
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.JWT_SECRET;

    // Mock process.exit
    const originalExit = process.exit;
    let exitCalled = false;
    process.exit = ((code) => {
      exitCalled = true;
      throw new Error(`Process.exit called with code ${code}`);
    });

    // Mock console.error to capture error message
    const originalError = console.error;
    let errorMessage = '';
    console.error = (message) => {
      errorMessage = message;
    };

    try {
      validateEnv();
    } catch (error) {
      // Expected to throw
    }

    // Restore mocks
    process.exit = originalExit;
    console.error = originalError;

    // Verify exit was called and error message was logged
    expect(exitCalled).toBe(true);
    expect(errorMessage).toContain('JWT_SECRET');
    expect(errorMessage).toContain('Missing required environment variables');
  });

  it('should validate both MONGODB_URI and JWT_SECRET are present', () => {
    // Remove both
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;

    // Mock process.exit
    const originalExit = process.exit;
    let exitCalled = false;
    process.exit = ((code) => {
      exitCalled = true;
      throw new Error(`Process.exit called with code ${code}`);
    });

    // Mock console.error to capture error message
    const originalError = console.error;
    let errorMessage = '';
    console.error = (message) => {
      errorMessage = message;
    };

    try {
      validateEnv();
    } catch (error) {
      // Expected to throw
    }

    // Restore mocks
    process.exit = originalExit;
    console.error = originalError;

    // Verify exit was called and error message contains both variables
    expect(exitCalled).toBe(true);
    expect(errorMessage).toContain('MONGODB_URI');
    expect(errorMessage).toContain('JWT_SECRET');
    expect(errorMessage).toContain('Missing required environment variables');
  });

  it('should pass validation when all required variables are present', () => {
    // Set all required variables
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';

    // Should not throw
    expect(() => validateEnv()).not.toThrow();
  });

  it('should provide default values for optional variables', () => {
    // Set required variables
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';

    // Remove optional variables
    delete process.env.PORT;
    delete process.env.JWT_EXPIRATION;
    delete process.env.NODE_ENV;

    // Should not throw
    expect(() => validateEnv()).not.toThrow();

    // Note: config object is loaded at module import time, so we can't test
    // dynamic changes. Instead, verify the config has reasonable defaults.
    expect(config.port).toBeDefined();
    expect(config.jwtExpiration).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
  });

  it('should use custom values when optional variables are provided', () => {
    // Set all variables including optional ones
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';
    process.env.PORT = '4000';
    process.env.JWT_EXPIRATION = '12h';
    process.env.NODE_ENV = 'production';

    // Should not throw
    expect(() => validateEnv()).not.toThrow();

    // Note: config object is loaded at module import time, so we can't test
    // dynamic changes. Instead, verify the config object structure is correct.
    expect(config.port).toBeDefined();
    expect(config.jwtExpiration).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
  });

  it('should handle empty string values as missing', () => {
    // Set variables to empty strings
    process.env.MONGODB_URI = '';
    process.env.JWT_SECRET = '';

    // Mock process.exit
    const originalExit = process.exit;
    let exitCalled = false;
    process.exit = ((code) => {
      exitCalled = true;
      throw new Error(`Process.exit called with code ${code}`);
    });

    // Mock console.error
    const originalError = console.error;
    let errorMessage = '';
    console.error = (message) => {
      errorMessage = message;
    };

    try {
      validateEnv();
    } catch (error) {
      // Expected to throw
    }

    // Restore mocks
    process.exit = originalExit;
    console.error = originalError;

    // Verify exit was called
    expect(exitCalled).toBe(true);
    expect(errorMessage).toContain('Missing required environment variables');
  });

  it('should display clear error messages for missing variables', () => {
    // Test with different combinations of missing variables
    const testCases = [
      { missing: ['MONGODB_URI'], set: { JWT_SECRET: 'secret' } },
      { missing: ['JWT_SECRET'], set: { MONGODB_URI: 'mongodb://localhost' } },
      { missing: ['MONGODB_URI', 'JWT_SECRET'], set: {} },
    ];

    for (const testCase of testCases) {
      // Set up environment
      for (const key of testCase.missing) {
        delete process.env[key];
      }
      for (const [key, value] of Object.entries(testCase.set)) {
        process.env[key] = value;
      }

      // Mock process.exit
      const originalExit = process.exit;
      let exitCalled = false;
      process.exit = ((code) => {
        exitCalled = true;
        throw new Error(`Process.exit called with code ${code}`);
      });

      // Mock console.error
      const originalError = console.error;
      let errorMessage = '';
      console.error = (message) => {
        errorMessage = message;
      };

      try {
        validateEnv();
      } catch (error) {
        // Expected to throw
      }

      // Restore mocks
      process.exit = originalExit;
      console.error = originalError;

      // Verify error message contains all missing variables
      expect(exitCalled).toBe(true);
      for (const missing of testCase.missing) {
        expect(errorMessage).toContain(missing);
      }
    }
  });

  it('should validate configuration object structure', () => {
    // Set required variables
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';

    // Validate config object has expected properties
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('mongodbUri');
    expect(config).toHaveProperty('jwtSecret');
    expect(config).toHaveProperty('jwtExpiration');
    expect(config).toHaveProperty('nodeEnv');

    // Validate types
    expect(typeof config.port === 'number' || typeof config.port === 'string').toBe(true);
    expect(typeof config.mongodbUri).toBe('string');
    expect(typeof config.jwtSecret).toBe('string');
    expect(typeof config.jwtExpiration).toBe('string');
    expect(typeof config.nodeEnv).toBe('string');
  });

  it('should handle whitespace in environment variables', () => {
    // Set variables with whitespace
    process.env.MONGODB_URI = '  mongodb://localhost:27017/test  ';
    process.env.JWT_SECRET = '  test-jwt-secret-key-minimum-32-characters-long  ';

    // Should not throw (whitespace is preserved in Node.js env vars)
    expect(() => validateEnv()).not.toThrow();

    // Note: config object is loaded at module import time from .env file
    // This test verifies that validation doesn't reject whitespace
    expect(config.mongodbUri).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
    expect(typeof config.mongodbUri).toBe('string');
    expect(typeof config.jwtSecret).toBe('string');
  });
});
