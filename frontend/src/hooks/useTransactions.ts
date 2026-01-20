import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  planId: string;
  paymentMethod: string;
  transactionId: string;
  senderNumber?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
}

export function useTransactions() {
  const { user, isAdmin } = useAuthContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.get<Transaction[]>('/transactions');
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [user, fetchTransactions]);

  const createTransaction = async (
    planId: string,
    paymentMethod: string,
    transactionId: string,
    amount: number,
    senderNumber?: string
  ): Promise<boolean> => {
    if (!user) return false;

    if (!planId || !paymentMethod || !transactionId || amount <= 0) {
      return false;
    }

    try {
      await apiClient.post('/transactions', {
        planId,
        paymentMethod,
        transactionId,
        amount,
        senderNumber,
      });
    await fetchTransactions();
    return true;
    } catch {
      return false;
    }
  };

  const approveTransaction = async (transactionId: string): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      await apiClient.post(`/transactions/${transactionId}/approve`, {});
    await fetchTransactions();
      return true;
    } catch {
      return false;
    }
  };

  const rejectTransaction = async (transactionId: string, reason: string): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      await apiClient.post(`/transactions/${transactionId}/reject`, { reason });
    await fetchTransactions();
      return true;
    } catch {
      return false;
    }
  };

  const getTransactionsByStatus = (status: Transaction['status']): Transaction[] => {
    return transactions.filter(t => t.status === status);
  };

  const getPendingCount = (): number => {
    return transactions.filter(t => t.status === 'pending').length;
  };

  return {
    transactions,
    isLoading,
    refresh: fetchTransactions,
    createTransaction,
    approveTransaction,
    rejectTransaction,
    getTransactionsByStatus,
    getPendingCount,
  };
}
