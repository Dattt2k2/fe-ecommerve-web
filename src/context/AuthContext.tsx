// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
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
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        setLoading(false);
        return;
      }

      // If no local user found, try to fetch profile from server (supports cookie-based auth)
      try {
        const profile = await authAPI.getProfile();
        if (profile && (profile as any).user) {
          setUser((profile as any).user);
          localStorage.setItem('user', JSON.stringify((profile as any).user));
        }
      } catch (err) {
        // Not logged in on server or profile fetch failed; ignore
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);

      // API returns { message, email, role, uid, access_token, refresh_token }
      if (response.access_token) {
        const user = {
          id: response.uid,
          email: response.email,
          name: response.email.split('@')[0], // Temporary name from email
          role: response.role as 'user' | 'admin',
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));

        // Save tokens
        localStorage.setItem('auth_token', response.access_token);
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }

        // Redirect after successful login
        try {
          router.push('/');
        } catch (e) {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
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
      console.error('Register failed:', error);
      throw new Error(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated }}>
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