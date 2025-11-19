import { useState, useEffect, useCallback } from 'react';
import { Notification, CreateNotificationData } from '../types';
import { NotificationService } from '../lib/notificationService';
import { useAuth } from './useAuth';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (data: CreateNotificationData) => Promise<string>;
  createEmployeeNotification: (
    type: 'employee_created' | 'employee_updated' | 'employee_deleted',
    employeeName: string,
    employeeId: string,
    targetRoles?: ('Admin' | 'Lead' | 'HR')[]
  ) => Promise<string>;
  createProjectNotification: (
    type: 'project_created' | 'project_updated' | 'project_deleted',
    projectName: string,
    clientName: string,
    targetRoles?: ('Admin' | 'Lead' | 'HR')[]
  ) => Promise<string>;
  createUserNotification: (
    type: 'user_created' | 'user_updated' | 'user_deleted',
    userName: string,
    userRole: 'Admin' | 'Lead' | 'HR',
    targetRoles?: ('Admin' | 'Lead' | 'HR')[]
  ) => Promise<string>;
  createBulkUploadNotification: (
    count: number,
    targetRoles?: ('Admin' | 'Lead' | 'HR')[]
  ) => Promise<string>;
  createSystemAnnouncement: (
    title: string,
    message: string,
    priority?: 'low' | 'medium' | 'high' | 'urgent',
    targetRoles?: ('Admin' | 'Lead' | 'HR')[],
    actionUrl?: string,
    actionLabel?: string
  ) => Promise<string>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getNotifications(),
        NotificationService.getUnreadCount()
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error refreshing notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const createNotification = useCallback(async (data: CreateNotificationData): Promise<string> => {
    try {
      const notificationId = await NotificationService.createNotification(data);
      // Refresh notifications to show the new one
      await refreshNotifications();
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create notification';
      setError(errorMessage);
      console.error('Error creating notification:', err);
      throw err;
    }
  }, [refreshNotifications]);

  const createEmployeeNotification = useCallback(async (
    type: 'employee_created' | 'employee_updated' | 'employee_deleted',
    employeeName: string,
    employeeId: string,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> => {
    try {
      const notificationId = await NotificationService.createEmployeeNotification(
        type,
        employeeName,
        employeeId,
        user?.id || '',
        targetRoles
      );
      // Refresh notifications to show the new one
      await refreshNotifications();
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee notification';
      setError(errorMessage);
      console.error('Error creating employee notification:', err);
      throw err;
    }
  }, [user, refreshNotifications]);

  const createProjectNotification = useCallback(async (
    type: 'project_created' | 'project_updated' | 'project_deleted',
    projectName: string,
    clientName: string,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> => {
    try {
      const notificationId = await NotificationService.createProjectNotification(
        type,
        projectName,
        clientName,
        user?.id || '',
        targetRoles
      );
      // Refresh notifications to show the new one
      await refreshNotifications();
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project notification';
      setError(errorMessage);
      console.error('Error creating project notification:', err);
      throw err;
    }
  }, [user, refreshNotifications]);

  const createUserNotification = useCallback(async (
    type: 'user_created' | 'user_updated' | 'user_deleted',
    userName: string,
    userRole: 'Admin' | 'Lead' | 'HR',
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> => {
    try {
      const notificationId = await NotificationService.createUserNotification(
        type,
        userName,
        userRole,
        user?.id || '',
        targetRoles
      );
      // Refresh notifications to show the new one
      await refreshNotifications();
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user notification';
      setError(errorMessage);
      console.error('Error creating user notification:', err);
      throw err;
    }
  }, [user, refreshNotifications]);

  const createBulkUploadNotification = useCallback(async (
    count: number,
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = []
  ): Promise<string> => {
    try {
      const notificationId = await NotificationService.createBulkUploadNotification(
        count,
        user?.id || '',
        targetRoles
      );
      // Refresh notifications to show the new one
      await refreshNotifications();
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bulk upload notification';
      setError(errorMessage);
      console.error('Error creating bulk upload notification:', err);
      throw err;
    }
  }, [user, refreshNotifications]);

  const createSystemAnnouncement = useCallback(async (
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    targetRoles: ('Admin' | 'Lead' | 'HR')[] = [],
    actionUrl?: string,
    actionLabel?: string
  ): Promise<string> => {
    try {
      const notificationId = await NotificationService.createSystemAnnouncement(
        title,
        message,
        priority,
        targetRoles,
        actionUrl,
        actionLabel
      );
      // Refresh notifications to show the new one
      await refreshNotifications();
      return notificationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create system announcement';
      setError(errorMessage);
      console.error('Error creating system announcement:', err);
      throw err;
    }
  }, [refreshNotifications]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (user) {
      refreshNotifications();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(refreshNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    createEmployeeNotification,
    createProjectNotification,
    createUserNotification,
    createBulkUploadNotification,
    createSystemAnnouncement
  };
};