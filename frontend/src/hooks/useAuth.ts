import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/client';

export type SubscriptionPlan = 'free' | 'with-ads' | 'premium';
export type AppRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
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
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl'>>) => Promise<boolean>;
  updateSubscription: (plan: SubscriptionPlan) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isEmailOrUsername = (s: string): boolean => s.trim().length >= 1;

const isEmailLike = (s: string): boolean => s.trim().includes('@');

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
        // Skip /auth/me when no token to avoid 401 in console for guests
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
        if (!hasToken) {
          setIsLoading(false);
          return;
        }
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

  const login = async (emailOrUsername: string, password: string) => {
    const identifier = emailOrUsername.trim();
    if (!identifier) {
      return { success: false, error: 'Please enter your email or username' };
    }
    if (isEmailLike(identifier) && !isValidEmail(identifier)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!isValidPassword(password)) {
      return { success: false, error: 'Password must be between 6 and 128 characters' };
    }

    try {
      const response = await apiClient.post<{ success: boolean; token: string; user: AuthUser }>('/auth/login', {
        email: isEmailLike(identifier) ? identifier.toLowerCase() : identifier,
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

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!isValidPassword(newPassword)) {
      return { success: false, error: 'New password must be between 6 and 128 characters' };
    }
    try {
      await apiClient.patch('/auth/password', { currentPassword, newPassword });
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to change password';
      return { success: false, error: msg };
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
    changePassword,
    updateSubscription,
    refreshProfile,
  };
}
