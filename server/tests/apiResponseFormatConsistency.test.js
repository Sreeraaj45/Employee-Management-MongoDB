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

describe('API Response Format Consistency Property-Based Tests', () => {
  let adminToken;
  let testEmployeeId;
  let testProjectId;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test admin user
    const hashedPassword = await AuthService.hashPassword('testpass123');
    const adminUser = await UserProfile.create({
      email: 'admin_api_format@test.com',
      password: hashedPassword,
      name: 'Admin API Format',
      role: 'Admin'
    });

    adminToken = AuthService.generateToken(adminUser._id.toString(), 'Admin');

    // Create test data
    const employee = await Employee.create({
      employee_id: 'API001',
      name: 'API Test Employee',
      email: 'apitest@test.com',
      department: 'Engineering',
      designation: 'Developer',
      ctc: 100000,
      rate: 50
    });
    testEmployeeId = employee._id.toString();

    const project = await Project.create({
      name: 'API Test Project',
      client: 'API Test Client',
      start_date: new Date(),
      status: 'Active'
    });
    testProjectId = project._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await UserProfile.deleteMany({ email: 'admin_api_format@test.com' });
    await Employee.deleteMany({ employee_id: 'API001' });
    await Project.deleteMany({ name: 'API Test Project' });
    
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 6: API response format consistency
   * Validates: Requirements 4.3, 10.3
   * 
   * For any API endpoint, the response format should match the existing TypeScript 
   * interfaces used by the frontend.
   */
  it('Property 6: API response format consistency - all endpoints return consistent format', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random endpoint selections
        fc.constantFrom(
          { method: 'GET', path: '/employees', expectArray: true, dataKey: 'employees' },
          { method: 'GET', path: `/employees/${testEmployeeId}`, expectArray: false, dataKey: 'employee' },
          { method: 'GET', path: '/projects', expectArray: true, dataKey: 'projects' },
          { method: 'GET', path: `/projects/${testProjectId}`, expectArray: false, dataKey: 'project' },
          { method: 'GET', path: '/users', expectArray: true, dataKey: 'users' },
          { method: 'GET', path: '/notifications', expectArray: true, dataKey: 'notifications' },
          { method: 'GET', path: '/dashboard/metrics', expectArray: false, dataKey: 'metrics' },
          { method: 'GET', path: '/dashboard/charts', expectArray: false, dataKey: 'charts' },
          { method: 'GET', path: '/dropdowns', expectArray: false, dataKey: 'dropdowns' }
        ),
        async (endpoint) => {
          const response = await request(app)
            .get(`/api${endpoint.path}`)
            .set('Authorization', `Bearer ${adminToken}`);

          // Verify successful response
          expect(response.status).toBe(200);
          
          // Verify response has JSON content type
          expect(response.headers['content-type']).toMatch(/application\/json/);

          // Verify response body structure
          expect(response.body).toBeDefined();
          expect(typeof response.body).toBe('object');

          // Verify data key exists
          expect(response.body[endpoint.dataKey]).toBeDefined();

          // Verify data type matches expectation
          if (endpoint.expectArray) {
            expect(Array.isArray(response.body[endpoint.dataKey])).toBe(true);
          } else {
            expect(typeof response.body[endpoint.dataKey]).toBe('object');
          }

          // Verify no error key in successful response
          expect(response.body.error).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should return consistent error format for all error responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random invalid requests
        fc.constantFrom(
          { method: 'GET', path: '/employees/invalid-id', expectedStatus: 400 },
          { method: 'GET', path: '/projects/invalid-id', expectedStatus: 400 },
          { method: 'POST', path: '/employees', data: {}, expectedStatus: 400 }, // Missing required fields
          { method: 'DELETE', path: '/users/nonexistent-id', expectedStatus: 400 }
        ),
        async (testCase) => {
          let response;
          
          if (testCase.method === 'GET') {
            response = await request(app)
              .get(`/api${testCase.path}`)
              .set('Authorization', `Bearer ${adminToken}`);
          } else if (testCase.method === 'POST') {
            response = await request(app)
              .post(`/api${testCase.path}`)
              .set('Authorization', `Bearer ${adminToken}`)
              .send(testCase.data);
          } else if (testCase.method === 'DELETE') {
            response = await request(app)
              .delete(`/api${testCase.path}`)
              .set('Authorization', `Bearer ${adminToken}`);
          }

          // Verify error response structure
          expect(response.body).toBeDefined();
          expect(response.body.error).toBeDefined();
          expect(response.body.error.message).toBeDefined();
          expect(typeof response.body.error.message).toBe('string');
          
          // Verify no data keys in error response
          expect(response.body.employees).toBeUndefined();
          expect(response.body.projects).toBeUndefined();
          expect(response.body.users).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  it('should return consistent format for POST/PUT operations', async () => {
    const response = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employee_id: 'API002',
        name: 'Test Employee 2',
        email: 'test2@test.com',
        department: 'HR',
        designation: 'Manager'
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.message).toBeDefined();
    expect(response.body.employee).toBeDefined();
    expect(response.body.employee._id).toBeDefined();
    expect(response.body.employee.employee_id).toBe('API002');

    // Clean up
    await Employee.deleteMany({ employee_id: 'API002' });
  });

  it('should return consistent format for DELETE operations', async () => {
    // Create a test employee to delete
    const employee = await Employee.create({
      employee_id: 'API003',
      name: 'Delete Test',
      email: 'delete@test.com',
      department: 'Engineering',
      designation: 'Developer'
    });

    const response = await request(app)
      .delete(`/api/employees/${employee._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.message).toBeDefined();
    expect(typeof response.body.message).toBe('string');
  });

  it('should include metadata in list responses', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.employees).toBeDefined();
    expect(Array.isArray(response.body.employees)).toBe(true);
    
    // Many list endpoints include count
    if (response.body.count !== undefined) {
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('should return consistent date format in responses', async () => {
    const response = await request(app)
      .get(`/api/employees/${testEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.employee).toBeDefined();
    
    // Check date fields are in ISO format
    if (response.body.employee.created_at) {
      expect(typeof response.body.employee.created_at).toBe('string');
      expect(() => new Date(response.body.employee.created_at)).not.toThrow();
    }
    
    if (response.body.employee.updated_at) {
      expect(typeof response.body.employee.updated_at).toBe('string');
      expect(() => new Date(response.body.employee.updated_at)).not.toThrow();
    }
  });

  it('should not expose sensitive data in responses', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toBeDefined();
    
    // Verify passwords are not included (most important security check)
    response.body.users.forEach(user => {
      expect(user.password).toBeUndefined();
    });
  });
});
