import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import clientRoutes from '../routes/clientRoutes.js';
import Project from '../models/Project.js';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';

describe('Client API Routes Integration Tests', () => {
  let app;
  let adminToken;
  let leadToken;
  let hrToken;
  let deliveryTeamToken;
  let adminUser;
  let leadUser;
  let hrUser;
  let deliveryTeamUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    }
  }, 30000);

  beforeAll(async () => {
    // Create test Express app
    app = express();
    app.use(express.json());
    app.use('/api/clients', clientRoutes);

    // Create test users for each role
    const adminPassword = await AuthService.hashPassword('admin123');
    const leadPassword = await AuthService.hashPassword('lead123');
    const hrPassword = await AuthService.hashPassword('hr123');
    const deliveryPassword = await AuthService.hashPassword('delivery123');

    // Clean up existing test users
    await UserProfile.deleteMany({ email: { $regex: /test.*@example\.com/ } });

    adminUser = await UserProfile.create({
      email: 'test-admin@example.com',
      password: adminPassword,
      name: 'Test Admin',
      role: 'Admin'
    });

    leadUser = await UserProfile.create({
      email: 'test-lead@example.com',
      password: leadPassword,
      name: 'Test Lead',
      role: 'Lead'
    });

    hrUser = await UserProfile.create({
      email: 'test-hr@example.com',
      password: hrPassword,
      name: 'Test HR',
      role: 'HR'
    });

    deliveryTeamUser = await UserProfile.create({
      email: 'test-delivery@example.com',
      password: deliveryPassword,
      name: 'Test Delivery Team',
      role: 'Delivery Team'
    });

    // Generate tokens
    adminToken = AuthService.generateToken(adminUser._id.toString(), adminUser.role);
    leadToken = AuthService.generateToken(leadUser._id.toString(), leadUser.role);
    hrToken = AuthService.generateToken(hrUser._id.toString(), hrUser.role);
    deliveryTeamToken = AuthService.generateToken(deliveryTeamUser._id.toString(), deliveryTeamUser.role);
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    await Project.deleteMany({ client: { $regex: /^TEST/ } });
    await UserProfile.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    
    // Close database connection
    await mongoose.connection.close();
  }, 30000);

  beforeEach(async () => {
    // Clean up test projects before each test
    await Project.deleteMany({ client: { $regex: /^TEST/ } });
  });

  describe('GET /api/clients', () => {
    it('should allow all authenticated roles to view clients', async () => {
      // Create test projects with different clients
      await Project.create({
        name: 'Test Project 1',
        client: 'TEST Client A',
        start_date: new Date(),
        created_by: adminUser._id
      });

      await Project.create({
        name: 'Test Project 2',
        client: 'TEST Client B',
        start_date: new Date(),
        created_by: adminUser._id
      });

      // Test with each role
      const roles = [
        { token: adminToken, role: 'Admin' },
        { token: leadToken, role: 'Lead' },
        { token: hrToken, role: 'HR' },
        { token: deliveryTeamToken, role: 'Delivery Team' }
      ];

      for (const { token, role } of roles) {
        const response = await request(app)
          .get('/api/clients')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.clients).toBeDefined();
        expect(Array.isArray(response.body.clients)).toBe(true);
        expect(response.body.count).toBeGreaterThanOrEqual(2);
        expect(response.body.clients).toContain('TEST Client A');
        expect(response.body.clients).toContain('TEST Client B');
      }
    });

    it('should return unique clients sorted alphabetically', async () => {
      // Create multiple projects with same client
      await Project.create({
        name: 'Test Project 1',
        client: 'TEST Client Z',
        start_date: new Date(),
        created_by: adminUser._id
      });

      await Project.create({
        name: 'Test Project 2',
        client: 'TEST Client A',
        start_date: new Date(),
        created_by: adminUser._id
      });

      await Project.create({
        name: 'Test Project 3',
        client: 'TEST Client Z',
        start_date: new Date(),
        created_by: adminUser._id
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.clients).toHaveLength(2);
      expect(response.body.clients[0]).toBe('TEST Client A');
      expect(response.body.clients[1]).toBe('TEST Client Z');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/clients');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/clients', () => {
    it('should allow all authenticated roles to add clients', async () => {
      const roles = [
        { token: adminToken, role: 'Admin', client: 'TEST New Client Admin' },
        { token: leadToken, role: 'Lead', client: 'TEST New Client Lead' },
        { token: hrToken, role: 'HR', client: 'TEST New Client HR' },
        { token: deliveryTeamToken, role: 'Delivery Team', client: 'TEST New Client Delivery' }
      ];

      for (const { token, role, client } of roles) {
        const response = await request(app)
          .post('/api/clients')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: client });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Client name validated successfully');
        expect(response.body.client).toBe(client);
      }
    });

    it('should reject empty or invalid client names', async () => {
      const invalidNames = [
        { name: '' },
        { name: '   ' },
        { name: null },
        { name: 123 },
        {}
      ];

      for (const payload of invalidNames) {
        const response = await request(app)
          .post('/api/clients')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('Client name is required');
      }
    });

    it('should reject duplicate client names', async () => {
      // Create a project with a client
      await Project.create({
        name: 'Existing Project',
        client: 'TEST Existing Client',
        start_date: new Date(),
        created_by: adminUser._id
      });

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TEST Existing Client' });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe('Client already exists');
    });

    it('should trim whitespace from client names', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '  TEST Trimmed Client  ' });

      expect(response.status).toBe(201);
      expect(response.body.client).toBe('TEST Trimmed Client');
    });
  });

  describe('DELETE /api/clients/:name', () => {
    it('should allow all authenticated roles to delete clients', async () => {
      // Create projects for different clients
      const clients = [
        { name: 'TEST Delete Admin', token: adminToken },
        { name: 'TEST Delete Lead', token: leadToken },
        { name: 'TEST Delete HR', token: hrToken },
        { name: 'TEST Delete Delivery', token: deliveryTeamToken }
      ];

      for (const { name, token } of clients) {
        await Project.create({
          name: `Project for ${name}`,
          client: name,
          start_date: new Date(),
          created_by: adminUser._id
        });

        const response = await request(app)
          .delete(`/api/clients/${encodeURIComponent(name)}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Client and associated projects deleted successfully');
        expect(response.body.client).toBe(name);
        expect(response.body.projectsDeleted).toBe(1);
      }
    });

    it('should delete all projects associated with a client', async () => {
      const clientName = 'TEST Multi Project Client';

      // Create multiple projects for the same client
      await Project.create({
        name: 'Project 1',
        client: clientName,
        start_date: new Date(),
        created_by: adminUser._id
      });

      await Project.create({
        name: 'Project 2',
        client: clientName,
        start_date: new Date(),
        created_by: adminUser._id
      });

      await Project.create({
        name: 'Project 3',
        client: clientName,
        start_date: new Date(),
        created_by: adminUser._id
      });

      const response = await request(app)
        .delete(`/api/clients/${encodeURIComponent(clientName)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.projectsDeleted).toBe(3);

      // Verify projects are deleted
      const remainingProjects = await Project.find({ client: clientName });
      expect(remainingProjects).toHaveLength(0);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .delete('/api/clients/NonExistentClient')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Client not found');
    });

    it('should handle URL-encoded client names', async () => {
      const clientName = 'TEST Client With Spaces';

      await Project.create({
        name: 'Test Project',
        client: clientName,
        start_date: new Date(),
        created_by: adminUser._id
      });

      const response = await request(app)
        .delete(`/api/clients/${encodeURIComponent(clientName)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.client).toBe(clientName);
    });

    it('should reject empty client names', async () => {
      // Test with URL-encoded space
      const response = await request(app)
        .delete('/api/clients/%20')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Client name is required');
    });
  });
});
