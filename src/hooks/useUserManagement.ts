import { useState, useEffect } from 'react';
import { User } from '../types';
import { UserApi } from '../lib/api/userApi';
import localAvatar from '../assets/profile.jpg';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await UserApi.getAllUsers();

      const mappedUsers: User[] = data.map((profile: any) => ({
        id: profile._id || profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as 'Admin' | 'Lead' | 'HR',
        avatar: profile.avatar || localAvatar,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (email: string, name: string, role: 'Admin' | 'Lead' | 'HR') => {
    try {
      const trimmedEmail = (email || '').trim();
      const trimmedName = (name || '').trim();

      if (!trimmedEmail || !trimmedName) {
        return { success: false, error: 'Email and name are required' };
      }

      // Create the user with default password
      const defaultPasswords: Record<'Admin' | 'Lead' | 'HR', string> = {
        Admin: 'admin1234',
        Lead: 'lead1234',
        HR: 'hr1234'
      };

      await UserApi.createUser({
        email: trimmedEmail,
        password: defaultPasswords[role],
        name: trimmedName,
        role
      });

      await fetchUsers();

      return {
        success: true,
        credentials: {
          email: trimmedEmail,
          password: defaultPasswords[role],
          role
        }
      };
    } catch (error: any) {
      const message = error?.message || 'An unexpected error occurred';
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('duplicate')) {
        return { success: false, error: 'User already exists with this email' };
      }
      return { success: false, error: message };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await UserApi.deleteUser(userId);
      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'Admin' | 'Lead' | 'HR') => {
    try {
      await UserApi.updateUser(userId, { role: newRole });
      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await UserApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  };

  return {
    users,
    isLoading,
    createUser,
    deleteUser,
    updateUserRole,
    changePassword,
    refreshUsers: fetchUsers
  };
};