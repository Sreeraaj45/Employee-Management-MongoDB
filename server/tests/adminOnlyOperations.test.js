import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('Admin-Only Operations Property-Based Tests', () => {
  let testUsers = {};

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test users for each role
    const roles = ['Admin', 'Lead', 'HR', 'Delivery Team'];
    
    for (const role of roles) {
      const hashedPassword = await AuthService.hashPassword('testpass123');
      const user = await UserProfile.create({
        email: `${role.toLowerCase().replace(' ', '_')}@test.com`,
        password: hashedPassword,
        name: `Test ${role}`,
        role: role
      });
      
      testUsers[role] = {
        id: user._id.toString(),
        token: AuthService.generateToken(user._id.toString(), role)
      };
    }
  });

  afterAll(async () => {
    // Clean up test users
    await UserProfile.deleteMany({
      email: { $in: Object.keys(testUsers).map(role => `${role.toLowerCase().replace(' ', '_')}@test.com`) }
    });
    
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 8: Admin-only operations
   * Validates: Requirements 6.7
   * 
   * For any user management operation, only users with Admin role should be able to 
   * perform create, update, or delete actions.
   */
  it('Property 8: Admin-only operations - only Admin role can perform user management CRUD operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random roles (non-Admin roles should be denied)
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        async (userRole) => {
          const token = testUsers[userRole].token;

          // Test 1: GET /api/users - only Admin should be able to list users
          const getUsersResponse = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`);

          if (userRole === 'Admin') {
            expect(getUsersResponse.status).toBe(200);
            expect(getUsersResponse.body.users).toBeDefined();
            expect(Array.isArray(getUsersResponse.body.users)).toBe(true);
          } else {
            expect(getUsersResponse.status).toBe(403);
            expect(getUsersResponse.body.error).toBeDefined();
            expect(getUsersResponse.body.error.message).toBe('Insufficient permissions');
          }

          // Test 2: POST /api/users - only Admin should be able to create users
          const createUserData = {
            email: `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
            password: 'testpass123',
            name: 'Test User',
            role: 'HR'
          };

          const createUserResponse = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .send(createUserData);

          if (userRole === 'Admin') {
            expect(createUserResponse.status).toBe(201);
            expect(createUserResponse.body.user).toBeDefined();
            expect(createUserResponse.body.user.email).toBe(createUserData.email);
            expect(createUserResponse.body.user.password).toBeUndefined(); // Password should not be returned

            // Clean up created user
            if (createUserResponse.body.user._id) {
              await UserProfile.findByIdAndDelete(createUserResponse.body.user._id);
            }
          } else {
            expect(createUserResponse.status).toBe(403);
            expect(createUserResponse.body.error).toBeDefined();
            expect(createUserResponse.body.error.message).toBe('Insufficient permissions');
          }

          // Test 3: PUT /api/users/:id - only Admin should be able to update users
          // Use a test user ID (we'll use the Lead user for this test)
          const targetUserId = testUsers['Lead'].id;
          const updateUserData = {
            name: `Updated Name ${Date.now()}`
          };

          const updateUserResponse = await request(app)
            .put(`/api/users/${targetUserId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateUserData);

          if (userRole === 'Admin') {
            expect(updateUserResponse.status).toBe(200);
            expect(updateUserResponse.body.user).toBeDefined();
            expect(updateUserResponse.body.user.name).toBe(updateUserData.name);
            expect(updateUserResponse.body.user.password).toBeUndefined(); // Password should not be returned
          } else {
            expect(updateUserResponse.status).toBe(403);
            expect(updateUserResponse.body.error).toBeDefined();
            expect(updateUserResponse.body.error.message).toBe('Insufficient permissions');
          }

          // Test 4: DELETE /api/users/:id - only Admin should be able to delete users
          // Create a temporary user to delete
          if (userRole === 'Admin') {
            const tempUserPassword = await AuthService.hashPassword('temppass123');
            const tempUser = await UserProfile.create({
              email: `temp_delete_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
              password: tempUserPassword,
              name: 'Temp Delete User',
              role: 'HR'
            });

            const deleteUserResponse = await request(app)
              .delete(`/api/users/${tempUser._id}`)
              .set('Authorization', `Bearer ${token}`);

            expect(deleteUserResponse.status).toBe(200);
            expect(deleteUserResponse.body.user).toBeDefined();
            expect(deleteUserResponse.body.user.email).toBe(tempUser.email);
            expect(deleteUserResponse.body.user.password).toBeUndefined(); // Password should not be returned

            // Verify user was actually deleted
            const deletedUser = await UserProfile.findById(tempUser._id);
            expect(deletedUser).toBeNull();
          } else {
            // For non-Admin users, try to delete the Lead user (should fail)
            const deleteUserResponse = await request(app)
              .delete(`/api/users/${targetUserId}`)
              .set('Authorization', `Bearer ${token}`);

            expect(deleteUserResponse.status).toBe(403);
            expect(deleteUserResponse.body.error).toBeDefined();
            expect(deleteUserResponse.body.error.message).toBe('Insufficient permissions');

            // Verify user was NOT deleted
            const userStillExists = await UserProfile.findById(targetUserId);
            expect(userStillExists).not.toBeNull();
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations (reduced from 100 for performance)
    );
  }, 30000); // 30 second timeout for property-based test
});