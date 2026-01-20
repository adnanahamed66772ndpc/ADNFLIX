import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/client';
import type { AudioTrack } from '@/lib/languageUtils';

export interface Episode {
  id: string;
  episodeNumber: number;
  name: string;
  synopsis?: string;
  duration: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  audioTracks?: AudioTrack[];
  audio_tracks?: AudioTrack[]; // Backward compatibility
}

export interface Season {
  id: string;
  seasonNumber: number;
  name?: string;
  episodes: Episode[];
}

export interface Title {
  id: string;
  type: 'movie' | 'series';
  name: string;
  synopsis?: string;
  year: number;
  language: string;
  maturity: string;
  premium: boolean;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  videoUrl?: string;
  duration?: number;
  rating: number;
  genres: string[];
  cast: string[];
  audioTracks?: AudioTrack[];
  audio_tracks?: AudioTrack[]; // Backward compatibility
  trending: boolean;
  newRelease: boolean;
  seasons?: Season[];
  createdAt: string;
}

export function useTitles() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTitles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Title[]>('/titles');
      
      // Debug: Log episode data to verify video URLs
      if (data && data.length > 0) {
        const seriesWithEpisodes = data.filter(t => t.type === 'series' && t.seasons && t.seasons.length > 0);
        seriesWithEpisodes.forEach(title => {
          title.seasons?.forEach(season => {
            season.episodes?.forEach(episode => {
              if (!episode.videoUrl || episode.videoUrl.trim() === '') {
                console.warn(`⚠️ Episode "${episode.name}" (${title.name}) has no video URL:`, {
                  titleId: title.id,
                  titleName: title.name,
                  seasonNumber: season.seasonNumber,
                  episodeId: episode.id,
                  episodeName: episode.name,
                  episodeNumber: episode.episodeNumber,
                  videoUrl: episode.videoUrl
                });
              }
            });
          });
        });
      }
      
      setTitles(data || []);
    } catch (error) {
      console.error('[useTitles] Error fetching titles:', error);
      setTitles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  const getTitleById = useCallback((id: string): Title | undefined => {
    return titles.find(t => t.id === id);
  }, [titles]);

  const getTrendingTitles = useCallback((): Title[] => {
    return titles.filter(t => t.trending);
  }, [titles]);

  const getNewReleases = useCallback((): Title[] => {
    return titles.filter(t => t.newRelease);
  }, [titles]);

  const getMovies = useCallback((): Title[] => {
    return titles.filter(t => t.type === 'movie');
  }, [titles]);

  const getSeries = useCallback((): Title[] => {
    return titles.filter(t => t.type === 'series');
  }, [titles]);

  const getTitlesByGenre = useCallback((genre: string): Title[] => {
    return titles.filter(t => t.genres.includes(genre));
  }, [titles]);

  const getFreeTitles = useCallback((): Title[] => {
    return titles.filter(t => !t.premium);
  }, [titles]);

  const getPremiumTitles = useCallback((): Title[] => {
    return titles.filter(t => t.premium);
  }, [titles]);

  const searchTitles = useCallback((query: string): Title[] => {
    const lowerQuery = query.toLowerCase();
    return titles.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.synopsis?.toLowerCase().includes(lowerQuery) ||
      t.genres.some(g => g.toLowerCase().includes(lowerQuery)) ||
      t.cast.some(c => c.toLowerCase().includes(lowerQuery))
    );
  }, [titles]);

  return {
    titles,
    isLoading,
    refresh: fetchTitles,
    getTitleById,
    getTrendingTitles,
    getNewReleases,
    getMovies,
    getSeries,
    getTitlesByGenre,
    getFreeTitles,
    getPremiumTitles,
    searchTitles,
  };
}

// Admin functions for managing titles
export function useTitlesAdmin() {
  const addTitle = async (title: Omit<Title, 'id' | 'createdAt' | 'seasons'>): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const response = await apiClient.post<{ id: string; success: boolean }>('/titles', title);
      return { success: true, id: response.id };
    } catch (error: any) {
      console.error('[useTitles] Failed to add title:', error);
      const errorMessage = error?.message || error?.error || 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const updateTitle = async (id: string, updates: Partial<Omit<Title, 'id' | 'createdAt' | 'seasons'>>): Promise<boolean> => {
    try {
      await apiClient.put(`/titles/${id}`, updates);
      return true;
    } catch (error) {
      console.error('[useTitles] Failed to update title:', error);
      return false;
    }
  };

  const deleteTitle = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/titles/${id}`);
      return true;
    } catch {
      return false;
    }
  };

  const addSeason = async (titleId: string, seasonNumber: number, name?: string): Promise<string | null> => {
    try {
      const response = await apiClient.post<{ id: string; success: boolean }>(`/titles/${titleId}/seasons`, {
        seasonNumber,
        name,
      });
      return response.id;
    } catch {
      return null;
    }
  };

  const deleteSeason = async (seasonId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/titles/seasons/${seasonId}`);
      return true;
    } catch {
      return false;
    }
  };

  const addEpisode = async (
    seasonId: string, 
    episode: Omit<Episode, 'id'>
  ): Promise<string | null> => {
    try {
      const response = await apiClient.post<{ id: string; success: boolean }>(`/titles/seasons/${seasonId}/episodes`, {
        episodeNumber: episode.episodeNumber,
        name: episode.name,
        synopsis: episode.synopsis,
        duration: episode.duration,
        thumbnailUrl: episode.thumbnailUrl,
        videoUrl: episode.videoUrl,
        audioTracks: episode.audioTracks || episode.audio_tracks || [],
      });
      return response.id;
    } catch {
      return null;
    }
  };

  const deleteEpisode = async (episodeId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/titles/episodes/${episodeId}`);
      return true;
    } catch {
      return false;
    }
  };

  return {
    addTitle,
    updateTitle,
    deleteTitle,
    addSeason,
    deleteSeason,
    addEpisode,
    deleteEpisode,
  };
}
