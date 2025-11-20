import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Notification from '../models/Notification.js';
import NotificationRead from '../models/NotificationRead.js';
import UserProfile from '../models/UserProfile.js';

describe('Notification Targeting Property-Based Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    try {
      // Create an in-memory MongoDB instance for testing
      console.log('Starting in-memory MongoDB server for testing...');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      // Connect to the in-memory database
      await mongoose.connect(mongoUri);
      
      console.log('Successfully connected to in-memory MongoDB');
    } catch (error) {
      console.error('Failed to start in-memory MongoDB:', error.message);
      throw error;
    }
  }, 60000); // 60 second timeout for starting MongoDB Memory Server

  afterAll(async () => {
    try {
      // Clean up and disconnect
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      
      // Stop the in-memory MongoDB server
      if (mongoServer) {
        await mongoServer.stop();
      }
      
      console.log('Successfully cleaned up and stopped in-memory MongoDB');
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }, 30000); // 30 second timeout for cleanup

  beforeEach(async () => {
    // Clean up before each test
    await Notification.deleteMany({});
    await NotificationRead.deleteMany({});
    await UserProfile.deleteMany({});
  });

  /**
   * Feature: supabase-to-mongodb-migration, Property 11: Notification targeting
   * Validates: Requirements 7.1
   * 
   * For any notification created with specific target roles, only users with those roles 
   * should see the notification in their notification list.
   */
  it('Property 11: Notification targeting - notifications should only be visible to targeted roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random subset of roles to target
        fc.array(
          fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
          { minLength: 1, maxLength: 4 }
        ).map(roles => [...new Set(roles)]), // Remove duplicates
        // Generate a notification title and message (non-empty after trim)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        async (targetRoles, title, message) => {
          // Create a notification with specific target roles
          const notification = await Notification.create({
            title,
            message,
            type: 'system_announcement',
            priority: 'medium',
            target_roles: targetRoles
          });

          // Define all possible roles
          const allRoles = ['Admin', 'Lead', 'HR', 'Delivery Team'];

          // For each role, check if they should see the notification
          for (const role of allRoles) {
            // Create a mock user with this role
            const mockUserId = new mongoose.Types.ObjectId();

            // Query notifications as this user would see them
            const visibleNotifications = await Notification.find({
              $or: [
                { target_roles: role },
                { target_user_id: mockUserId },
                { 
                  $and: [
                    { $or: [{ target_roles: { $size: 0 } }, { target_roles: { $exists: false } }] },
                    { $or: [{ target_user_id: null }, { target_user_id: { $exists: false } }] }
                  ]
                }
              ]
            });

            // Check if the notification is visible
            const isVisible = visibleNotifications.some(
              n => n._id.toString() === notification._id.toString()
            );

            // The notification should be visible if and only if the role is in target_roles
            const shouldBeVisible = targetRoles.includes(role);

            expect(isVisible).toBe(shouldBeVisible);

            // Additional verification: if visible, the notification should contain the correct data
            if (isVisible) {
              const foundNotification = visibleNotifications.find(
                n => n._id.toString() === notification._id.toString()
              );
              // Note: Mongoose schema has trim: true, so we compare with trimmed values
              expect(foundNotification.title).toBe(title.trim());
              expect(foundNotification.message).toBe(message);
              expect(foundNotification.target_roles).toContain(role);
            }
          }

          // Clean up this test's notification
          await Notification.findByIdAndDelete(notification._id);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 120000); // 120 second timeout for database operations

  /**
   * Additional property test: Notifications with specific user targeting
   * Tests that notifications targeted to a specific user are only visible to that user
   */
  it('Property 11b: User-specific notification targeting - notifications targeted to specific users should only be visible to those users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate notification data (non-empty after trim)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        // Generate a role for the targeted user
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        async (title, message, userRole) => {
          // Create a specific user to target
          const targetUserId = new mongoose.Types.ObjectId();

          // Create a notification targeted to a specific user
          const notification = await Notification.create({
            title,
            message,
            type: 'system_announcement',
            priority: 'medium',
            target_user_id: targetUserId,
            target_roles: [] // No role targeting, only user-specific
          });

          // The targeted user should see the notification
          const targetUserNotifications = await Notification.find({
            $or: [
              { target_roles: userRole },
              { target_user_id: targetUserId },
              { 
                $and: [
                  { $or: [{ target_roles: { $size: 0 } }, { target_roles: { $exists: false } }] },
                  { $or: [{ target_user_id: null }, { target_user_id: { $exists: false } }] }
                ]
              }
            ]
          });

          const targetUserCanSee = targetUserNotifications.some(
            n => n._id.toString() === notification._id.toString()
          );
          expect(targetUserCanSee).toBe(true);

          // A different user with the same role should NOT see the notification
          const differentUserId = new mongoose.Types.ObjectId();
          const differentUserNotifications = await Notification.find({
            $or: [
              { target_roles: userRole },
              { target_user_id: differentUserId },
              { 
                $and: [
                  { $or: [{ target_roles: { $size: 0 } }, { target_roles: { $exists: false } }] },
                  { $or: [{ target_user_id: null }, { target_user_id: { $exists: false } }] }
                ]
              }
            ]
          });

          const differentUserCanSee = differentUserNotifications.some(
            n => n._id.toString() === notification._id.toString()
          );
          expect(differentUserCanSee).toBe(false);

          // Clean up
          await Notification.findByIdAndDelete(notification._id);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Additional property test: Notifications with no targeting
   * Tests that notifications with no specific targeting are visible to all users
   */
  it('Property 11c: Broadcast notifications - notifications with no targeting should be visible to all users', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate notification data (non-empty after trim)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        // Generate a random role to test with
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        async (title, message, testRole) => {
          // Create a notification with no targeting (broadcast to all)
          const notification = await Notification.create({
            title,
            message,
            type: 'system_announcement',
            priority: 'medium',
            target_roles: [], // Empty array means no role targeting
            target_user_id: null // No user targeting
          });

          // Any user with any role should see this notification
          const mockUserId = new mongoose.Types.ObjectId();
          const visibleNotifications = await Notification.find({
            $or: [
              { target_roles: testRole },
              { target_user_id: mockUserId },
              { 
                $and: [
                  { $or: [{ target_roles: { $size: 0 } }, { target_roles: { $exists: false } }] },
                  { $or: [{ target_user_id: null }, { target_user_id: { $exists: false } }] }
                ]
              }
            ]
          });

          const isVisible = visibleNotifications.some(
            n => n._id.toString() === notification._id.toString()
          );

          // Broadcast notifications should be visible to all users
          expect(isVisible).toBe(true);

          // Clean up
          await Notification.findByIdAndDelete(notification._id);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Additional property test: Multiple role targeting
   * Tests that notifications can target multiple roles simultaneously
   */
  it('Property 11d: Multiple role targeting - notifications can target multiple roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different roles
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        fc.constantFrom('Admin', 'Lead', 'HR', 'Delivery Team'),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (role1, role2, title) => {
          // Create notification targeting both roles
          const targetRoles = [...new Set([role1, role2])]; // Remove duplicates
          
          const notification = await Notification.create({
            title,
            message: 'Test message',
            type: 'system_announcement',
            priority: 'medium',
            target_roles: targetRoles
          });

          // Both roles should see the notification
          for (const role of targetRoles) {
            const mockUserId = new mongoose.Types.ObjectId();
            const visibleNotifications = await Notification.find({
              $or: [
                { target_roles: role },
                { target_user_id: mockUserId },
                { 
                  $and: [
                    { $or: [{ target_roles: { $size: 0 } }, { target_roles: { $exists: false } }] },
                    { $or: [{ target_user_id: null }, { target_user_id: { $exists: false } }] }
                  ]
                }
              ]
            });

            const isVisible = visibleNotifications.some(
              n => n._id.toString() === notification._id.toString()
            );

            expect(isVisible).toBe(true);
          }

          // Roles not in the target list should not see it
          const allRoles = ['Admin', 'Lead', 'HR', 'Delivery Team'];
          const nonTargetRoles = allRoles.filter(r => !targetRoles.includes(r));

          for (const role of nonTargetRoles) {
            const mockUserId = new mongoose.Types.ObjectId();
            const visibleNotifications = await Notification.find({
              $or: [
                { target_roles: role },
                { target_user_id: mockUserId },
                { 
                  $and: [
                    { $or: [{ target_roles: { $size: 0 } }, { target_roles: { $exists: false } }] },
                    { $or: [{ target_user_id: null }, { target_user_id: { $exists: false } }] }
                  ]
                }
              ]
            });

            const isVisible = visibleNotifications.some(
              n => n._id.toString() === notification._id.toString()
            );

            expect(isVisible).toBe(false);
          }

          // Clean up
          await Notification.findByIdAndDelete(notification._id);
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});
