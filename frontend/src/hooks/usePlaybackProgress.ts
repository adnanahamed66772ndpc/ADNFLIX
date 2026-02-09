import { useEffect, useState, useCallback, useRef } from 'react';
import apiClient from '@/api/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTitlesContext } from '@/contexts/TitlesContext';
import { Title } from '@/hooks/useTitles';

interface PlaybackProgress {
  titleId: string;
  episodeId?: string;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: string;
}

export function usePlaybackProgress() {
  const { user, isAuthenticated } = useAuthContext();
  const { titles, getTitleById } = useTitlesContext();
  const [progress, setProgress] = useState<PlaybackProgress[]>([]);
  const [continueWatching, setContinueWatching] = useState<Title[]>([]);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);
  const lastUpdateRef = useRef<Record<string, number>>({});

  // Update continue watching list based on progress
  useEffect(() => {
    if (progress.length === 0 || titles.length === 0) {
      setContinueWatching([]);
      return;
    }

    // Get unique title IDs from progress (for movies, use titleId; for series, use titleId with episodeId)
    const titleProgressMap = new Map<string, PlaybackProgress>();
    
    progress.forEach(p => {
      const key = p.titleId;
      const existing = titleProgressMap.get(key);
      
      // For movies, use the progress directly
      // For series, prefer progress with the most recent update
      if (!existing || (p.episodeId && (!existing.episodeId || new Date(p.updatedAt) > new Date(existing.updatedAt)))) {
        titleProgressMap.set(key, p);
      }
    });

    // Build continue watching list with titles that have valid progress (not completed)
    const continueWatchingList: Title[] = [];
    
    titleProgressMap.forEach((prog, titleId) => {
      const title = getTitleById(titleId);
      if (title) {
        const progressPercent = prog.durationSeconds > 0 
          ? (prog.progressSeconds / prog.durationSeconds) * 100 
          : 0;
        
        // Only add if progress is between 5% and 95% (not just started, not completed)
        if (progressPercent >= 5 && progressPercent < 95) {
          continueWatchingList.push(title);
        }
      }
    });

    // Sort by most recently updated
    continueWatchingList.sort((a, b) => {
      const progressA = titleProgressMap.get(a.id);
      const progressB = titleProgressMap.get(b.id);
      if (!progressA || !progressB) return 0;
      return new Date(progressB.updatedAt).getTime() - new Date(progressA.updatedAt).getTime();
    });

    setContinueWatching(continueWatchingList.slice(0, 10));
  }, [progress, titles, getTitleById]);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress([]);
      setContinueWatching([]);
      setIsProgressLoaded(true);
      return;
    }

    try {
      const data = await apiClient.get<PlaybackProgress[]>('/playback');
      setProgress(data);
      setIsProgressLoaded(true);
      console.log('📊 Progress loaded:', data.length, 'items');
    } catch {
      setProgress([]);
      setContinueWatching([]);
      setIsProgressLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsProgressLoaded(false);
      fetchProgress();
    } else {
      setProgress([]);
      setIsProgressLoaded(true);
    }
  }, [isAuthenticated, fetchProgress]);

  const updateProgress = useCallback(async (
    titleId: string,
    progressSeconds: number,
    durationSeconds: number,
    episodeId?: string,
    forceImmediate: boolean = false // Allow bypassing throttle for seeks/exits
  ) => {
    if (!user) return;

    if (!titleId || typeof titleId !== 'string' || titleId.length > 100) return;
    if (typeof progressSeconds !== 'number' || progressSeconds < 0) return;
    if (typeof durationSeconds !== 'number' || durationSeconds < 0) return;
    if (episodeId !== undefined && (typeof episodeId !== 'string' || episodeId.length > 100)) return;

    const key = `${titleId}-${episodeId || ''}`;
    const now = Date.now();
    // Netflix-style: Save progress every 1 second for high-write volume
    // But allow immediate save for seeks and page exits (forceImmediate = true)
    if (!forceImmediate && lastUpdateRef.current[key] && now - lastUpdateRef.current[key] < 1000) {
      return;
    }
    lastUpdateRef.current[key] = now;

    // Update local progress immediately for better UX
    setProgress(prev => {
      const existingIndex = prev.findIndex(
        p => p.titleId === titleId && p.episodeId === episodeId
      );
      
      const newProgress: PlaybackProgress = {
        titleId,
        episodeId,
        progressSeconds,
        durationSeconds,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newProgress;
        console.log('💾 Progress updated:', { titleId, episodeId, progressSeconds, durationSeconds });
        return updated;
      } else {
        console.log('💾 Progress created:', { titleId, episodeId, progressSeconds, durationSeconds });
        return [...prev, newProgress];
      }
    });

    // Netflix-style: High-write volume with batched writes
    // Use fire-and-forget pattern for better performance
    // Progress is already updated locally, so API failure doesn't affect UX
    apiClient.post('/playback', {
      titleId,
      episodeId,
      progressSeconds,
      durationSeconds,
    }).catch(() => {
      // Silent fail - progress is already updated locally
      // In production, you might want to queue failed writes for retry
    });
  }, [user]);

  const getProgress = (titleId: string, episodeId?: string): PlaybackProgress | undefined => {
    // Netflix-style: For movies, episodeId is undefined, so we need to match both undefined and null
    // For series, we need exact match
    return progress.find(p => {
      const titleMatch = p.titleId === titleId;
      // Handle both undefined and null for movies (episodeId can be undefined or null in stored data)
      const episodeMatch = episodeId === undefined 
        ? (p.episodeId === undefined || p.episodeId === null || p.episodeId === '')
        : (p.episodeId === episodeId);
      return titleMatch && episodeMatch;
    });
  };

  const getProgressPercentage = (titleId: string, episodeId?: string): number => {
    const p = getProgress(titleId, episodeId);
    if (!p || p.durationSeconds === 0) return 0;
    return Math.min((p.progressSeconds / p.durationSeconds) * 100, 100);
  };

  const addToContinueWatching = useCallback((title: Title) => {
    // This is now handled automatically by the useEffect that syncs progress with continue watching
    // But we keep this for backward compatibility
    if (!title) return;
    
    // If title doesn't have progress yet, it will be added when progress is created
    // This function is mainly for immediate UI updates if needed
  }, []);

  // Netflix-style: Remove from Continue Watching (mark as completed or manually remove)
  const removeFromContinueWatching = useCallback(async (titleId: string) => {
    if (!user) return false;
    
    try {
      // Mark as completed by setting progress to 100%
      // First get current progress to get duration
      const currentProgress = getProgress(titleId);
      if (currentProgress && currentProgress.durationSeconds > 0) {
        // Set progress to 100% (completed)
        await updateProgress(
          titleId, 
          currentProgress.durationSeconds, 
          currentProgress.durationSeconds,
          currentProgress.episodeId,
          true // Force immediate
        );
      } else {
        // If no progress exists, we can't mark as completed
        // Instead, we'll just remove it from the local state
        setProgress(prev => prev.filter(p => p.titleId !== titleId));
      }
      return true;
    } catch (error) {
      console.error('Error removing from continue watching:', error);
      return false;
    }
  }, [user, getProgress, updateProgress]);

  const getContinueWatchingTitles = useCallback(() => {
    return continueWatching;
  }, [continueWatching]);

  return {
    progress,
    continueWatching,
    isProgressLoaded,
    updateProgress,
    getProgress,
    getProgressPercentage,
    addToContinueWatching,
    removeFromContinueWatching,
    getContinueWatchingTitles,
    refresh: fetchProgress,
  };
}
