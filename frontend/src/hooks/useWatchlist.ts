import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTitlesContext, Title } from '@/contexts/TitlesContext';

interface WatchlistItem {
  id: string;
  titleId: string;
  addedAt: string;
}

export function useWatchlist() {
  const { user, isAuthenticated } = useAuthContext();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.get<WatchlistItem[]>('/watchlist');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, fetchWatchlist]);

  const addToWatchlist = async (titleId: string) => {
    if (!user) return false;

    if (!titleId || typeof titleId !== 'string' || titleId.length > 100) {
      return false;
    }

    try {
      await apiClient.post('/watchlist', { titleId });
      await fetchWatchlist();
      return true;
    } catch {
      return false;
    }
  };

  const removeFromWatchlist = async (titleId: string) => {
    if (!user) return false;

    if (!titleId || typeof titleId !== 'string') {
      return false;
    }

    try {
      await apiClient.delete(`/watchlist/${titleId}`);
      setItems(prev => prev.filter(item => item.titleId !== titleId));
      return true;
    } catch {
      return false;
    }
  };

  const isInWatchlist = (titleId: string) => {
    return items.some(item => item.titleId === titleId);
  };

  const getWatchlistTitles = (): Title[] => {
    return [];
  };

  return {
    items,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistTitles,
    refresh: fetchWatchlist,
  };
}
