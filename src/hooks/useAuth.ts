import { useState, useEffect, createContext, useContext, useRef } from 'react';
import profileImg from '../assets/profile.jpg';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

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
  console.log('🚀 useAuthProvider initialized');
  console.log('🔧 Supabase client:', supabase);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [isProfileFetching, setIsProfileFetching] = useState(false);
  const signoutGraceTimerRef = useRef<number | null>(null);
  const lastSessionSeenAtRef = useRef<number>(Date.now());

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

  const getUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    if (isProfileFetching) {
      console.log('⚠️ Profile fetch already in progress, skipping...');
      return null;
    }

    console.log('👤 Fetching user profile for user ID:', supabaseUser.id);

    setIsProfileFetching(true);

    try {
      console.log('🚀 Starting profile query...');

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 10000)
      );

      const result = await Promise.race([
        profilePromise,
        timeoutPromise,
      ]);
      
      const { data: profile, error } = result as { data: any; error: any };

      if (error) {
        console.error('❌ Error fetching user profile:', error);

        // If profile doesn't exist → create one automatically
        if (error.code === 'PGRST116') {
          console.log('⚠️ Profile not found for user:', supabaseUser.id);
          
          // Extract user info from provider metadata
          const userMetadata = supabaseUser.user_metadata;
          const userEmail = supabaseUser.email || userMetadata?.email;
          const userName = userMetadata?.full_name || userMetadata?.name || userEmail?.split('@')[0] || 'User';
          
          // Determine role based on email domain or other logic
          let userRole: 'Admin' | 'Lead' | 'HR' = 'HR'; // Default role
          
          // Custom logic for role assignment based on email domain
          if (userEmail?.endsWith('@yourcompany.com')) {
            userRole = 'Admin'; // Example: company emails get Admin role
          }

          const newProfile: Database['public']['Tables']['user_profiles']['Insert'] = {
            id: supabaseUser.id,
            email: userEmail,
            name: userName,
            role: userRole,
            avatar_url: userMetadata?.avatar_url || profileImg
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating user profile:', createError);
            return null;
          }

          const userProfile: User = {
            id: createdProfile.id,
            email: createdProfile.email,
            name: createdProfile.name,
            role: createdProfile.role,
            avatar: createdProfile.avatar_url || profileImg
          };

          console.log('✅ New profile created for user:', userProfile);
          return userProfile;
        }

        // Any other error → also return null
        return null;
      }

      if (!profile) {
        console.error('❌ No profile data returned for user:', supabaseUser.id);
        return null;
      }

      // ✅ Build user strictly from DB
      const userProfile: User = {
        id: profile.id,
        email: profile.email || supabaseUser.email || '',
        name: profile.name || supabaseUser.user_metadata?.name || 'Unknown User',
        role: profile.role as 'Admin' | 'Lead' | 'HR', // always from DB
        avatar:
          profile.avatar_url ||
          supabaseUser.user_metadata?.avatar_url ||
          profileImg,
      };

      console.log('✅ User profile constructed:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('💥 Unexpected error in getUserProfile:', error);
      return null;
    } finally {
      setIsProfileFetching(false);
    }
  };

  const createUserIfNotExists = async (email: string, password: string, name: string, role: 'Admin' | 'Lead' | 'HR') => {
    try {
      // Try to sign up the user with email confirmation disabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name,
            role
          }
        }
      });

      if (error && error.message !== 'User already registered') {
        throw error;
      }

      // If user was created or already exists, create/update profile
      if (data.user) {
        const payload: Database['public']['Tables']['user_profiles']['Insert'] = {
          id: data.user.id,
          email,
          name,
          role
        };
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert(payload);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('User creation error:', error);
      return { success: false, error };
    }
  };

  // Microsoft Entra ID Login
  // Microsoft Entra ID Login - SIMPLIFIED
const microsoftLogin = async (): Promise<{ success: boolean; error?: string }> => {
  console.log('🔐 Microsoft Entra ID login attempt started');
  setIsMicrosoftLoading(true);
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email openid profile User.Read',
        redirectTo: `${window.location.origin}/auth/callback`
        // No need for queryParams anymore - configured in Supabase dashboard
      }
    });

    if (error) {
      console.error('❌ Microsoft Entra ID OAuth error:', error);
      setIsMicrosoftLoading(false);
      return { 
        success: false, 
        error: error.message || 'Microsoft authentication failed' 
      };
    }

    console.log('✅ Microsoft Entra ID OAuth initiated successfully');
    return { success: true };
  } catch (error) {
    console.error('💥 Unexpected error during Microsoft login:', error);
    setIsMicrosoftLoading(false);
    return { 
      success: false, 
      error: 'An unexpected error occurred during Microsoft authentication' 
    };
  }
};

  useEffect(() => {
    console.log('🔄 Auth state listener initialized');
    
    // Rehydrate cached user immediately if available for smoother UX
    const cached = loadCachedUser();
    if (cached) {
      console.log('💾 Rehydrated user from cache:', cached.email, cached.role);
      setUser(cached);
      setIsLoading(false);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📊 Initial session check:', session);
      if (session?.user) {
        console.log('👤 Initial user found:', session.user.email);
        getUserProfile(session.user).then((profile) => {
          if (profile) {
            setUser(profile);
            persistUser(profile);
          }
        });
      } else {
        console.log('❌ No initial session found');
      }
      if (!cached) setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change event:', event);
        console.log('📊 Session data:', session);
        
        if (session?.user) {
          lastSessionSeenAtRef.current = Date.now();
        }

        if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out event detected');
          setUser(null);
          setIsLoading(false);
          setIsMicrosoftLoading(false);
          console.log('✅ Loading state reset after sign out');
          persistUser(null);
        } else if (session?.user) {
          console.log('👤 User authenticated:', session.user.email);
          
          // Add timeout for profile fetch
          try {
            const userProfile = await Promise.race([
              getUserProfile(session.user),
              new Promise<User | null>((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              )
            ]);
            
            if (userProfile) {
              setUser(userProfile);
              setIsLoading(false);
              setIsMicrosoftLoading(false);
              persistUser(userProfile);
            } else {
              console.log('⚠️ No user profile returned; preserving existing user state');
              setIsLoading(false);
              setIsMicrosoftLoading(false);
            }
          } catch (error) {
            console.error('💥 Profile fetch failed; preserving existing user state:', error);
            setIsLoading(false);
            setIsMicrosoftLoading(false);
          }
        } else {
          console.log('🚪 No session or user data (possible transient). Starting grace timer...');
          if (signoutGraceTimerRef.current) {
            window.clearTimeout(signoutGraceTimerRef.current);
          }
          signoutGraceTimerRef.current = window.setTimeout(() => {
            const elapsed = Date.now() - lastSessionSeenAtRef.current;
            if (elapsed >= 45000) {
              console.log('⏰ Grace elapsed without session. Clearing user.');
              setUser(null);
              setIsLoading(false);
              setIsMicrosoftLoading(false);
              persistUser(null);
            } else {
              console.log('👍 Session restored within grace. Keeping user.');
            }
          }, 45000);
        }
      }
    );

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('⏰ Safety timeout - forcing loading state reset');
      setIsLoading(false);
      setIsMicrosoftLoading(false);
    }, 10000); // 10 seconds

    return () => {
      console.log('🔄 Auth state listener cleanup');
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
      if (signoutGraceTimerRef.current) {
        window.clearTimeout(signoutGraceTimerRef.current);
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔐 Login attempt started for email:', email);
    console.log('📝 Password length:', password.length);
    setIsLoading(true);
    
    try {
      console.log('🚀 Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('📊 Sign-in response received:');
      console.log('  - Data:', data);
      console.log('  - Error:', error);
      console.log('  - User object:', data?.user);
      console.log('  - Session:', data?.session);

      if (error) {
        console.error('❌ Authentication error:', error);
        console.error('  - Error message:', error.message);
        console.error('  - Error status:', error.status);
        console.error('  - Error name:', error.name);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ User authenticated successfully, fetching profile...');
        console.log('  - User ID:', data.user.id);
        console.log('  - User email:', data.user.email);
        const userProfile = await getUserProfile(data.user);
        console.log('  - User profile:', userProfile);
        if (userProfile) {
          setUser(userProfile);
          persistUser(userProfile);
        }
      } else {
        console.warn('⚠️ No user data in response');
      }

      setIsLoading(false);
      console.log('✅ Login process completed successfully');
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected error during login:', error);
      console.error('  - Error type:', typeof error);
      console.error('  - Error constructor:', error?.constructor?.name);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'Admin' | 'Lead' | 'HR'): Promise<{ success: boolean; error?: string }> => {
    console.log('🚀 Signup attempt started for email:', email);
    console.log('📝 Password length:', password.length);
    console.log('👤 Name:', name);
    console.log('🎭 Role:', role);
    setIsLoading(true);

    try {
      console.log('🚀 Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      console.log('📊 Signup response received:');
      console.log('  - Data:', data);
      console.log('  - Error:', error);
      console.log('  - User object:', data?.user);

      if (error) {
        console.error('❌ Signup error:', error);
        console.error('  - Error message:', error.message);
        console.error('  - Error status:', error.status);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ User created successfully, creating profile...');
        console.log('  - User ID:', data.user.id);
        console.log('  - User email:', data.user.email);
        
        // Create user profile
        const insertPayload: Database['public']['Tables']['user_profiles']['Insert'] = {
          id: data.user.id,
          email,
          name,
          role
        };
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(insertPayload);

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          setIsLoading(false);
          return { success: false, error: 'Failed to create user profile' };
        }
        
        console.log('✅ User profile created successfully');
      } else {
        console.warn('⚠️ No user data in signup response');
      }

      setIsLoading(false);
      console.log('✅ Signup process completed successfully');
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected error during signup:', error);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    console.log('🚪 Logout attempt started');
    console.log('👤 Current user before logout:', user);
    
    try {
      // Immediately clear user state and set loading to false
      setUser(null);
      setIsLoading(false);
      setIsMicrosoftLoading(false);
      persistUser(null);
      
      console.log('🚀 Calling supabase.auth.signOut...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        console.error('  - Error message:', error.message);
        console.error('  - Error status:', error.status);
        // Error doesn't matter, we've already cleared local state
        return;
      }
      
      console.log('✅ Supabase signOut successful');
      console.log('✅ User state cleared, logout completed');
      
      // Force redirect to home page immediately
      window.location.href = '/';
    } catch (error) {
      console.error('💥 Unexpected error during logout:', error);
      // Even if there's an error, we've already cleared local state
      // Force redirect anyway
      window.location.href = '/';
    }
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