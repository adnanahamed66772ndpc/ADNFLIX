import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  user_name?: string;
  user_email?: string;
  reply_count?: number;
  /** Admin only: true when last reply is from user (needs admin attention) */
  has_new_user_reply?: boolean;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_name?: string;
}

export interface TicketWithReplies extends Ticket {
  replies: TicketReply[];
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async (status?: string, priority?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      const url = `/tickets${params.toString() ? '?' + params.toString() : ''}`;
      const data = await apiClient.get<Ticket[]>(url);
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = useCallback(async (id: string, status: string, priority?: string) => {
    try {
      await apiClient.put(`/tickets/${id}`, { status, priority });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: status as any, priority: priority as any || t.priority } : t));
      return true;
    } catch (error) {
      console.error('Failed to update ticket:', error);
      throw error;
    }
  }, []);

  const getTicketById = useCallback(async (id: string): Promise<TicketWithReplies> => {
    try {
      const data = await apiClient.get<TicketWithReplies>(`/tickets/${id}`);
      return data;
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      throw error;
    }
  }, []);

  return {
    tickets,
    isLoading,
    refresh: fetchTickets,
    updateTicketStatus,
    getTicketById,
  };
}
