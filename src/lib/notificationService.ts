import { supabase } from './supabase';
import { Notification, CreateNotificationData, NotificationRead } from '../types';
import type { Database } from './database.types';

export class NotificationService {
  /**
   * Get all notifications for the current user based on their role
   */
  static async getNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          creator:user_profiles!created_by(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
      }

      return data?.map(this.mapDatabaseNotification) || [];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for the current user
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count');

      if (error) {
        console.error('Error fetching unread count:', error);
        throw new Error('Failed to fetch unread count');
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read for the current user
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        notification_uuid: notificationId
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  static async markAllAsRead(): Promise<void> {
    try {
      // Get all unread notifications for current user
      const notifications = await this.getNotifications();
      const unreadNotifications = notifications.filter(n => !n.isRead);

      // Mark each as read
      for (const notification of unreadNotifications) {
        await this.markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationData): Promise<string> {
    try {
      const { data: notificationId, error } = await supabase.rpc('create_notification', {
        p_title: data.title,
        p_message: data.message,
        p_type: data.type,
        p_priority: data.priority || 'medium',
        p_target_roles: data.targetRoles || [],
        p_target_user_id: data.targetUserId || null,
        p_action_url: data.actionUrl || null,
        p_action_label: data.actionLabel || null,
        p_expires_at: data.expiresAt || null
      });

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
      }

      return notificationId;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * Create notification for employee operations
   */
  static async createEmployeeNotification(
    type: 'employee_created' | 'employee_updated' | 'employee_deleted',
    employeeName: string,
    employeeId: string,
    createdBy: string,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> {
    const messages = {
      employee_created: `${employeeName} (${employeeId}) has been added to the system.`,
      employee_updated: `${employeeName} (${employeeId}) has been updated.`,
      employee_deleted: `${employeeName} (${employeeId}) has been removed from the system.`
    };

    const titles = {
      employee_created: 'New Employee Added',
      employee_updated: 'Employee Updated',
      employee_deleted: 'Employee Removed'
    };

    return this.createNotification({
      title: titles[type],
      message: messages[type],
      type,
      priority: type === 'employee_deleted' ? 'high' : 'medium',
      targetRoles: targetRoles.length > 0 ? targetRoles : ['Admin', 'Lead', 'HR'],
      actionUrl: '/employees',
      actionLabel: 'View Employees'
    });
  }

  /**
   * Create notification for project operations
   */
  static async createProjectNotification(
    type: 'project_created' | 'project_updated' | 'project_deleted',
    projectName: string,
    clientName: string,
    createdBy: string,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> {
    const messages = {
      project_created: `New project "${projectName}" for ${clientName} has been created.`,
      project_updated: `Project "${projectName}" for ${clientName} has been updated.`,
      project_deleted: `Project "${projectName}" for ${clientName} has been deleted.`
    };

    const titles = {
      project_created: 'New Project Created',
      project_updated: 'Project Updated',
      project_deleted: 'Project Deleted'
    };

    return this.createNotification({
      title: titles[type],
      message: messages[type],
      type,
      priority: type === 'project_deleted' ? 'high' : 'medium',
      targetRoles: targetRoles.length > 0 ? targetRoles : ['Admin', 'Lead'],
      actionUrl: '/projects',
      actionLabel: 'View Projects'
    });
  }

  /**
   * Create notification for user management operations
   */
  static async createUserNotification(
    type: 'user_created' | 'user_updated' | 'user_deleted',
    userName: string,
    userRole: 'Admin' | 'Lead' | 'HR',
    createdBy: string,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> {
    const messages = {
      user_created: `New ${userRole} user "${userName}" has been added to the system.`,
      user_updated: `${userRole} user "${userName}" has been updated.`,
      user_deleted: `${userRole} user "${userName}" has been removed from the system.`
    };

    const titles = {
      user_created: 'New User Added',
      user_updated: 'User Updated',
      user_deleted: 'User Removed'
    };

    // User management notifications should only go to Admins
    return this.createNotification({
      title: titles[type],
      message: messages[type],
      type,
      priority: type === 'user_deleted' ? 'high' : 'medium',
      targetRoles: ['Admin'],
      actionUrl: '/user-management',
      actionLabel: 'Manage Users'
    });
  }

  /**
   * Create notification for bulk upload operations
   */
  static async createBulkUploadNotification(
    count: number,
    createdBy: string,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> {
    return this.createNotification({
      title: 'Bulk Upload Completed',
      message: `${count} employees have been successfully uploaded to the system.`,
      type: 'bulk_upload_completed',
      priority: 'medium',
      targetRoles: targetRoles.length > 0 ? targetRoles : ['Admin', 'Lead', 'HR'],
      actionUrl: '/employees',
      actionLabel: 'View Employees'
    });
  }

  /**
   * Create system announcement
   */
  static async createSystemAnnouncement(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = [],
    actionUrl?: string,
    actionLabel?: string
  ): Promise<string> {
    return this.createNotification({
      title,
      message,
      type: 'system_announcement',
      priority,
      targetRoles: targetRoles.length > 0 ? targetRoles : ['Admin', 'Lead', 'HR'],
      actionUrl,
      actionLabel
    });
  }

  /**
   * Map database notification to our interface
   */
  private static mapDatabaseNotification(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      title: dbNotification.title,
      message: dbNotification.message,
      type: dbNotification.type,
      priority: dbNotification.priority,
      targetRoles: dbNotification.target_roles,
      targetUserId: dbNotification.target_user_id || undefined,
      actionUrl: dbNotification.action_url || undefined,
      actionLabel: dbNotification.action_label || undefined,
      createdBy: dbNotification.created_by || undefined,
      createdByName: dbNotification.creator?.name || undefined,
      createdAt: dbNotification.created_at,
      expiresAt: dbNotification.expires_at || undefined,
      isRead: dbNotification.is_read,
      readAt: dbNotification.read_at || undefined,
      readBy: dbNotification.read_by || undefined
    };
  }

  /**
   * Get notifications with read status for current user
   */
  static async getNotificationsWithReadStatus(): Promise<(Notification & { isReadByUser: boolean })[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          creator:user_profiles!created_by(name),
          notification_reads!left(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications with read status:', error);
        throw new Error('Failed to fetch notifications');
      }

      return data?.map(notification => ({
        ...this.mapDatabaseNotification(notification),
        isReadByUser: notification.notification_reads && notification.notification_reads.length > 0
      })) || [];
    } catch (error) {
      console.error('Error in getNotificationsWithReadStatus:', error);
      throw error;
    }
  }
}