import { useState, useEffect, createContext, useContext } from 'react';
import profileImg from '../assets/profile.jpg';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  microsoftLogin: () => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: 'Admin' | 'Lead' | 'HR') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isMicrosoftLoading: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const LOCAL_STORAGE_USER_KEY = 'auth.cachedUser';

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

  const loadCachedUser = (): User | null => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  };

  // Microsoft Entra ID Login - Not implemented for MongoDB
  const microsoftLogin = async (): Promise<{ success: boolean; error?: string }> => {
    console.log('⚠️ Microsoft Entra ID login not implemented for MongoDB backend');
    setIsMicrosoftLoading(false);
    return { 
      success: false, 
      error: 'Microsoft authentication not available' 
    };
  };

  useEffect(() => {
    // Check for cached user and token
    const cached = loadCachedUser();
    const token = localStorage.getItem('auth_token');
    
    if (cached && token) {
      setUser(cached);
      setIsLoading(false);
      
      // Verify token is still valid by calling /api/auth/me
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (!data.user) {
            setUser(null);
            persistUser(null);
            localStorage.removeItem('auth_token');
          }
        })
        .catch(() => {
          setUser(null);
          persistUser(null);
          localStorage.removeItem('auth_token');
        });
    } else {
      setIsLoading(false);
    }

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false);
      setIsMicrosoftLoading(false);
    }, 5000);

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        return { success: false, error: data.error?.message || 'Login failed' };
      }

      if (data.user && data.token) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.token);
        
        // Create user object
        const userProfile: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          avatar: data.user.avatar || profileImg,
        };
        
        setUser(userProfile);
        persistUser(userProfile);
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'Admin' | 'Lead' | 'HR'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        return { success: false, error: data.error?.message || 'Registration failed' };
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    // Clear user state and token
    setUser(null);
    setIsLoading(false);
    setIsMicrosoftLoading(false);
    persistUser(null);
    localStorage.removeItem('auth_token');
    
    // Force redirect to home page
    window.location.href = '/';
  };

  return { 
    user, 
    login, 
    microsoftLogin,
    signup, 
    logout, 
    isLoading: isLoading || isMicrosoftLoading,
    isMicrosoftLoading 
  };
};