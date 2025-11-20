import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import UserProfile from '../models/UserProfile.js';
import Employee from '../models/Employee.js';
import AuthService from '../services/authService.js';
import connectDB from '../config/database.js';

describe('Bulk Upload Conflict Resolution Property-Based Tests', () => {
  let adminToken;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();

    // Create test admin user
    const hashedPassword = await AuthService.hashPassword('testpass123');
    const adminUser = await UserProfile.create({
      email: 'admin_bulk_upload@test.com',
      password: hashedPassword,
      name: 'Admin Bulk Upload',
      role: 'Admin'
    });

    adminToken = AuthService.generateToken(adminUser._id.toString(), 'Admin');
  });

  afterAll(async () => {
    // Clean up test data
    await UserProfile.deleteMany({ email: 'admin_bulk_upload@test.com' });
    await Employee.deleteMany({ employee_id: { $regex: /^BULK_TEST_/ } });
    
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test employees before each test
    await Employee.deleteMany({ employee_id: { $regex: /^BULK_TEST_/ } });
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 12: Bulk upload conflict resolution
   * Validates: Requirements 7.2
   * 
   * For any bulk upload operation with conflicts, the system should handle conflict 
   * resolution according to user choices without data loss.
   */
  it('Property 12: Bulk upload conflict resolution - handles conflicts correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random conflict resolution strategies
        fc.constantFrom('skip', 'overwrite'),
        // Generate random number of employees
        fc.integer({ min: 2, max: 5 }),
        async (conflictResolution, numEmployees) => {
          // Clean up before this iteration
          await Employee.deleteMany({ employee_id: { $regex: /^BULK_PROP_/ } });
          
          // Create initial employees with unique IDs per iteration
          const timestamp = Date.now();
          const initialEmployees = [];
          for (let i = 0; i < numEmployees; i++) {
            const employee = await Employee.create({
              employee_id: `BULK_PROP_${timestamp}_${i}`,
              name: `Initial Employee ${i}`,
              email: `initial${timestamp}_${i}@test.com`,
              department: 'Engineering',
              designation: 'Developer',
              ctc: 100000
            });
            initialEmployees.push(employee);
          }

          // Create bulk upload data with conflicts (same employee_ids)
          const bulkData = [];
          for (let i = 0; i < numEmployees; i++) {
            bulkData.push({
              employee_id: `BULK_PROP_${timestamp}_${i}`, // Conflict!
              name: `Updated Employee ${i}`,
              email: `updated${timestamp}_${i}@test.com`,
              department: 'HR',
              designation: 'Manager',
              ctc: 150000
            });
          }

          // Perform bulk upload with conflict resolution
          const response = await request(app)
            .post('/api/employees/bulk')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              employees: bulkData,
              conflictResolution
            });

          expect(response.status).toBe(200);
          expect(response.body.message).toBeDefined();
          expect(response.body.results).toBeDefined();

          // Verify conflict resolution behavior
          if (conflictResolution === 'skip') {
            // With 'skip', conflicts should be skipped
            expect(response.body.results.skipped).toBeGreaterThan(0);
            
            // Original employees should remain unchanged
            for (let i = 0; i < numEmployees; i++) {
              const employee = await Employee.findOne({ employee_id: `BULK_PROP_${timestamp}_${i}` });
              expect(employee).not.toBeNull();
              expect(employee.name).toBe(`Initial Employee ${i}`);
              expect(employee.email).toBe(`initial${timestamp}_${i}@test.com`);
              expect(employee.ctc).toBe(100000);
            }
          } else if (conflictResolution === 'overwrite') {
            // With 'overwrite', conflicts should be updated
            expect(response.body.results.updated).toBeGreaterThan(0);
            
            // Employees should be updated with new data
            for (let i = 0; i < numEmployees; i++) {
              const employee = await Employee.findOne({ employee_id: `BULK_PROP_${timestamp}_${i}` });
              expect(employee).not.toBeNull();
              expect(employee.name).toBe(`Updated Employee ${i}`);
              expect(employee.email).toBe(`updated${timestamp}_${i}@test.com`);
              expect(employee.ctc).toBe(150000);
            }
          }

          // Verify no data loss - total count should match
          const totalEmployees = await Employee.countDocuments({ 
            employee_id: { $regex: new RegExp(`^BULK_PROP_${timestamp}_`) } 
          });
          expect(totalEmployees).toBe(numEmployees);
          
          // Clean up after this iteration
          await Employee.deleteMany({ employee_id: { $regex: /^BULK_PROP_/ } });
        }
      ),
      { numRuns: 5 } // Run 5 iterations (reduced for performance)
    );
  }, 60000); // 60 second timeout

  it('should skip conflicting employees when resolution is skip', async () => {
    // Create existing employee
    await Employee.create({
      employee_id: 'BULK_TEST_SKIP',
      name: 'Original Employee',
      email: 'original@test.com',
      department: 'Engineering',
      designation: 'Developer',
      ctc: 100000
    });

    // Try to upload conflicting employee
    const response = await request(app)
      .post('/api/employees/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employees: [
          {
            employee_id: 'BULK_TEST_SKIP',
            name: 'Conflicting Employee',
            email: 'conflict@test.com',
            department: 'HR',
            designation: 'Manager',
            ctc: 150000
          }
        ],
        conflictResolution: 'skip'
      });

    expect(response.status).toBe(200);
    expect(response.body.results.skipped).toBe(1);

    // Verify original employee unchanged
    const employee = await Employee.findOne({ employee_id: 'BULK_TEST_SKIP' });
    expect(employee.name).toBe('Original Employee');
    expect(employee.email).toBe('original@test.com');
  });

  it('should overwrite conflicting employees when resolution is overwrite', async () => {
    // Create existing employee
    await Employee.create({
      employee_id: 'BULK_TEST_OVERWRITE',
      name: 'Original Employee',
      email: 'original@test.com',
      department: 'Engineering',
      designation: 'Developer',
      ctc: 100000
    });

    // Upload conflicting employee with overwrite
    const response = await request(app)
      .post('/api/employees/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employees: [
          {
            employee_id: 'BULK_TEST_OVERWRITE',
            name: 'Updated Employee',
            email: 'updated@test.com',
            department: 'HR',
            designation: 'Manager',
            ctc: 150000
          }
        ],
        conflictResolution: 'overwrite'
      });

    expect(response.status).toBe(200);
    expect(response.body.results.updated).toBe(1);

    // Verify employee was updated
    const employee = await Employee.findOne({ employee_id: 'BULK_TEST_OVERWRITE' });
    expect(employee.name).toBe('Updated Employee');
    expect(employee.email).toBe('updated@test.com');
    expect(employee.ctc).toBe(150000);
  });

  it('should create new employees without conflicts', async () => {
    const response = await request(app)
      .post('/api/employees/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employees: [
          {
            employee_id: 'BULK_TEST_NEW_1',
            name: 'New Employee 1',
            email: 'new1@test.com',
            department: 'Engineering',
            designation: 'Developer'
          },
          {
            employee_id: 'BULK_TEST_NEW_2',
            name: 'New Employee 2',
            email: 'new2@test.com',
            department: 'HR',
            designation: 'Manager'
          }
        ],
        conflictResolution: 'skip'
      });

    expect(response.status).toBe(200);
    expect(response.body.results.created).toBe(2);

    // Verify employees were created
    const employee1 = await Employee.findOne({ employee_id: 'BULK_TEST_NEW_1' });
    const employee2 = await Employee.findOne({ employee_id: 'BULK_TEST_NEW_2' });
    
    expect(employee1).not.toBeNull();
    expect(employee2).not.toBeNull();
    expect(employee1.name).toBe('New Employee 1');
    expect(employee2.name).toBe('New Employee 2');
  });

  it('should handle mixed scenario with new and conflicting employees', async () => {
    // Create existing employee
    await Employee.create({
      employee_id: 'BULK_TEST_MIXED_1',
      name: 'Existing Employee',
      email: 'existing@test.com',
      department: 'Engineering',
      designation: 'Developer'
    });

    // Upload mix of new and conflicting employees
    const response = await request(app)
      .post('/api/employees/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employees: [
          {
            employee_id: 'BULK_TEST_MIXED_1', // Conflict
            name: 'Updated Employee',
            email: 'updated@test.com',
            department: 'HR',
            designation: 'Manager'
          },
          {
            employee_id: 'BULK_TEST_MIXED_2', // New
            name: 'New Employee',
            email: 'new@test.com',
            department: 'Finance',
            designation: 'Analyst'
          }
        ],
        conflictResolution: 'skip'
      });

    expect(response.status).toBe(200);
    expect(response.body.results.created).toBe(1);
    expect(response.body.results.skipped).toBe(1);

    // Verify results
    const existing = await Employee.findOne({ employee_id: 'BULK_TEST_MIXED_1' });
    const newEmp = await Employee.findOne({ employee_id: 'BULK_TEST_MIXED_2' });
    
    expect(existing.name).toBe('Existing Employee'); // Unchanged
    expect(newEmp.name).toBe('New Employee'); // Created
  });

  it('should return detailed results about the bulk upload', async () => {
    const response = await request(app)
      .post('/api/employees/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employees: [
          {
            employee_id: 'BULK_TEST_RESULT',
            name: 'Test Employee',
            email: 'test@test.com',
            department: 'Engineering',
            designation: 'Developer'
          }
        ],
        conflictResolution: 'skip'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();
    expect(response.body.results).toBeDefined();
    expect(response.body.results.created).toBeDefined();
    expect(response.body.results.updated).toBeDefined();
    expect(response.body.results.skipped).toBeDefined();
    // Note: 'failed' field may not be present if there are no failures
    expect(typeof response.body.results.created).toBe('number');
  });

  it('should reject bulk upload from non-Admin users', async () => {
    // Create HR user
    const hashedPassword = await AuthService.hashPassword('testpass123');
    const hrUser = await UserProfile.create({
      email: 'hr_bulk_test@test.com',
      password: hashedPassword,
      name: 'HR User',
      role: 'HR'
    });

    const hrToken = AuthService.generateToken(hrUser._id.toString(), 'HR');

    const response = await request(app)
      .post('/api/employees/bulk')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employees: [
          {
            employee_id: 'BULK_TEST_UNAUTHORIZED',
            name: 'Test Employee',
            email: 'test@test.com',
            department: 'Engineering',
            designation: 'Developer'
          }
        ]
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBeDefined();

    // Clean up
    await UserProfile.deleteMany({ email: 'hr_bulk_test@test.com' });
  });
});
