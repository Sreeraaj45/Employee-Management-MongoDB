import { apiClient } from '../apiClient';

export interface UserProfile {
  _id: string;
  id?: string;
  email: string;
  name: string;
  role: 'Admin' | 'Lead' | 'HR';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserApi {
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const response = await apiClient.get<{ users: UserProfile[] }>('/api/users');
      return response.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async createUser(userData: { email: string; password: string; name: string; role: 'Admin' | 'Lead' | 'HR' }): Promise<UserProfile> {
    try {
      const response = await apiClient.post<{ user: UserProfile }>('/api/users', userData);
      return response.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.put<{ user: UserProfile }>(`/api/users/${id}`, userData);
      return response.user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/change-password', { oldPassword, newPassword });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}
