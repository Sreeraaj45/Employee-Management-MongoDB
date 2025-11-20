/**
 * Notification Service (MongoDB Backend)
 * Handles notification-related operations using the Express API
 */

import ApiClient from './apiClient';
import { Notification, CreateNotificationData } from '../types';

interface NotificationsResponse {
  notifications: any[];
  count?: number;
}

interface UnreadCountResponse {
  count: number;
}

interface CreateNotificationResponse {
  notification: any;
  id: string;
}

export class NotificationService {
  /**
   * Transform backend notification data to frontend Notification type
   */
  private static transformNotification(data: any): Notification {
    return {
      id: data._id,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority || 'medium',
      targetRoles: data.target_roles || [],
      targetUserId: data.target_user_id,
      actionUrl: data.action_url,
      actionLabel: data.action_label,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      isRead: data.is_read || false,
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      readBy: data.read_by,
    };
  }

  /**
   * Get all notifications for the current user based on their role
   */
  static async getNotifications(): Promise<Notification[]> {
    try {
      const response = await ApiClient.get<NotificationsResponse>('/notifications');
      return response.notifications.map(notif => this.transformNotification(notif));
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for the current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await ApiClient.get<UnreadCountResponse>('/notifications/unread');
      return response.count;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read for the current user
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await ApiClient.put(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  static async markAllAsRead(): Promise<void> {
    try {
      await ApiClient.put('/notifications/read-all', {});
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationData): Promise<string> {
    try {
      const response = await ApiClient.post<CreateNotificationResponse>('/notifications', {
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        target_roles: data.targetRoles,
        target_user_id: data.targetUserId,
        action_url: data.actionUrl,
        action_label: data.actionLabel,
        expires_at: data.expiresAt,
      });
      return response.id;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Create notification for employee operations
   */
  static async createEmployeeNotification(
    type: 'employee_created' | 'employee_updated' | 'employee_deleted',
    employeeName: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      const titles = {
        employee_created: 'New Employee Added',
        employee_updated: 'Employee Updated',
        employee_deleted: 'Employee Deleted',
      };

      const messages = {
        employee_created: `${employeeName} has been added to the system`,
        employee_updated: `${employeeName}'s information has been updated`,
        employee_deleted: `${employeeName} has been removed from the system`,
      };

      await this.createNotification({
        title: titles[type],
        message: messages[type],
        type,
        priority: 'medium',
        targetRoles: ['Admin', 'Lead', 'HR', 'Delivery Team'],
        actionUrl,
        actionLabel: 'View Details',
      });
    } catch (error) {
      console.error('Create employee notification error:', error);
    }
  }

  /**
   * Create notification for project operations
   */
  static async createProjectNotification(
    type: 'project_created' | 'project_updated' | 'project_deleted',
    projectName: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      const titles = {
        project_created: 'New Project Created',
        project_updated: 'Project Updated',
        project_deleted: 'Project Deleted',
      };

      const messages = {
        project_created: `Project "${projectName}" has been created`,
        project_updated: `Project "${projectName}" has been updated`,
        project_deleted: `Project "${projectName}" has been deleted`,
      };

      await this.createNotification({
        title: titles[type],
        message: messages[type],
        type,
        priority: 'medium',
        targetRoles: ['Admin', 'Lead', 'HR', 'Delivery Team'],
        actionUrl,
        actionLabel: 'View Project',
      });
    } catch (error) {
      console.error('Create project notification error:', error);
    }
  }

  /**
   * Create notification for user management operations
   */
  static async createUserNotification(
    type: 'user_created' | 'user_updated' | 'user_deleted',
    userName: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      const titles = {
        user_created: 'New User Created',
        user_updated: 'User Updated',
        user_deleted: 'User Deleted',
      };

      const messages = {
        user_created: `User "${userName}" has been created`,
        user_updated: `User "${userName}" has been updated`,
        user_deleted: `User "${userName}" has been deleted`,
      };

      await this.createNotification({
        title: titles[type],
        message: messages[type],
        type,
        priority: 'high',
        targetRoles: ['Admin'], // Only admins should see user management notifications
        actionUrl,
        actionLabel: 'View User',
      });
    } catch (error) {
      console.error('Create user notification error:', error);
    }
  }

  /**
   * Create notification for bulk upload operations
   */
  static async createBulkUploadNotification(
    count: number,
    createdBy: string
  ): Promise<void> {
    try {
      await this.createNotification({
        title: 'Bulk Upload Completed',
        message: `${count} employees have been uploaded successfully by ${createdBy}`,
        type: 'bulk_upload_completed',
        priority: 'medium',
        targetRoles: ['Admin', 'Lead', 'HR'],
        actionUrl: '/employees',
        actionLabel: 'View Employees',
      });
    } catch (error) {
      console.error('Create bulk upload notification error:', error);
    }
  }

  /**
   * Create system announcement
   */
  static async createSystemAnnouncement(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    targetRoles?: string[],
    actionUrl?: string,
    actionLabel?: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      await this.createNotification({
        title,
        message,
        type: 'system_announcement',
        priority,
        targetRoles: targetRoles || ['Admin', 'Lead', 'HR', 'Delivery Team'],
        actionUrl,
        actionLabel,
        expiresAt,
      });
    } catch (error) {
      console.error('Create system announcement error:', error);
    }
  }

  /**
   * Get notifications with read status for current user
   */
  static async getNotificationsWithReadStatus(): Promise<(Notification & { isReadByUser: boolean })[]> {
    try {
      const response = await ApiClient.get<NotificationsResponse>('/notifications');
      return response.notifications.map(notif => ({
        ...this.transformNotification(notif),
        isReadByUser: notif.is_read || false,
      }));
    } catch (error) {
      console.error('Get notifications with read status error:', error);
      throw error;
    }
  }
}

export default NotificationService;
