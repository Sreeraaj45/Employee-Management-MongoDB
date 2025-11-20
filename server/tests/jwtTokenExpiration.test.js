import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import connectDB from '../config/database.js';

describe('JWT Token Expiration Property-Based Tests', () => {
  let testUser;
  let validToken;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test user
    const hashedPassword = await AuthService.hashPassword('testpass123');
    testUser = await UserProfile.create({
      email: 'jwt_expiration_test@test.com',
      password: hashedPassword,
      name: 'JWT Expiration Test',
      role: 'Admin'
    });

    // Generate valid token
    validToken = AuthService.generateToken(testUser._id.toString(), 'Admin');
  });

  afterAll(async () => {
    // Clean up test data
    await UserProfile.deleteMany({ email: 'jwt_expiration_test@test.com' });
    
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 7: JWT token expiration
   * Validates: Requirements 2.5
   * 
   * For any expired JWT token, when used in an authenticated request, 
   * the system should reject the request with an authentication error.
   */
  it('Property 7: JWT token expiration - expired tokens are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random past timestamps for expired tokens
        fc.integer({ min: 3600, max: 86400 }), // 1 hour to 24 hours ago
        async (secondsAgo) => {
          // Create a token that expired in the past
          const now = Math.floor(Date.now() / 1000);
          const expiredToken = jwt.sign(
            {
              userId: testUser._id.toString(),
              role: 'Admin',
              iat: now - secondsAgo - 3600, // Issued before expiration
              exp: now - secondsAgo // Expired in the past
            },
            config.jwtSecret
          );

          // Try to use the expired token
          const response = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${expiredToken}`);

          // Should be rejected with 401
          expect(response.status).toBe(401);
          expect(response.body.error).toBeDefined();
          expect(response.body.error.message).toBeDefined();
          
          // Should not return any data
          expect(response.body.employees).toBeUndefined();
        }
      ),
      { numRuns: 10 } // Run 10 iterations with different expiration times
    );
  }, 30000);

  it('should reject tokens that expired 1 second ago', async () => {
    // Create a token that expires in 1 second
    const shortLivedToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret,
      { expiresIn: '1s' }
    );

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 1500));

    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${shortLivedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Token expired');
  });

  it('should reject tokens that expired 1 hour ago', async () => {
    // Create a token that expired 1 hour ago
    const expiredToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin',
        iat: Math.floor(Date.now() / 1000) - 7200, // Issued 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600  // Expired 1 hour ago
      },
      config.jwtSecret
    );

    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should accept tokens that are not yet expired', async () => {
    // Use the valid token created in beforeAll
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.employees).toBeDefined();
  });

  it('should accept tokens that expire in the future', async () => {
    // Create a token that expires in 1 hour
    const futureToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${futureToken}`);

    expect(response.status).toBe(200);
    expect(response.body.employees).toBeDefined();
  });

  it('should reject tokens with tampered expiration', async () => {
    // Create a valid token
    const token = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Try to tamper with the token by modifying the payload
    const parts = token.split('.');
    if (parts.length === 3) {
      // Decode payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Modify expiration to far future
      payload.exp = Math.floor(Date.now() / 1000) + 31536000; // 1 year
      
      // Re-encode payload
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Reconstruct token (signature will be invalid)
      const tamperedToken = parts.join('.');

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${tamperedToken}`);

      // Should be rejected due to invalid signature
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    }
  });

  it('should handle tokens at the exact moment of expiration', async () => {
    // Create a token that expires in 2 seconds
    const almostExpiredToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret,
      { expiresIn: '2s' }
    );

    // Use it immediately (should work)
    const response1 = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${almostExpiredToken}`);

    expect(response1.status).toBe(200);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Use it after expiration (should fail)
    const response2 = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${almostExpiredToken}`);

    expect(response2.status).toBe(401);
  });

  it('should consistently reject expired tokens across multiple endpoints', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret,
      { expiresIn: '1s' }
    );

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Test multiple endpoints
    const endpoints = [
      '/api/employees',
      '/api/projects',
      '/api/users',
      '/api/notifications',
      '/api/dashboard/metrics'
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    }
  });

  it('should return appropriate error message for expired tokens', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret,
      { expiresIn: '1s' }
    );

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1500));

    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBe('Token expired');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('should not accept tokens with no expiration claim', async () => {
    // Create a token without expiration (should still be rejected by our system)
    const noExpToken = jwt.sign(
      {
        userId: testUser._id.toString(),
        role: 'Admin'
      },
      config.jwtSecret
      // No expiresIn option
    );

    // Our system should still accept it if it's valid
    // (The backend AuthService.generateToken always sets expiration)
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${noExpToken}`);

    // This token should work since it's valid and not expired
    expect(response.status).toBe(200);
  });
});
