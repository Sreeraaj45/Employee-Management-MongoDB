import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import DropdownOption from '../models/DropdownOption.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('Dashboard and Dropdown Routes Tests', () => {
  let adminToken;
  let hrToken;
  let testDropdownId;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test users
    const hashedPassword = await AuthService.hashPassword('testpass123');
    
    const adminUser = await UserProfile.create({
      email: 'admin_dashboard@test.com',
      password: hashedPassword,
      name: 'Admin Dashboard',
      role: 'Admin'
    });

    const hrUser = await UserProfile.create({
      email: 'hr_dashboard@test.com',
      password: hashedPassword,
      name: 'HR Dashboard',
      role: 'HR'
    });

    adminToken = AuthService.generateToken(adminUser._id.toString(), 'Admin');
    hrToken = AuthService.generateToken(hrUser._id.toString(), 'HR');

    // Create test data for dashboard
    await Employee.create({
      employee_id: 'EMP001',
      name: 'Test Employee 1',
      email: 'emp1@test.com',
      department: 'Engineering',
      designation: 'Developer',
      billability_status: 'Billable'
    });

    await Project.create({
      name: 'Test Project 1',
      client: 'Test Client',
      start_date: new Date(),
      status: 'Active'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await UserProfile.deleteMany({ email: { $in: ['admin_dashboard@test.com', 'hr_dashboard@test.com'] } });
    await Employee.deleteMany({ employee_id: 'EMP001' });
    await Project.deleteMany({ name: 'Test Project 1' });
    await DropdownOption.deleteMany({ field_name: 'test_field' });
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Dashboard Routes', () => {
    it('should get dashboard metrics with valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.totalEmployees).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.totalProjects).toBeGreaterThanOrEqual(0);
      expect(response.body.metrics.activeProjects).toBeGreaterThanOrEqual(0);
    });

    it('should get dashboard charts with valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/charts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.charts).toBeDefined();
      expect(response.body.charts.billabilityChart).toBeDefined();
      expect(response.body.charts.departmentChart).toBeDefined();
      expect(response.body.charts.projectStatusChart).toBeDefined();
    });

    it('should reject dashboard access without token', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics');

      expect(response.status).toBe(401);
    });
  });

  describe('Dropdown Routes', () => {
    it('should get all dropdown options with valid token', async () => {
      const response = await request(app)
        .get('/api/dropdowns')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dropdowns).toBeDefined();
    });

    it('should create dropdown option as Admin', async () => {
      const response = await request(app)
        .post('/api/dropdowns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field_name: 'test_field',
          option_value: 'Test Value',
          display_order: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.dropdown).toBeDefined();
      expect(response.body.dropdown.field_name).toBe('test_field');
      expect(response.body.dropdown.option_value).toBe('Test Value');
      
      testDropdownId = response.body.dropdown._id;
    });

    it('should reject dropdown creation as non-Admin', async () => {
      const response = await request(app)
        .post('/api/dropdowns')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          field_name: 'test_field',
          option_value: 'Test Value 2'
        });

      expect(response.status).toBe(403);
    });

    it('should update dropdown option as Admin', async () => {
      // First create a dropdown
      const createResponse = await request(app)
        .post('/api/dropdowns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field_name: 'test_field',
          option_value: 'Update Test'
        });

      const dropdownId = createResponse.body.dropdown._id;

      const response = await request(app)
        .put(`/api/dropdowns/${dropdownId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          option_value: 'Updated Value',
          display_order: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.dropdown.option_value).toBe('Updated Value');
      expect(response.body.dropdown.display_order).toBe(5);
    });

    it('should reject dropdown update as non-Admin', async () => {
      const response = await request(app)
        .put(`/api/dropdowns/${testDropdownId}`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          option_value: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
    });

    it('should soft delete dropdown option as Admin', async () => {
      // First create a dropdown
      const createResponse = await request(app)
        .post('/api/dropdowns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field_name: 'test_field',
          option_value: 'Delete Test'
        });

      const dropdownId = createResponse.body.dropdown._id;

      const response = await request(app)
        .delete(`/api/dropdowns/${dropdownId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dropdown.is_active).toBe(false);
    });

    it('should reject dropdown deletion as non-Admin', async () => {
      const response = await request(app)
        .delete(`/api/dropdowns/${testDropdownId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject creating duplicate dropdown option', async () => {
      const response = await request(app)
        .post('/api/dropdowns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field_name: 'test_field',
          option_value: 'Test Value' // Same as created earlier
        });

      expect(response.status).toBe(409);
    });

    it('should reject creating dropdown without required fields', async () => {
      const response = await request(app)
        .post('/api/dropdowns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field_name: 'test_field'
          // Missing option_value
        });

      expect(response.status).toBe(400);
    });
  });
});
