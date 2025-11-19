import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { NotificationService } from '../lib/notificationService';
import localAvatar from '../assets/profile.jpg';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const safeData = Array.isArray(data) ? data : [];
      const mappedUsers: User[] = safeData.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as 'Admin' | 'Lead' | 'HR',
        avatar: profile.avatar_url || localAvatar,
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

      // Create the auth user with default password and user metadata
      const defaultPasswords: Record<'Admin' | 'Lead' | 'HR', string> = {
        Admin: 'admin1234',
        Lead: 'lead1234',
        HR: 'hr1234'
      };

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: defaultPasswords[role],
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/`, // 👈 redirect to your deployed app
          data: {
            name: trimmedName,
            role
          }
        }
      });


      if (authError) {
        const message = authError.message || 'Failed to create auth user';
        if (message.toLowerCase().includes('already registered')) {
          return { success: false, error: 'User already exists with this email' };
        }
        return { success: false, error: message };
      }

      const newUser = authData?.user;
      if (!newUser) {
        return { success: false, error: 'Auth user was not returned' };
      }

      // Create or update user profile row to match auth user
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: newUser.id,
          email: trimmedEmail,
          name: trimmedName,
          role
        });

      if (profileError) {
        return { success: false, error: profileError.message || 'Failed to create user profile' };
      }

      await fetchUsers();

      // Create notification for user creation
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await NotificationService.createUserNotification(
            'user_created',
            trimmedName,
            role,
            user.id,
            ['Admin'] // Only Admins should see user management notifications
          );
        }
      } catch (notificationError) {
        console.warn('Failed to create notification for user creation:', notificationError);
        // Don't throw error to avoid breaking the user creation process
      }

      return {
        success: true,
        credentials: {
          email: trimmedEmail,
          password: defaultPasswords[role],
          role
        }
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Get user info before deletion for notification
      const { data: userToDelete, error: fetchError } = await supabase
        .from('user_profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Delete user profile (auth user deletion would need admin API)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Create notification for user deletion
      if (userToDelete) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await NotificationService.createUserNotification(
              'user_deleted',
              userToDelete.name,
              userToDelete.role,
              user.id,
              ['Admin'] // Only Admins should see user management notifications
            );
          }
        } catch (notificationError) {
          console.warn('Failed to create notification for user deletion:', notificationError);
          // Don't throw error to avoid breaking the user deletion process
        }
      }

      // Refresh users list
      await fetchUsers();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'Admin' | 'Lead' | 'HR') => {
    try {
      // Get current user info for notification
      const { data: currentUserData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Update user role in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Create notification for role change
      if (currentUserData) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await NotificationService.createNotification({
              title: 'User Role Changed',
              message: `User "${currentUserData.name}" role has been changed from ${currentUserData.role} to ${newRole}`,
              type: 'user_updated',
              priority: 'medium',
              targetRoles: ['Admin'], // Only Admins should see user management notifications
              createdBy: user.id
            });
          }
        } catch (notificationError) {
          console.warn('Failed to create notification for role change:', notificationError);
          // Don't throw error to avoid breaking the role change process
        }
      }

      // Refresh users list
      await fetchUsers();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
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