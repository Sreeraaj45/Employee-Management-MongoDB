import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import AuthService from '../services/authService.js';

describe('AuthService Property-Based Tests', () => {
  /**
   * Feature: supabase-to-mongodb-migration, Property 1: Authentication token validity
   * Validates: Requirements 2.2, 2.3, 2.4
   * 
   * For any valid user credentials, when a user logs in, the system should generate 
   * a JWT token that can be successfully verified and contains the correct user ID and role.
   */
  it('Property 1: Authentication token validity - generated tokens should be verifiable and contain correct data', () => {
    fc.assert(
      fc.property(
        // Generate random user IDs (string representation of MongoDB ObjectId)
        fc.string({ minLength: 24, maxLength: 24 }),
        // Generate random roles from the allowed set
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        (userId, role) => {
          // Generate token
          const token = AuthService.generateToken(userId, role);
          
          // Token should be a non-empty string
          expect(token).toBeDefined();
          expect(typeof token).toBe('string');
          expect(token.length).toBeGreaterThan(0);
          
          // Verify token
          const decoded = AuthService.verifyToken(token);
          
          // Decoded token should contain correct userId and role
          expect(decoded).toBeDefined();
          expect(decoded.userId).toBe(userId);
          expect(decoded.role).toBe(role);
          
          // Decoded token should have standard JWT fields
          expect(decoded.iat).toBeDefined(); // issued at
          expect(decoded.exp).toBeDefined(); // expiration
          expect(typeof decoded.iat).toBe('number');
          expect(typeof decoded.exp).toBe('number');
          expect(decoded.exp).toBeGreaterThan(decoded.iat);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 2: Password hashing security
   * Validates: Requirements 2.1, 2.6
   * 
   * For any password string, the hashed version should never match the original password string,
   * and verifying the original password against the hash should return true.
   */
  it('Property 2: Password hashing security - hashed passwords should be secure and verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random password strings (various lengths and characters)
        fc.string({ minLength: 1, maxLength: 100 }),
        async (password) => {
          // Hash the password
          const hashedPassword = await AuthService.hashPassword(password);
          
          // Hashed password should be a non-empty string
          expect(hashedPassword).toBeDefined();
          expect(typeof hashedPassword).toBe('string');
          expect(hashedPassword.length).toBeGreaterThan(0);
          
          // Hashed password should NEVER match the original password
          expect(hashedPassword).not.toBe(password);
          
          // Verifying the original password against the hash should return true
          const isValid = await AuthService.verifyPassword(password, hashedPassword);
          expect(isValid).toBe(true);
          
          // Verifying a different password should return false
          // (only test if password is not empty to avoid edge case)
          if (password.length > 0) {
            const differentPassword = password + 'x';
            const isInvalid = await AuthService.verifyPassword(differentPassword, hashedPassword);
            expect(isInvalid).toBe(false);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 120000); // 120 second timeout for bcrypt operations
});
