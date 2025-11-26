// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authAPI, clearAuthData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on app start
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('[AuthContext] checkAuthStatus called');
      // Check if we have tokens in localStorage
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id');
      
      console.log('[AuthContext] Stored data:', { hasToken: !!token, userId });
      
      if (!token || !userId) {
        console.log('[AuthContext] No token or userId, not logged in');
        setLoading(false);
        return;
      }

      // Also save token to cookie if not already there (for middleware)
      if (!document.cookie.includes('auth-token=')) {
        document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }

      // If we already have user data and it matches the stored userId, skip fetching
      if (user && user.id === userId) {
        console.log('[AuthContext] User already loaded, skipping fetch');
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Fetching user profile...');
      // Fetch user profile from API
      try {
        const profile = await authAPI.getUserById(userId);
        if (profile) {
          console.log('[AuthContext] User profile fetched successfully:', profile);
          // Get role from user_type (backend field) or role field, normalize to lowercase
          const userType = (profile as any).user_type || profile.role || 'USER';
          const normalizedRole = userType.toLowerCase();
          const userWithNormalizedRole = {
            ...profile,
            role: (normalizedRole === 'admin' || normalizedRole === 'seller' || normalizedRole === 'user') 
              ? normalizedRole as 'user' | 'admin' | 'seller'
              : 'user' as 'user' | 'admin' | 'seller',
          };
          setUser(userWithNormalizedRole);
        }
      } catch (err: any) {
        console.log('[AuthContext] Error fetching user profile:', err);
        // If fetch fails, user is still authenticated (has token)
        // Just don't have full profile data yet
        console.warn('[AuthContext] Could not fetch user profile, but user is still authenticated');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);

      // Validate response has access token BEFORE doing anything
      if (!response.access_token) {
        throw new Error('Không nhận được access token từ server');
      }

     
      
      // Get role from user_type or role field, normalize to lowercase
      const userType = response.user_type || response.role || 'USER';
      const normalizedRole = userType.toLowerCase();
      
      // Ensure we have a valid user ID
      const userId = response.user_id || response.uid;
      if (!userId) {
        throw new Error('Không nhận được user ID từ server');
      }
      
      // Create temporary user object for immediate use
      const user = {
        id: userId,
        email: response.email,
        name: response.first_name || response.name || response.email.split('@')[0],
        role: (normalizedRole === 'admin' || normalizedRole === 'seller' || normalizedRole === 'user') 
          ? normalizedRole as 'user' | 'admin' | 'seller'
          : 'user' as 'user' | 'admin' | 'seller',
      };
      setUser(user);

      // Save tokens and user_id to localStorage (not full user object)
      localStorage.setItem('auth_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      localStorage.setItem('user_id', userId);

      // Also save token to cookies for middleware
      document.cookie = `auth-token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days

      // Debug: log token fingerprint (not full token) for troubleshooting
      try {
        const t = response.access_token;
        const fp = t ? `${t.slice(0, 8)}...` : 'none';
        console.log('[AuthContext] set token fingerprint (localStorage/cookie):', fp, document.cookie.includes('auth-token=') ? 'cookie-set' : 'cookie-missing');
      } catch (e) {}

      // Fetch full user profile from API in background (optional - if endpoint exists)
      // Only fetch if we don't already have detailed profile for this user
      if (!user || user.id !== userId || !user.name || user.name === response.email.split('@')[0]) {
        try {
          const fullProfile = await authAPI.getUserById(userId);
          if (fullProfile) {
            // Get role from user_type (backend field) or role field, normalize to lowercase
            const userType = (fullProfile as any).user_type || fullProfile.role || 'USER';
            const normalizedRole = userType.toLowerCase();
            const finalRole = (normalizedRole === 'admin' || normalizedRole === 'seller' || normalizedRole === 'user') 
              ? normalizedRole as 'user' | 'admin' | 'seller'
              : 'user' as 'user' | 'admin' | 'seller';
            const userWithNormalizedRole = {
              ...fullProfile,
              role: finalRole,
            };
            setUser(userWithNormalizedRole);
          }
        } catch (err: any) {
          // Silently fail if endpoint doesn't exist - we already have basic user info from login response
          // Don't show error to user as this is optional enhancement
          const errorMsg = err?.message || String(err);
          try {
            const parsed = JSON.parse(errorMsg);
            // Only log if it's not a 404 (endpoint not found is expected in some backends)
            if (parsed.status !== 404) {
            }
          } catch {
          }
          // Continue anyway with temporary user from login response
        }
      }

      // Return role for redirect logic
      return { role: user.role };
      
      // Don't redirect here - let the calling component handle it
    } catch (error: any) {
      // Clear any partial state on error
      setUser(null);
      clearAuthData();
      // Re-throw để LoginForm có thể catch và hiển thị error
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);

      // Assuming your API returns { user: User, token: string }
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Save token if provided
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      // Clear all authentication-related data
      clearAuthData();
      setUser(null);
      try { router.push('/'); } catch (e) { if (typeof window !== 'undefined') window.location.href = '/'; }
    }
  }, [router]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  }, [user]);

  const isAuthenticated = !!user;

  const contextValue = useMemo(() => ({
    user, 
    login, 
    register, 
    logout, 
    loading, 
    isAuthenticated, 
    updateUser
  }), [user, login, register, logout, loading, isAuthenticated, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}