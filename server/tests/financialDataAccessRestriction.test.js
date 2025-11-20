import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('Financial Data Access Restriction Property-Based Tests', () => {
  let testUsers = {};

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test users for each role
    const roles = ['Admin', 'Lead', 'HR', 'Delivery Team'];
    
    for (const role of roles) {
      const hashedPassword = await AuthService.hashPassword('testpass123');
      const user = await UserProfile.create({
        email: `${role.toLowerCase().replace(' ', '_')}_financial@test.com`,
        password: hashedPassword,
        name: `Test ${role} Financial`,
        role: role
      });
      
      testUsers[role] = {
        id: user._id.toString(),
        token: AuthService.generateToken(user._id.toString(), role)
      };
    }

    // Create test financial data
    await Employee.create({
      employee_id: 'FIN001',
      name: 'Financial Test Employee',
      email: 'fintest@test.com',
      department: 'Engineering',
      designation: 'Developer',
      ctc: 100000,
      rate: 50,
      billability_status: 'Billable',
      client: 'Test Client'
    });

    await Project.create({
      name: 'Financial Test Project',
      client: 'Test Client',
      start_date: new Date(),
      status: 'Active',
      budget: 500000
    });
  });

  afterAll(async () => {
    // Clean up test users
    await UserProfile.deleteMany({
      email: { $in: Object.keys(testUsers).map(role => `${role.toLowerCase().replace(' ', '_')}_financial@test.com`) }
    });
    
    // Clean up test data
    await Employee.deleteMany({ employee_id: 'FIN001' });
    await Project.deleteMany({ name: 'Financial Test Project' });
    
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 9: Financial data access restriction
   * Validates: Requirements 6.6, 11.2, 11.3
   * 
   * For any financial data request, only users with Admin or Lead roles should receive 
   * the data, while HR and Delivery Team roles should be denied.
   */
  it('Property 9: Financial data access restriction - only Admin and Lead can access financial data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random roles to test access control
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        async (userRole) => {
          const token = testUsers[userRole].token;
          const allowedRoles = ['Admin', 'Lead'];
          const shouldHaveAccess = allowedRoles.includes(userRole);

          // Test 1: GET /api/financial/client-cost
          const clientCostResponse = await request(app)
            .get('/api/financial/client-cost')
            .set('Authorization', `Bearer ${token}`);

          if (shouldHaveAccess) {
            expect(clientCostResponse.status).toBe(200);
            expect(clientCostResponse.body.clientCosts).toBeDefined();
            expect(Array.isArray(clientCostResponse.body.clientCosts)).toBe(true);
            // Verify financial data is present
            expect(clientCostResponse.body).toHaveProperty('totalCost');
          } else {
            expect(clientCostResponse.status).toBe(403);
            expect(clientCostResponse.body.error).toBeDefined();
            expect(clientCostResponse.body.error.message).toBe('Insufficient permissions');
            // Verify no financial data is leaked
            expect(clientCostResponse.body.clientCosts).toBeUndefined();
            expect(clientCostResponse.body.totalCost).toBeUndefined();
          }

          // Test 2: GET /api/financial/project-cost
          const projectCostResponse = await request(app)
            .get('/api/financial/project-cost')
            .set('Authorization', `Bearer ${token}`);

          if (shouldHaveAccess) {
            expect(projectCostResponse.status).toBe(200);
            expect(projectCostResponse.body.projectCosts).toBeDefined();
            expect(Array.isArray(projectCostResponse.body.projectCosts)).toBe(true);
            // Verify financial data is present
            expect(projectCostResponse.body).toHaveProperty('totalBudget');
            expect(projectCostResponse.body).toHaveProperty('totalCost');
          } else {
            expect(projectCostResponse.status).toBe(403);
            expect(projectCostResponse.body.error).toBeDefined();
            expect(projectCostResponse.body.error.message).toBe('Insufficient permissions');
            // Verify no financial data is leaked
            expect(projectCostResponse.body.projectCosts).toBeUndefined();
            expect(projectCostResponse.body.totalBudget).toBeUndefined();
            expect(projectCostResponse.body.totalCost).toBeUndefined();
          }

          // Test 3: GET /api/financial/analysis
          const analysisResponse = await request(app)
            .get('/api/financial/analysis')
            .set('Authorization', `Bearer ${token}`);

          if (shouldHaveAccess) {
            expect(analysisResponse.status).toBe(200);
            expect(analysisResponse.body.analysis).toBeDefined();
            expect(analysisResponse.body.analysis.overview).toBeDefined();
            // Verify comprehensive financial data is present
            expect(analysisResponse.body.analysis.overview).toHaveProperty('totalCTC');
            expect(analysisResponse.body.analysis.overview).toHaveProperty('totalRate');
            expect(analysisResponse.body.analysis.overview).toHaveProperty('totalBudget');
            expect(analysisResponse.body.analysis).toHaveProperty('billabilityImpact');
            expect(analysisResponse.body.analysis).toHaveProperty('departmentCosts');
            expect(analysisResponse.body.analysis).toHaveProperty('experienceBandCosts');
          } else {
            expect(analysisResponse.status).toBe(403);
            expect(analysisResponse.body.error).toBeDefined();
            expect(analysisResponse.body.error.message).toBe('Insufficient permissions');
            // Verify no financial data is leaked
            expect(analysisResponse.body.analysis).toBeUndefined();
          }

          // Test 4: Verify that financial endpoints with query parameters also respect access control
          const clientCostWithParamResponse = await request(app)
            .get('/api/financial/client-cost?client=Test Client')
            .set('Authorization', `Bearer ${token}`);

          if (shouldHaveAccess) {
            expect(clientCostWithParamResponse.status).toBe(200);
            expect(clientCostWithParamResponse.body.clientCosts).toBeDefined();
          } else {
            expect(clientCostWithParamResponse.status).toBe(403);
            expect(clientCostWithParamResponse.body.error).toBeDefined();
            expect(clientCostWithParamResponse.body.clientCosts).toBeUndefined();
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations
    );
  }, 30000); // 30 second timeout

  it('should reject financial access without authentication token', async () => {
    const endpoints = [
      '/api/financial/client-cost',
      '/api/financial/project-cost',
      '/api/financial/analysis'
    ];

    for (const endpoint of endpoints) {
      const response = await request(app).get(endpoint);
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('Authentication required');
    }
  });

  it('should provide detailed financial data to Admin users', async () => {
    const token = testUsers['Admin'].token;

    const response = await request(app)
      .get('/api/financial/analysis')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.analysis).toBeDefined();
    
    // Verify all financial metrics are present
    const { overview, billabilityImpact, departmentCosts, experienceBandCosts } = response.body.analysis;
    
    expect(overview).toHaveProperty('totalCTC');
    expect(overview).toHaveProperty('totalRate');
    expect(overview).toHaveProperty('averageCTC');
    expect(overview).toHaveProperty('averageRate');
    expect(overview).toHaveProperty('totalBudget');
    
    expect(billabilityImpact).toHaveProperty('potentialRevenue');
    expect(billabilityImpact).toHaveProperty('actualCost');
    
    expect(Array.isArray(departmentCosts)).toBe(true);
    expect(Array.isArray(experienceBandCosts)).toBe(true);
  });

  it('should provide detailed financial data to Lead users', async () => {
    const token = testUsers['Lead'].token;

    const response = await request(app)
      .get('/api/financial/project-cost')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.projectCosts).toBeDefined();
    expect(response.body).toHaveProperty('totalBudget');
    expect(response.body).toHaveProperty('totalCost');
  });

  it('should completely deny financial access to HR users', async () => {
    const token = testUsers['HR'].token;

    const clientCostResponse = await request(app)
      .get('/api/financial/client-cost')
      .set('Authorization', `Bearer ${token}`);

    expect(clientCostResponse.status).toBe(403);
    expect(clientCostResponse.body.clientCosts).toBeUndefined();
    expect(clientCostResponse.body.totalCost).toBeUndefined();
  });

  it('should completely deny financial access to Delivery Team users', async () => {
    const token = testUsers['Delivery Team'].token;

    const analysisResponse = await request(app)
      .get('/api/financial/analysis')
      .set('Authorization', `Bearer ${token}`);

    expect(analysisResponse.status).toBe(403);
    expect(analysisResponse.body.analysis).toBeUndefined();
  });
});
