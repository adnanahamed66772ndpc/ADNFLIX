import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';

export type AppRole = 'admin' | 'user';
export type SubscriptionPlan = 'free' | 'with-ads' | 'premium';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: AppRole;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  status: 'active' | 'banned';
}

interface UseAdminUsersReturn {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateUserRole: (userId: string, role: AppRole) => Promise<boolean>;
  updateUserSubscription: (userId: string, plan: SubscriptionPlan) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<AdminUser[]>('/admin/users');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = useCallback(async (userId: string, role: AppRole): Promise<boolean> => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role } : u
      ));
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const updateUserSubscription = useCallback(async (userId: string, plan: SubscriptionPlan): Promise<boolean> => {
    try {
      const expiresAt = plan === 'free' 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await apiClient.put(`/admin/users/${userId}/subscription`, { plan, expiresAt });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, subscriptionPlan: plan, subscriptionExpiresAt: expiresAt } : u
      ));
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  return {
    users,
    isLoading,
    error,
    refresh: fetchUsers,
    updateUserRole,
    updateUserSubscription,
    deleteUser,
  };
}
