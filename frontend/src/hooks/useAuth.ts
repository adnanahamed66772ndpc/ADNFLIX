import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/client';

export type SubscriptionPlan = 'free' | 'with-ads' | 'premium';
export type AppRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  roles: AppRole[];
  createdAt: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  session: { userId: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl'>>) => Promise<boolean>;
  updateSubscription: (plan: SubscriptionPlan) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

const isValidDisplayName = (name: string): boolean => {
  return name.trim().length >= 1 && name.length <= 100;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ userId: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const userData = await apiClient.get<AuthUser>('/auth/me');
      return userData;
    } catch {
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const userData = await fetchUserData();
    if (userData) {
      setUser(userData);
    }
  }, [fetchUserData]);

  useEffect(() => {
    // Check for existing session/token
    const initAuth = async () => {
      try {
        const userData = await fetchUserData();
        if (userData) {
          setUser(userData);
          setSession({ userId: userData.id, email: userData.email });
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchUserData]);

  const login = async (email: string, password: string) => {
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!isValidPassword(password)) {
      return { success: false, error: 'Password must be between 6 and 128 characters' };
    }

    try {
      const response = await apiClient.post<{ success: boolean; token: string; user: AuthUser }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      apiClient.setToken(response.token);
      setUser(response.user);
      setSession({ userId: response.user.id, email: response.user.email });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    if (!isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!isValidPassword(password)) {
      return { success: false, error: 'Password must be between 6 and 128 characters' };
    }
    if (!isValidDisplayName(displayName)) {
      return { success: false, error: 'Display name must be between 1 and 100 characters' };
    }

    try {
      const response = await apiClient.post<{ success: boolean; token: string; user: AuthUser }>('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
      });

      apiClient.setToken(response.token);
      setUser(response.user);
      setSession({ userId: response.user.id, email: response.user.email });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      apiClient.setToken(null);
      setUser(null);
      setSession(null);
    }
  };

  const updateProfile = async (updates: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl'>>): Promise<boolean> => {
    try {
      await apiClient.put('/auth/profile', updates);
      await refreshProfile();
      return true;
    } catch {
      return false;
    }
  };

  const updateSubscription = async (plan: SubscriptionPlan): Promise<boolean> => {
    // This should be admin-only, but keeping for compatibility
    try {
      // Note: This endpoint might not exist - subscription updates should go through admin
      await apiClient.put('/auth/profile', { subscriptionPlan: plan });
      await refreshProfile();
      return true;
    } catch {
      return false;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.roles.includes('admin') || false;

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
    updateSubscription,
    refreshProfile,
  };
}
