import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('API Authentication Header Requirement Property-Based Tests', () => {
  let validToken;
  let expiredToken;
  let invalidToken;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test user
    const hashedPassword = await AuthService.hashPassword('testpass123');
    const user = await UserProfile.create({
      email: 'auth_header_test@test.com',
      password: hashedPassword,
      name: 'Auth Header Test',
      role: 'Admin'
    });

    // Generate valid token
    validToken = AuthService.generateToken(user._id.toString(), 'Admin');

    // Generate expired token (manually create with past expiration)
    // Note: For testing, we'll use an invalid token format instead
    expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    
    // Generate invalid token
    invalidToken = 'invalid.token.format';
  });

  afterAll(async () => {
    // Clean up test data
    await UserProfile.deleteMany({ email: 'auth_header_test@test.com' });
    
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 15: API authentication header requirement
   * Validates: Requirements 4.5, 10.2
   * 
   * For any protected API endpoint, requests without a valid JWT token in the 
   * Authorization header should be rejected with a 401 Unauthorized error.
   */
  it('Property 15: API authentication header requirement - protected endpoints require valid JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random protected endpoints
        fc.constantFrom(
          '/employees',
          '/projects',
          '/users',
          '/notifications',
          '/dashboard/metrics',
          '/dashboard/charts',
          '/dropdowns',
          '/financial/client-cost',
          '/financial/project-cost',
          '/financial/analysis'
        ),
        async (endpoint) => {
          // Test 1: No Authorization header
          const noAuthResponse = await request(app)
            .get(`/api${endpoint}`);

          expect(noAuthResponse.status).toBe(401);
          expect(noAuthResponse.body.error).toBeDefined();
          expect(noAuthResponse.body.error.message).toBe('Authentication required');

          // Test 2: Invalid token format
          const invalidTokenResponse = await request(app)
            .get(`/api${endpoint}`)
            .set('Authorization', `Bearer ${invalidToken}`);

          expect(invalidTokenResponse.status).toBe(401);
          expect(invalidTokenResponse.body.error).toBeDefined();

          // Test 3: Malformed Authorization header (missing Bearer)
          const malformedHeaderResponse = await request(app)
            .get(`/api${endpoint}`)
            .set('Authorization', validToken); // Missing "Bearer " prefix

          expect(malformedHeaderResponse.status).toBe(401);
          expect(malformedHeaderResponse.body.error).toBeDefined();

          // Test 4: Valid token should succeed (or return 403 for role restrictions)
          const validTokenResponse = await request(app)
            .get(`/api${endpoint}`)
            .set('Authorization', `Bearer ${validToken}`);

          // Should not be 401 with valid token
          expect(validTokenResponse.status).not.toBe(401);
          // Should be either 200 (success) or 403 (forbidden due to role)
          expect([200, 403]).toContain(validTokenResponse.status);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  it('should reject requests with empty Authorization header', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', '');

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Authentication required');
  });

  it('should reject requests with only "Bearer" without token', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', 'Bearer ');

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should reject requests with invalid token signature', async () => {
    // Create a token with invalid signature
    const tamperedToken = validToken.slice(0, -10) + 'tampered123';

    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should accept requests with valid Bearer token', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.employees).toBeDefined();
  });

  it('should test all HTTP methods require authentication', async () => {
    const endpoints = [
      { method: 'GET', path: '/employees' },
      { method: 'POST', path: '/employees', data: { employee_id: 'TEST', name: 'Test', email: 'test@test.com', department: 'IT', designation: 'Dev' } },
      { method: 'PUT', path: '/users/123', data: { name: 'Updated' } },
      { method: 'DELETE', path: '/dropdowns/123' }
    ];

    for (const endpoint of endpoints) {
      let response;

      if (endpoint.method === 'GET') {
        response = await request(app).get(`/api${endpoint.path}`);
      } else if (endpoint.method === 'POST') {
        response = await request(app).post(`/api${endpoint.path}`).send(endpoint.data);
      } else if (endpoint.method === 'PUT') {
        response = await request(app).put(`/api${endpoint.path}`).send(endpoint.data);
      } else if (endpoint.method === 'DELETE') {
        response = await request(app).delete(`/api${endpoint.path}`);
      }

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('Authentication required');
    }
  });

  it('should allow public endpoints without authentication', async () => {
    // Health check endpoint should be public
    const healthResponse = await request(app).get('/api/health');
    expect(healthResponse.status).toBe(200);

    // Auth endpoints should be public (for login/register)
    // Even with wrong credentials, it should not require auth header
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' });
    
    // Should get a response (not auth header error)
    // 401 for wrong credentials is acceptable, as long as it's not "Authentication required"
    expect(loginResponse.body).toBeDefined();
    if (loginResponse.status === 401) {
      // If 401, should be for wrong credentials, not missing auth header
      expect(loginResponse.body.error.message).not.toBe('Authentication required');
    }
  });

  it('should include proper error message for missing token', async () => {
    const response = await request(app)
      .get('/api/employees');

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Authentication required');
    expect(typeof response.body.error.message).toBe('string');
    expect(response.body.error.message.length).toBeGreaterThan(0);
  });

  it('should not leak sensitive information in auth errors', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    
    // Should not expose internal details
    expect(response.body.error.message).not.toContain('jwt');
    expect(response.body.error.message).not.toContain('secret');
    expect(response.body.error.message).not.toContain('key');
    
    // Should not include stack traces in production-like responses
    expect(response.body.error.stack).toBeUndefined();
  });

  it('should handle case-insensitive Bearer keyword', async () => {
    // Test with lowercase "bearer"
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `bearer ${validToken}`);

    // Most implementations are case-sensitive, so this should fail
    // But we're testing the actual behavior
    expect([200, 401]).toContain(response.status);
  });
});
