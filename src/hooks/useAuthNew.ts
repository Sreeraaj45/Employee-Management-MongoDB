/**
 * Authentication Hook (MongoDB Backend)
 * Provides authentication context and methods using the new AuthService
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import { AuthService } from '../lib/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: 'Admin' | 'Lead' | 'HR') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  console.log('🚀 useAuthProvider initialized (MongoDB Backend)');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const LOCAL_STORAGE_USER_KEY = 'auth.cachedUser';

  /**
   * Persist user to localStorage for faster rehydration
   */
  const persistUser = (value: User | null) => {
    try {
      if (value) {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(value));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    } catch (e) {
      console.warn('⚠️ Unable to access localStorage for user cache:', e);
    }
  };

  /**
   * Load cached user from localStorage
   */
  const loadCachedUser = (): User | null => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  };

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    console.log('🔄 Auth state initialization');
    
    const initAuth = async () => {
      // Rehydrate cached user immediately for smoother UX
      const cached = loadCachedUser();
      if (cached) {
        console.log('💾 Rehydrated user from cache:', cached.email, cached.role);
        setUser(cached);
      }

      // Check if we have a valid token
      if (AuthService.isAuthenticated()) {
        console.log('🔑 Token found, fetching current user...');
        try {
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            console.log('✅ User authenticated:', currentUser.email);
            setUser(currentUser);
            persistUser(currentUser);
          } else {
            console.log('❌ No user found, clearing state');
            setUser(null);
            persistUser(null);
          }
        } catch (error) {
          console.error('❌ Error fetching current user:', error);
          setUser(null);
          persistUser(null);
        }
      } else {
        console.log('❌ No token found');
        if (!cached) {
          setUser(null);
          persistUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('⏰ Safety timeout - forcing loading state reset');
      setIsLoading(false);
    }, 5000); // 5 seconds

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔐 Login attempt started for email:', email);
    setIsLoading(true);
    
    try {
      const result = await AuthService.login(email, password);
      
      if (result.success && result.user) {
        console.log('✅ Login successful');
        
        // Add avatar if not present
        const userWithAvatar = {
          ...result.user,
          avatar: result.user.avatar || ''
        };
        
        setUser(userWithAvatar);
        persistUser(userWithAvatar);
        setIsLoading(false);
        return { success: true };
      } else {
        console.error('❌ Login failed:', result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('💥 Unexpected error during login:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  /**
   * Sign up new user
   */
  const signup = async (
    email: string, 
    password: string, 
    name: string, 
    role: 'Admin' | 'Lead' | 'HR'
  ): Promise<{ success: boolean; error?: string }> {
    console.log('🚀 Signup attempt started for email:', email);
    setIsLoading(true);

    try {
      const result = await AuthService.register(email, password, name, role);
      
      if (result.success) {
        console.log('✅ Signup successful');
        setIsLoading(false);
        return { success: true };
      } else {
        console.error('❌ Signup failed:', result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('💥 Unexpected error during signup:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  };

  /**
   * Logout current user
   */
  const logout = () => {
    console.log('🚪 Logout attempt started');
    console.log('👤 Current user before logout:', user);
    
    try {
      // Clear authentication state
      AuthService.logout();
      setUser(null);
      setIsLoading(false);
      persistUser(null);
      
      console.log('✅ Logout successful');
      console.log('✅ User state cleared, logout completed');
      
      // Force redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('💥 Unexpected error during logout:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      persistUser(null);
      window.location.href = '/';
    }
  };

  return { 
    user, 
    login, 
    signup, 
    logout, 
    isLoading
  };
};
