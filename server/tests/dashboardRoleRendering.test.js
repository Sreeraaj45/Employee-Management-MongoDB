import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('Dashboard Role Rendering Property-Based Tests', () => {
  let testUsers = {};

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test users for each role
    const roles = ['Admin', 'Lead', 'HR', 'Delivery Team'];
    
    for (const role of roles) {
      const hashedPassword = await AuthService.hashPassword('testpass123');
      const user = await UserProfile.create({
        email: `${role.toLowerCase().replace(' ', '_')}_dashboard@test.com`,
        password: hashedPassword,
        name: `Test ${role} Dashboard`,
        role: role
      });
      
      testUsers[role] = {
        id: user._id.toString(),
        token: AuthService.generateToken(user._id.toString(), role),
        role: role
      };
    }
  });

  afterAll(async () => {
    // Clean up test users
    await UserProfile.deleteMany({
      email: { $in: Object.keys(testUsers).map(role => `${role.toLowerCase().replace(' ', '_')}_dashboard@test.com`) }
    });
    
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 10: Dashboard role-based rendering
   * Validates: Requirements 11.1, 11.2, 11.3, 11.4
   * 
   * For any user role, when the user logs in, the dashboard should display only 
   * the features and navigation items appropriate for that role.
   */
  it('Property 10: Dashboard role-based rendering - each role sees appropriate features', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random roles to test
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        async (userRole) => {
          const token = testUsers[userRole].token;

          // Define expected access for each role
          const roleAccess = {
            'Admin': {
              dashboard: true,
              employees: true,
              projects: true,
              financial: true,
              reports: true,
              upload: true,
              users: true,
              settings: true
            },
            'Lead': {
              dashboard: true,
              employees: true,
              projects: true,
              financial: true,
              reports: true,
              upload: false,
              users: false,
              settings: true
            },
            'HR': {
              dashboard: true,
              employees: true,
              projects: true,
              financial: false,
              reports: true,
              upload: false,
              users: false,
              settings: true
            },
            'Delivery Team': {
              dashboard: true,
              employees: true,
              projects: true,
              financial: false,
              reports: false,
              upload: false,
              users: false,
              settings: true
            }
          };

          const expectedAccess = roleAccess[userRole];

          // Test Dashboard Access
          const dashboardResponse = await request(app)
            .get('/api/dashboard/metrics')
            .set('Authorization', `Bearer ${token}`);

          if (expectedAccess.dashboard) {
            expect(dashboardResponse.status).toBe(200);
            expect(dashboardResponse.body.metrics).toBeDefined();
          } else {
            expect(dashboardResponse.status).toBe(403);
          }

          // Test Employees Access
          const employeesResponse = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${token}`);

          if (expectedAccess.employees) {
            expect(employeesResponse.status).toBe(200);
            expect(employeesResponse.body.employees).toBeDefined();
          } else {
            expect(employeesResponse.status).toBe(403);
          }

          // Test Projects Access
          const projectsResponse = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`);

          if (expectedAccess.projects) {
            expect(projectsResponse.status).toBe(200);
            expect(projectsResponse.body.projects).toBeDefined();
          } else {
            expect(projectsResponse.status).toBe(403);
          }

          // Test Financial Access
          const financialResponse = await request(app)
            .get('/api/financial/client-cost')
            .set('Authorization', `Bearer ${token}`);

          if (expectedAccess.financial) {
            expect(financialResponse.status).toBe(200);
            expect(financialResponse.body.clientCosts).toBeDefined();
          } else {
            expect(financialResponse.status).toBe(403);
            expect(financialResponse.body.error).toBeDefined();
          }

          // Test Bulk Upload Access (Admin only)
          const uploadResponse = await request(app)
            .post('/api/employees/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ employees: [] });

          if (expectedAccess.upload) {
            // Admin should be able to access (even with empty array)
            expect([200, 400]).toContain(uploadResponse.status);
          } else {
            expect(uploadResponse.status).toBe(403);
          }

          // Test User Management Access (Admin only)
          const usersResponse = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`);

          if (expectedAccess.users) {
            expect(usersResponse.status).toBe(200);
            expect(usersResponse.body.users).toBeDefined();
          } else {
            expect(usersResponse.status).toBe(403);
            expect(usersResponse.body.error).toBeDefined();
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations
    );
  }, 60000); // 60 second timeout

  it('should allow Admin access to all features', async () => {
    const token = testUsers['Admin'].token;

    const endpoints = [
      '/api/dashboard/metrics',
      '/api/employees',
      '/api/projects',
      '/api/financial/client-cost',
      '/api/users'
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    }
  });

  it('should deny HR access to financial data', async () => {
    const token = testUsers['HR'].token;

    const financialEndpoints = [
      '/api/financial/client-cost',
      '/api/financial/project-cost',
      '/api/financial/analysis'
    ];

    for (const endpoint of financialEndpoints) {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    }
  });

  it('should deny Delivery Team access to financial and user management', async () => {
    const token = testUsers['Delivery Team'].token;

    // Test financial access
    const financialResponse = await request(app)
      .get('/api/financial/client-cost')
      .set('Authorization', `Bearer ${token}`);

    expect(financialResponse.status).toBe(403);

    // Test user management access
    const usersResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(usersResponse.status).toBe(403);
  });

  it('should allow Lead access to financial but not user management', async () => {
    const token = testUsers['Lead'].token;

    // Should have financial access
    const financialResponse = await request(app)
      .get('/api/financial/client-cost')
      .set('Authorization', `Bearer ${token}`);

    expect(financialResponse.status).toBe(200);

    // Should NOT have user management access
    const usersResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(usersResponse.status).toBe(403);
  });

  it('should deny non-Admin users from bulk upload', async () => {
    const nonAdminRoles = ['Lead', 'HR', 'Delivery Team'];

    for (const role of nonAdminRoles) {
      const token = testUsers[role].token;

      const response = await request(app)
        .post('/api/employees/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ employees: [] });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    }
  });

  it('should allow all roles to access dashboard and basic features', async () => {
    const allRoles = ['Admin', 'Lead', 'HR', 'Delivery Team'];

    for (const role of allRoles) {
      const token = testUsers[role].token;

      // Dashboard access
      const dashboardResponse = await request(app)
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(dashboardResponse.status).toBe(200);

      // Employees access
      const employeesResponse = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${token}`);

      expect(employeesResponse.status).toBe(200);

      // Projects access
      const projectsResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(projectsResponse.status).toBe(200);
    }
  });

  it('should return current user info with correct role', async () => {
    for (const role of Object.keys(testUsers)) {
      const token = testUsers[role].token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe(role);
    }
  });
});
