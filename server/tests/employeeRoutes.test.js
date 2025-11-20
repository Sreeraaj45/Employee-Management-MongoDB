import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import employeeRoutes from '../routes/employeeRoutes.js';
import Employee from '../models/Employee.js';
import UserProfile from '../models/UserProfile.js';
import AuthService from '../services/authService.js';

describe('Employee API Routes Integration Tests', () => {
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
  }, 30000); // 30 second timeout for database connection

  beforeAll(async () => {

    // Create test Express app
    app = express();
    app.use(express.json());
    app.use('/api/employees', employeeRoutes);

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
  }, 30000); // 30 second timeout for user creation

  afterAll(async () => {
    // Clean up test data
    await Employee.deleteMany({ employee_id: { $regex: /^TEST/ } });
    await UserProfile.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    
    // Close database connection
    await mongoose.connection.close();
  }, 30000); // 30 second timeout for cleanup

  beforeEach(async () => {
    // Clean up test employees before each test
    await Employee.deleteMany({ employee_id: { $regex: /^TEST/ } });
  });

  describe('GET /api/employees', () => {
    it('should allow all authenticated roles to view employees', async () => {
      // Create a test employee
      await Employee.create({
        employee_id: 'TEST001',
        name: 'Test Employee',
        email: 'test@example.com',
        department: 'Engineering',
        designation: 'Developer'
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
          .get('/api/employees')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.employees).toBeDefined();
        expect(Array.isArray(response.body.employees)).toBe(true);
        expect(response.body.count).toBeGreaterThanOrEqual(1);
      }
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/employees');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should return employee by ID for authenticated users', async () => {
      const employee = await Employee.create({
        employee_id: 'TEST002',
        name: 'Test Employee 2',
        email: 'test2@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const response = await request(app)
        .get(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.employee).toBeDefined();
      expect(response.body.employee.employee_id).toBe('TEST002');
    });

    it('should return 404 for non-existent employee', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/employees/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Employee not found');
    });
  });

  describe('POST /api/employees', () => {
    it('should allow Admin, Lead, HR, and Delivery Team to create employees', async () => {
      const roles = [
        { token: adminToken, role: 'Admin' },
        { token: leadToken, role: 'Lead' },
        { token: hrToken, role: 'HR' },
        { token: deliveryTeamToken, role: 'Delivery Team' }
      ];

      let counter = 1;
      for (const { token, role } of roles) {
        const response = await request(app)
          .post('/api/employees')
          .set('Authorization', `Bearer ${token}`)
          .send({
            employee_id: `TEST00${counter}`,
            name: `Test Employee ${counter}`,
            email: `test${counter}@example.com`,
            department: 'Engineering',
            designation: 'Developer'
          });

        expect(response.status).toBe(201);
        expect(response.body.employee).toBeDefined();
        expect(response.body.employee.employee_id).toBe(`TEST00${counter}`);
        counter++;
      }
    });

    it('should reject creation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Employee'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Missing required fields');
    });

    it('should reject duplicate employee_id', async () => {
      await Employee.create({
        employee_id: 'TEST999',
        name: 'Existing Employee',
        email: 'existing@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employee_id: 'TEST999',
          name: 'Duplicate Employee',
          email: 'duplicate@example.com',
          department: 'Engineering',
          designation: 'Developer'
        });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should allow Admin, Lead, HR, and Delivery Team to update employees', async () => {
      const employee = await Employee.create({
        employee_id: 'TEST100',
        name: 'Original Name',
        email: 'original@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const response = await request(app)
        .put(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.employee.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent employee', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/employees/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should allow Admin and Delivery Team to delete employees', async () => {
      const employee1 = await Employee.create({
        employee_id: 'TEST200',
        name: 'To Delete 1',
        email: 'delete1@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const employee2 = await Employee.create({
        employee_id: 'TEST201',
        name: 'To Delete 2',
        email: 'delete2@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      // Admin should be able to delete
      const adminResponse = await request(app)
        .delete(`/api/employees/${employee1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminResponse.status).toBe(200);

      // Delivery Team should be able to delete
      const deliveryResponse = await request(app)
        .delete(`/api/employees/${employee2._id}`)
        .set('Authorization', `Bearer ${deliveryTeamToken}`);

      expect(deliveryResponse.status).toBe(200);
    });

    it('should deny Lead and HR from deleting employees', async () => {
      const employee1 = await Employee.create({
        employee_id: 'TEST202',
        name: 'Protected 1',
        email: 'protected1@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const employee2 = await Employee.create({
        employee_id: 'TEST203',
        name: 'Protected 2',
        email: 'protected2@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      // Lead should be denied
      const leadResponse = await request(app)
        .delete(`/api/employees/${employee1._id}`)
        .set('Authorization', `Bearer ${leadToken}`);

      expect(leadResponse.status).toBe(403);
      expect(leadResponse.body.error.message).toBe('Insufficient permissions');

      // HR should be denied
      const hrResponse = await request(app)
        .delete(`/api/employees/${employee2._id}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(hrResponse.status).toBe(403);
      expect(hrResponse.body.error.message).toBe('Insufficient permissions');
    });
  });

  describe('POST /api/employees/bulk', () => {
    it('should allow Admin to bulk upload employees', async () => {
      const employees = [
        {
          employee_id: 'TEST300',
          name: 'Bulk Employee 1',
          email: 'bulk1@example.com',
          department: 'Engineering',
          designation: 'Developer'
        },
        {
          employee_id: 'TEST301',
          name: 'Bulk Employee 2',
          email: 'bulk2@example.com',
          department: 'Engineering',
          designation: 'Developer'
        }
      ];

      const response = await request(app)
        .post('/api/employees/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employees, conflictResolution: 'skip' });

      expect(response.status).toBe(200);
      expect(response.body.results.created).toBe(2);
    });

    it('should deny non-Admin roles from bulk upload', async () => {
      const employees = [
        {
          employee_id: 'TEST400',
          name: 'Bulk Employee',
          email: 'bulk@example.com',
          department: 'Engineering',
          designation: 'Developer'
        }
      ];

      const roles = [
        { token: leadToken, role: 'Lead' },
        { token: hrToken, role: 'HR' },
        { token: deliveryTeamToken, role: 'Delivery Team' }
      ];

      for (const { token, role } of roles) {
        const response = await request(app)
          .post('/api/employees/bulk')
          .set('Authorization', `Bearer ${token}`)
          .send({ employees });

        expect(response.status).toBe(403);
        expect(response.body.error.message).toBe('Insufficient permissions');
      }
    });

    it('should handle conflicts according to conflictResolution strategy', async () => {
      // Create existing employee
      await Employee.create({
        employee_id: 'TEST500',
        name: 'Existing Employee',
        email: 'existing@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      // Test skip strategy
      const skipResponse = await request(app)
        .post('/api/employees/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employees: [
            {
              employee_id: 'TEST500',
              name: 'Updated Name',
              email: 'existing@example.com',
              department: 'Engineering',
              designation: 'Developer'
            }
          ],
          conflictResolution: 'skip'
        });

      expect(skipResponse.status).toBe(200);
      expect(skipResponse.body.results.skipped).toBe(1);

      // Test overwrite strategy
      const overwriteResponse = await request(app)
        .post('/api/employees/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employees: [
            {
              employee_id: 'TEST500',
              name: 'Overwritten Name',
              email: 'existing@example.com',
              department: 'Engineering',
              designation: 'Developer'
            }
          ],
          conflictResolution: 'overwrite'
        });

      expect(overwriteResponse.status).toBe(200);
      expect(overwriteResponse.body.results.updated).toBe(1);
    });
  });

  describe('DELETE /api/employees/bulk', () => {
    it('should allow Admin to mass delete employees', async () => {
      const employee1 = await Employee.create({
        employee_id: 'TEST600',
        name: 'Mass Delete 1',
        email: 'mass1@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const employee2 = await Employee.create({
        employee_id: 'TEST601',
        name: 'Mass Delete 2',
        email: 'mass2@example.com',
        department: 'Engineering',
        designation: 'Developer'
      });

      const response = await request(app)
        .delete('/api/employees/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [employee1._id, employee2._id] });

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(2);
    });

    it('should deny non-Admin roles from mass delete', async () => {
      const roles = [
        { token: leadToken, role: 'Lead' },
        { token: hrToken, role: 'HR' },
        { token: deliveryTeamToken, role: 'Delivery Team' }
      ];

      for (const { token, role } of roles) {
        const response = await request(app)
          .delete('/api/employees/bulk')
          .set('Authorization', `Bearer ${token}`)
          .send({ ids: ['some-id'] });

        expect(response.status).toBe(403);
        expect(response.body.error.message).toBe('Insufficient permissions');
      }
    });
  });
});
