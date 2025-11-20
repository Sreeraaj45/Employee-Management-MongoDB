/**
 * API Client Service
 * Centralized HTTP client for making authenticated requests to the Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export class ApiClient {
  private static token: string | null = null;

  /**
   * Set the authentication token
   * @param token JWT token
   */
  static setToken(token: string): void {
    this.token = token;
    // Store in localStorage for persistence
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear the authentication token
   */
  static clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Get the current authentication token
   * @returns JWT token or null
   */
  static getToken(): string | null {
    if (!this.token) {
      // Try to retrieve from localStorage
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  /**
   * Get headers for authenticated requests
   * @returns Headers object
   */
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   * @param response Fetch response
   * @returns Parsed JSON data
   */
  private static async handleResponse<T>(response: Response): Promise<T> {
    // Check if response is ok (status 200-299)
    if (!response.ok) {
      // Try to parse error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // If parsing fails, use default error message
      }

      // Handle specific status codes
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        this.clearToken();
        throw new Error('Authentication required. Please login again.');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      } else if (response.status === 404) {
        throw new Error('Resource not found.');
      } else if (response.status === 409) {
        throw new Error(errorMessage || 'Conflict: Resource already exists.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(errorMessage);
    }

    // Parse JSON response
    try {
      return await response.json();
    } catch {
      // If response has no body, return empty object
      return {} as T;
    }
  }

  /**
   * Make a GET request
   * @param endpoint API endpoint (without base URL)
   * @returns Promise with response data
   */
  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('GET request error:', error);
      throw error;
    }
  }

  /**
   * Make a POST request
   * @param endpoint API endpoint (without base URL)
   * @param data Request body data
   * @returns Promise with response data
   */
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('POST request error:', error);
      throw error;
    }
  }

  /**
   * Make a PUT request
   * @param endpoint API endpoint (without base URL)
   * @param data Request body data
   * @returns Promise with response data
   */
  static async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('PUT request error:', error);
      throw error;
    }
  }

  /**
   * Make a DELETE request
   * @param endpoint API endpoint (without base URL)
   * @returns Promise with response data
   */
  static async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('DELETE request error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @returns True if token exists
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get the base URL for the API
   * @returns API base URL
   */
  static getBaseUrl(): string {
    return API_BASE_URL;
  }
}

export default ApiClient;
