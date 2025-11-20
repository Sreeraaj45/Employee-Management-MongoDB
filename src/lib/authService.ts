/**
 * Authentication Service
 * Handles user authentication using the Express backend API
 */

import ApiClient from './apiClient';
import { User } from '../types';

interface LoginResponse {
  user: {
    _id: string;
    email: string;
    name: string;
    role: 'Admin' | 'Lead' | 'HR' | 'Delivery Team';
    avatar_url?: string;
  };
  token: string;
}

interface RegisterResponse {
  message: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: 'Admin' | 'Lead' | 'HR' | 'Delivery Team';
  };
}

export class AuthService {
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with user data and success status
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await ApiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      // Store the JWT token
      ApiClient.setToken(response.token);

      // Transform backend user to frontend User type
      const user: User = {
        id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as 'Admin' | 'Lead' | 'HR',
        avatar: response.user.avatar_url || '/default-avatar.png',
      };

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param name User name
   * @param role User role
   * @returns Promise with success status
   */
  static async register(
    email: string,
    password: string,
    name: string,
    role: 'Admin' | 'Lead' | 'HR'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await ApiClient.post<RegisterResponse>('/auth/register', {
        email,
        password,
        name,
        role,
      });

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Change user password
   * @param oldPassword Current password
   * @param newPassword New password
   * @returns Promise with success status
   */
  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await ApiClient.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
      };
    }
  }

  /**
   * Get current authenticated user
   * @returns Promise with user data or null
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!ApiClient.isAuthenticated()) {
        return null;
      }

      const response = await ApiClient.get<{ user: any }>('/auth/me');

      // Transform backend user to frontend User type
      const user: User = {
        id: response.user._id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as 'Admin' | 'Lead' | 'HR',
        avatar: response.user.avatar_url || '/default-avatar.png',
      };

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      // If token is invalid, clear it
      ApiClient.clearToken();
      return null;
    }
  }

  /**
   * Logout the current user
   */
  static logout(): void {
    ApiClient.clearToken();
  }

  /**
   * Get the current authentication token
   * @returns JWT token or null
   */
  static getToken(): string | null {
    return ApiClient.getToken();
  }

  /**
   * Set the authentication token
   * @param token JWT token
   */
  static setToken(token: string): void {
    ApiClient.setToken(token);
  }

  /**
   * Check if user is authenticated
   * @returns True if authenticated
   */
  static isAuthenticated(): boolean {
    return ApiClient.isAuthenticated();
  }
}

export default AuthService;
