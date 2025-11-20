import express from 'express';
import Notification from '../models/Notification.js';
import NotificationRead from '../models/NotificationRead.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get notifications filtered by user role
 * Returns notifications targeted to the user's role or specific user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find notifications that:
    // 1. Target the user's role (in target_roles array)
    // 2. OR target the specific user (target_user_id matches)
    // 3. OR have no specific targeting (both target_roles and target_user_id are empty/null)
    const notifications = await Notification.find({
      $or: [
        { target_roles: userRole },
        { target_user_id: userId },
        { 
          target_roles: { $exists: true, $size: 0 },
          target_user_id: { $exists: false }
        }
      ],
      // Optionally filter out expired notifications
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    })
    .populate('created_by', 'name email')
    .sort({ created_at: -1 })
    .lean();

    // Check which notifications have been read by this user
    const notificationIds = notifications.map(n => n._id);
    const readNotifications = await NotificationRead.find({
      notification_id: { $in: notificationIds },
      user_id: userId
    }).lean();

    const readNotificationIds = new Set(
      readNotifications.map(nr => nr.notification_id.toString())
    );

    // Mark notifications as read/unread
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      is_read: readNotificationIds.has(notification._id.toString()),
      read_at: readNotifications.find(
        nr => nr.notification_id.toString() === notification._id.toString()
      )?.read_at || null
    }));

    res.status(200).json({
      notifications: notificationsWithReadStatus
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to get notifications'
      }
    });
  }
});

/**
 * GET /api/notifications/unread
 * Get count of unread notifications for the current user
 */
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find all notifications for this user
    const allNotifications = await Notification.find({
      $or: [
        { target_roles: userRole },
        { target_user_id: userId },
        { 
          target_roles: { $exists: true, $size: 0 },
          target_user_id: { $exists: false }
        }
      ],
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    })
    .select('_id')
    .lean();

    const notificationIds = allNotifications.map(n => n._id);

    // Count how many have been read
    const readCount = await NotificationRead.countDocuments({
      notification_id: { $in: notificationIds },
      user_id: userId
    });

    const unreadCount = notificationIds.length - readCount;

    res.status(200).json({
      unread_count: unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to get unread count'
      }
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 * Body: { title, message, type, priority, target_roles, target_user_id, action_url, action_label, expires_at }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      target_roles,
      target_user_id,
      action_url,
      action_label,
      expires_at
    } = req.body;

    const createdBy = req.user.userId;

    // Input validation
    if (!title || !message || !type) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: title, message, and type are required'
        }
      });
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      type,
      priority: priority || 'medium',
      target_roles: target_roles || [],
      target_user_id: target_user_id || null,
      action_url: action_url || null,
      action_label: action_label || null,
      created_by: createdBy,
      expires_at: expires_at || null
    });

    await notification.save();

    // Populate created_by field
    await notification.populate('created_by', 'name email');

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to create notification'
      }
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read for the current user
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    // Check if notification exists
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        error: {
          message: 'Notification not found'
        }
      });
    }

    // Create or update notification read record
    await NotificationRead.findOneAndUpdate(
      {
        notification_id: notificationId,
        user_id: userId
      },
      {
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    res.status(200).json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to mark notification as read'
      }
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find all notifications for this user
    const notifications = await Notification.find({
      $or: [
        { target_roles: userRole },
        { target_user_id: userId },
        { 
          target_roles: { $exists: true, $size: 0 },
          target_user_id: { $exists: false }
        }
      ],
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    })
    .select('_id')
    .lean();

    const notificationIds = notifications.map(n => n._id);

    // Create read records for all notifications (using bulkWrite for efficiency)
    const bulkOps = notificationIds.map(notificationId => ({
      updateOne: {
        filter: {
          notification_id: notificationId,
          user_id: userId
        },
        update: {
          $set: {
            notification_id: notificationId,
            user_id: userId,
            read_at: new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await NotificationRead.bulkWrite(bulkOps);
    }

    res.status(200).json({
      message: 'All notifications marked as read',
      count: notificationIds.length
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    
    res.status(500).json({
      error: {
        message: 'Failed to mark all notifications as read'
      }
    });
  }
});

export default router;
