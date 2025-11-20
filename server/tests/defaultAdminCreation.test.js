import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import UserProfile from '../models/UserProfile.js';
import InitializationService from '../services/initializationService.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('Default Admin Creation Property-Based Tests', () => {
  beforeEach(async () => {
    // Connect to test database
    await connectDB();
    
    // Clean up any existing users before each test
    await UserProfile.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await UserProfile.deleteMany({});
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 4: Default admin creation
   * Validates: Requirements 1.1, 1.2
   * 
   * For any fresh MongoDB database with no users, when the server starts, 
   * it should create a default admin user with secure credentials.
   */
  it('Property 4: Default admin creation - creates admin on empty database', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of times to run initialization
        fc.integer({ min: 1, max: 5 }),
        async (iterations) => {
          // Clean database before test
          await UserProfile.deleteMany({});

          // Verify database is empty
          const initialCount = await UserProfile.countDocuments();
          expect(initialCount).toBe(0);

          // Run initialization for the first time
          const firstResult = await InitializationService.createDefaultAdminIfNeeded();

          // Verify admin was created
          expect(firstResult.created).toBe(true);
          expect(firstResult.email).toBe('admin@company.com');
          expect(firstResult.password).toBeDefined();
          expect(firstResult.password.length).toBeGreaterThanOrEqual(12);
          expect(firstResult.userId).toBeDefined();

          // Verify user exists in database
          const userCount = await UserProfile.countDocuments();
          expect(userCount).toBe(1);

          // Verify the created user
          const adminUser = await UserProfile.findOne({ email: 'admin@company.com' });
          expect(adminUser).not.toBeNull();
          expect(adminUser.role).toBe('Admin');
          expect(adminUser.name).toBe('System Administrator');
          expect(adminUser.password).toBeDefined();
          expect(adminUser.password).not.toBe(firstResult.password); // Password should be hashed

          // Verify password is properly hashed
          const passwordValid = await AuthService.verifyPassword(
            firstResult.password,
            adminUser.password
          );
          expect(passwordValid).toBe(true);

          // Run initialization multiple more times
          for (let i = 1; i < iterations; i++) {
            const subsequentResult = await InitializationService.createDefaultAdminIfNeeded();
            
            // Verify no duplicate admin is created
            expect(subsequentResult.created).toBe(false);
            expect(subsequentResult.reason).toBe('Users already exist');
            
            // Verify user count hasn't changed
            const currentCount = await UserProfile.countDocuments();
            expect(currentCount).toBe(1);
          }

          // Clean up for next iteration
          await UserProfile.deleteMany({});
        }
      ),
      { numRuns: 10 } // Run 10 iterations
    );
  }, 30000); // 30 second timeout

  it('should not create admin if users already exist', async () => {
    // Create a regular user first
    const hashedPassword = await AuthService.hashPassword('testpass123');
    await UserProfile.create({
      email: 'existing@test.com',
      password: hashedPassword,
      name: 'Existing User',
      role: 'HR'
    });

    // Try to create default admin
    const result = await InitializationService.createDefaultAdminIfNeeded();

    // Verify admin was not created
    expect(result.created).toBe(false);
    expect(result.reason).toBe('Users already exist');

    // Verify only one user exists
    const userCount = await UserProfile.countDocuments();
    expect(userCount).toBe(1);

    // Verify the existing user is still there
    const existingUser = await UserProfile.findOne({ email: 'existing@test.com' });
    expect(existingUser).not.toBeNull();
  });

  it('should generate secure passwords with required complexity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No input needed
        async () => {
          // Clean database
          await UserProfile.deleteMany({});

          // Create default admin
          const result = await InitializationService.createDefaultAdminIfNeeded();

          // Verify password complexity
          const password = result.password;
          
          // Check length
          expect(password.length).toBeGreaterThanOrEqual(12);
          
          // Check for uppercase letter
          expect(/[A-Z]/.test(password)).toBe(true);
          
          // Check for lowercase letter
          expect(/[a-z]/.test(password)).toBe(true);
          
          // Check for number
          expect(/[0-9]/.test(password)).toBe(true);
          
          // Check for special character
          expect(/[!@#$%^&*]/.test(password)).toBe(true);

          // Clean up
          await UserProfile.deleteMany({});
        }
      ),
      { numRuns: 20 } // Run 20 iterations to test password generation
    );
  }, 30000);

  it('should create admin with correct role and permissions', async () => {
    // Clean database
    await UserProfile.deleteMany({});

    // Create default admin
    const result = await InitializationService.createDefaultAdminIfNeeded();

    // Verify admin user details
    const adminUser = await UserProfile.findById(result.userId);
    
    expect(adminUser.email).toBe('admin@company.com');
    expect(adminUser.role).toBe('Admin');
    expect(adminUser.name).toBe('System Administrator');
    expect(adminUser.created_at).toBeDefined();
    expect(adminUser.updated_at).toBeDefined();
  });

  it('should allow login with generated credentials', async () => {
    // Clean database
    await UserProfile.deleteMany({});

    // Create default admin
    const result = await InitializationService.createDefaultAdminIfNeeded();

    // Attempt to login with generated credentials
    const loginResult = await AuthService.login(result.email, result.password);

    // Verify login successful
    expect(loginResult).toBeDefined();
    expect(loginResult.user).toBeDefined();
    expect(loginResult.token).toBeDefined();
    expect(loginResult.user.email).toBe('admin@company.com');
    expect(loginResult.user.role).toBe('Admin');
  });

  it('should handle multiple concurrent initialization calls safely', async () => {
    // Clean database
    await UserProfile.deleteMany({});

    // Run multiple initialization calls concurrently
    const promises = Array(5).fill(null).map(() => 
      InitializationService.createDefaultAdminIfNeeded()
    );

    // Use Promise.allSettled to handle race condition errors gracefully
    const results = await Promise.allSettled(promises);

    // Filter successful results
    const successfulResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    // At least one should have created the admin
    const createdCount = successfulResults.filter(r => r.created).length;
    expect(createdCount).toBeGreaterThanOrEqual(1);

    // Verify only one admin user exists
    const userCount = await UserProfile.countDocuments();
    expect(userCount).toBe(1);

    // Verify the admin user
    const adminUser = await UserProfile.findOne({ email: 'admin@company.com' });
    expect(adminUser).not.toBeNull();
    expect(adminUser.role).toBe('Admin');
  });

  it('should provide helper methods for checking admin existence', async () => {
    // Clean database
    await UserProfile.deleteMany({});

    // Check before creation
    const existsBefore = await InitializationService.defaultAdminExists();
    expect(existsBefore).toBe(false);

    const countBefore = await InitializationService.getUserCount();
    expect(countBefore).toBe(0);

    // Create default admin
    await InitializationService.createDefaultAdminIfNeeded();

    // Check after creation
    const existsAfter = await InitializationService.defaultAdminExists();
    expect(existsAfter).toBe(true);

    const countAfter = await InitializationService.getUserCount();
    expect(countAfter).toBe(1);
  });

  it('should run full initialization without errors', async () => {
    // Clean database
    await UserProfile.deleteMany({});

    // Run full initialization
    await expect(InitializationService.initialize()).resolves.not.toThrow();

    // Verify admin was created
    const adminUser = await UserProfile.findOne({ email: 'admin@company.com' });
    expect(adminUser).not.toBeNull();
    expect(adminUser.role).toBe('Admin');
  });
});
