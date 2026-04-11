import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';

export type AdSource = 'custom' | 'vast' | 'vmap';

export interface AdSettings {
  id: string;
  enabled: boolean;
  preRollEnabled: boolean;
  midRollEnabled: boolean;
  postRollEnabled: boolean;
  midRollIntervalMinutes: number;
  minVideoDurationForMidroll: number;
  adDurationSeconds: number;
  skipAfterSeconds: number;
  adSource: AdSource;
  vastPreRollTag: string | null;
  vastMidRollTag: string | null;
  vastPostRollTag: string | null;
  vmapUrl: string | null;
  fallbackToCustom: boolean;
}

export interface AdVideo {
  id: string;
  name: string;
  videoUrl: string;
  type: 'pre_roll' | 'mid_roll' | 'post_roll';
  active: boolean;
  clickUrl: string | null;
  createdAt: string;
}

export function useAdSettings() {
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const [adVideos, setAdVideos] = useState<AdVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiClient.get<AdSettings>('/ads/settings');
      setSettings(data);
    } catch (error) {
      console.error('Error fetching ad settings:', error);
    }
  }, []);

  const fetchAdVideos = useCallback(async () => {
    try {
      const data = await apiClient.get<AdVideo[]>('/ads/videos');
      setAdVideos(data || []);
    } catch (error) {
      console.error('Error fetching ad videos:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSettings(), fetchAdVideos()]);
    setIsLoading(false);
  }, [fetchSettings, fetchAdVideos]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = async (updates: Partial<AdSettings>): Promise<boolean> => {
    if (!settings) return false;
    
    try {
      // Filter out undefined values to avoid sending them
      // But keep null, false, 0, and empty strings as they are valid values
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        // Only filter out undefined, keep everything else (including null, false, 0, empty string)
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<AdSettings>);

      if (Object.keys(cleanUpdates).length === 0) {
        console.warn('No valid updates to send', updates);
        return false;
      }

      console.log('Sending updates:', cleanUpdates);

      await apiClient.put('/ads/settings', cleanUpdates);
      setSettings({ ...settings, ...cleanUpdates });
      toast({ title: "Ad settings updated" });
      return true;
    } catch (error) {
      console.error('Error updating ad settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ 
        title: "Failed to update settings", 
        description: errorMessage,
        variant: "destructive" 
      });
      return false;
    }
  };

  const addAdVideo = async (video: Omit<AdVideo, 'id' | 'createdAt'>): Promise<string | null> => {
    try {
      const response = await apiClient.post<{ id: string; success: boolean }>('/ads/videos', {
        name: video.name,
        videoUrl: video.videoUrl,
        type: video.type,
        active: video.active,
        clickUrl: video.clickUrl,
      });
      
      await fetchAdVideos();
      toast({ title: "Ad video added" });
      return response.id;
    } catch (error) {
      console.error('Error adding ad video:', error);
      toast({ title: "Failed to add ad video", variant: "destructive" });
      return null;
    }
  };

  const updateAdVideo = async (id: string, updates: Partial<AdVideo>): Promise<boolean> => {
    try {
      await apiClient.put(`/ads/videos/${id}`, updates);
      await fetchAdVideos();
      toast({ title: "Ad video updated" });
      return true;
    } catch (error) {
      console.error('Error updating ad video:', error);
      toast({ title: "Failed to update ad video", variant: "destructive" });
      return false;
    }
  };

  const deleteAdVideo = async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/ads/videos/${id}`);
      await fetchAdVideos();
      toast({ title: "Ad video deleted" });
      return true;
    } catch (error) {
      console.error('Error deleting ad video:', error);
      toast({ title: "Failed to delete ad video", variant: "destructive" });
      return false;
    }
  };

  const trackImpression = async (
    adId: string, 
    impressionType: 'view' | 'skip' | 'click' | 'complete',
    userId?: string,
    titleId?: string
  ) => {
    try {
      await apiClient.post('/ads/impressions', {
        adId,
        impressionType,
        userId,
        titleId,
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  return {
    settings,
    adVideos,
    isLoading,
    refresh,
    updateSettings,
    addAdVideo,
    updateAdVideo,
    deleteAdVideo,
    trackImpression,
  };
}

// Get active ads by type
export function useActiveAds() {
  const [ads, setAds] = useState<{
    preRoll: AdVideo[];
    midRoll: AdVideo[];
    postRoll: AdVideo[];
  }>({ preRoll: [], midRoll: [], postRoll: [] });
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const [settingsData, videosData] = await Promise.all([
          apiClient.get<AdSettings>('/ads/settings'),
          apiClient.get<AdVideo[]>('/ads/videos/active'),
        ]);

        if (settingsData) {
          setSettings(settingsData);
        }

        if (videosData) {
          setAds({
            preRoll: videosData.filter(v => v.type === 'pre_roll'),
            midRoll: videosData.filter(v => v.type === 'mid_roll'),
            postRoll: videosData.filter(v => v.type === 'post_roll'),
          });
        }
      } catch (error) {
        console.error('Error fetching active ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, []);

  return { ads, settings, isLoading };
}
