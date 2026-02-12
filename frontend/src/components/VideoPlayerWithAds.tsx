import { useState, useEffect, useCallback, useMemo } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import AdPlayer from '@/components/AdPlayer';
import { useActiveAds, AdVideo, AdSettings } from '@/hooks/useAdSettings';
import apiClient from '@/api/client';
import { fetchVASTAd, VASTAd } from '@/lib/vastParser';
import { fetchVMAP, resolveAllAdBreaks, categorizeAdBreaks, ResolvedAdBreak } from '@/lib/vmapParser';
import type { AudioTrack } from '@/lib/languageUtils';
import type { AudioTrack } from '@/lib/languageUtils';

type AdState = 'loading_ads' | 'pre_roll' | 'playing' | 'mid_roll' | 'post_roll' | 'ended';

interface VideoPlayerWithAdsProps {
  src: string;
  poster?: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  startTime?: number;
  autoPlay?: boolean;
  videoDuration?: number; // Duration in minutes for mid-roll calculation
  userSubscriptionPlan?: 'free' | 'with-ads' | 'premium';
  userId?: string;
  titleId?: string;
  episode?: { audioTracks?: AudioTrack[] };
  titleData?: { audioTracks?: AudioTrack[] };
}

// Unified ad type that can be custom or VAST
interface UnifiedAd {
  type: 'custom' | 'vast';
  customAd?: AdVideo;
  vastAd?: VASTAd;
  id: string;
}

export const VideoPlayerWithAds = ({
  src,
  poster,
  title,
  onProgress,
  onEnded,
  startTime = 0,
  autoPlay = false,
  videoDuration = 0,
  userSubscriptionPlan = 'free',
  userId,
  titleId,
  episode,
  titleData,
}: VideoPlayerWithAdsProps) => {
  const { ads, settings, isLoading } = useActiveAds();
  
  const [adState, setAdState] = useState<AdState>('loading_ads');
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentAds, setCurrentAds] = useState<UnifiedAd[]>([]);
  const [midRollBreakpoints, setMidRollBreakpoints] = useState<number[]>([]);
  const [nextMidRollIndex, setNextMidRollIndex] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  
  // VAST/VMAP state
  const [vastPreRoll, setVastPreRoll] = useState<VASTAd[]>([]);
  const [vastMidRoll, setVastMidRoll] = useState<VASTAd[]>([]);
  const [vastPostRoll, setVastPostRoll] = useState<VASTAd[]>([]);
  const [vmapMidRollBreakpoints, setVmapMidRollBreakpoints] = useState<number[]>([]);
  const [adsLoaded, setAdsLoaded] = useState(false);

  // Check if user should see ads
  const shouldShowAds = useMemo(() => {
    if (!settings?.enabled) return false;
    // Premium users don't see ads
    return userSubscriptionPlan !== 'premium';
  }, [settings, userSubscriptionPlan]);

  // Load VAST/VMAP ads based on settings
  useEffect(() => {
    if (isLoading || !settings || !shouldShowAds) {
      if (!isLoading && !shouldShowAds) {
        setAdsLoaded(true);
        setAdState('playing');
      }
      return;
    }

    const loadAds = async () => {
      try {
        if (settings.ad_source === 'vmap' && settings.vmap_url) {
          // Load VMAP playlist
          const vmapResponse = await fetchVMAP(settings.vmap_url);
          const durationSeconds = videoDuration * 60;
          const resolvedBreaks = await resolveAllAdBreaks(vmapResponse, durationSeconds);
          const categorized = categorizeAdBreaks(resolvedBreaks);
          
          if (categorized.preRoll?.ads) {
            setVastPreRoll(categorized.preRoll.ads);
          }
          if (categorized.postRoll?.ads) {
            setVastPostRoll(categorized.postRoll.ads);
          }
          if (categorized.midRolls.length > 0) {
            const allMidRollAds: VASTAd[] = [];
            const breakpoints: number[] = [];
            
            categorized.midRolls.forEach((midRoll) => {
              if (midRoll.timeOffsetSeconds !== undefined) {
                breakpoints.push(midRoll.timeOffsetSeconds);
                allMidRollAds.push(...midRoll.ads);
              }
            });
            
            setVastMidRoll(allMidRollAds);
            setVmapMidRollBreakpoints(breakpoints);
          }
        } else if (settings.ad_source === 'vast') {
          // Load individual VAST tags
          const loadPromises: Promise<void>[] = [];
          
          if (settings.pre_roll_enabled && settings.vast_pre_roll_tag) {
            loadPromises.push(
              fetchVASTAd(settings.vast_pre_roll_tag).then(response => {
                setVastPreRoll(response.ads);
              })
            );
          }
          
          if (settings.mid_roll_enabled && settings.vast_mid_roll_tag) {
            loadPromises.push(
              fetchVASTAd(settings.vast_mid_roll_tag).then(response => {
                setVastMidRoll(response.ads);
              })
            );
          }
          
          if (settings.post_roll_enabled && settings.vast_post_roll_tag) {
            loadPromises.push(
              fetchVASTAd(settings.vast_post_roll_tag).then(response => {
                setVastPostRoll(response.ads);
              })
            );
          }
          
          await Promise.all(loadPromises);
        }
        // For 'custom' source, we use the ads from useActiveAds hook directly
      } catch (error) {
        console.error('Error loading VAST/VMAP ads:', error);
        // If fallback is enabled and we have custom ads, use those
      } finally {
        setAdsLoaded(true);
      }
    };

    loadAds();
  }, [isLoading, settings, shouldShowAds, videoDuration]);

  // Get available ads based on source
  const getAvailableAds = useCallback((position: 'pre' | 'mid' | 'post'): UnifiedAd[] => {
    if (!settings) return [];
    
    const isVastOrVmap = settings.ad_source === 'vast' || settings.ad_source === 'vmap';
    
    if (isVastOrVmap) {
      let vastAds: VASTAd[] = [];
      if (position === 'pre') vastAds = vastPreRoll;
      else if (position === 'mid') vastAds = vastMidRoll;
      else if (position === 'post') vastAds = vastPostRoll;
      
      // If no VAST ads and fallback is enabled, use custom ads
      if (vastAds.length === 0 && settings.fallback_to_custom) {
        let customAds: AdVideo[] = [];
        if (position === 'pre') customAds = ads.preRoll;
        else if (position === 'mid') customAds = ads.midRoll;
        else if (position === 'post') customAds = ads.postRoll;
        
        return customAds.map(ad => ({ type: 'custom' as const, customAd: ad, id: ad.id }));
      }
      
      return vastAds.map(ad => ({ type: 'vast' as const, vastAd: ad, id: ad.id }));
    }
    
    // Custom ads
    let customAds: AdVideo[] = [];
    if (position === 'pre') customAds = ads.preRoll;
    else if (position === 'mid') customAds = ads.midRoll;
    else if (position === 'post') customAds = ads.postRoll;
    
    return customAds.map(ad => ({ type: 'custom' as const, customAd: ad, id: ad.id }));
  }, [settings, ads, vastPreRoll, vastMidRoll, vastPostRoll]);

  // Calculate mid-roll breakpoints based on video duration (for custom ads)
  useEffect(() => {
    if (!settings || !shouldShowAds || videoDuration <= 0 || !adsLoaded) return;
    
    // If using VMAP, use VMAP-defined breakpoints
    if (settings.ad_source === 'vmap' && vmapMidRollBreakpoints.length > 0) {
      setMidRollBreakpoints(vmapMidRollBreakpoints);
      return;
    }

    const durationSeconds = videoDuration * 60;
    const minDuration = settings.min_video_duration_for_midroll;
    const intervalMinutes = settings.mid_roll_interval_minutes;
    
    if (durationSeconds < minDuration || !settings.mid_roll_enabled) {
      setMidRollBreakpoints([]);
      return;
    }

    // Calculate breakpoints
    const breakpoints: number[] = [];
    const intervalSeconds = intervalMinutes * 60;
    
    // For short videos (5-15 min): 1 ad at 50%
    if (durationSeconds <= 900) {
      breakpoints.push(durationSeconds * 0.5);
    }
    // For medium videos (15-30 min): 2 ads at 33% and 66%
    else if (durationSeconds <= 1800) {
      breakpoints.push(durationSeconds * 0.33);
      breakpoints.push(durationSeconds * 0.66);
    }
    // For long videos (30+ min): every interval
    else {
      let time = intervalSeconds;
      while (time < durationSeconds - 60) {
        breakpoints.push(time);
        time += intervalSeconds;
      }
    }

    setMidRollBreakpoints(breakpoints);
  }, [settings, shouldShowAds, videoDuration, adsLoaded, vmapMidRollBreakpoints]);

  // Determine initial ad state once ads are loaded
  useEffect(() => {
    if (isLoading || !adsLoaded) return;

    if (!shouldShowAds) {
      setAdState('playing');
      return;
    }

    // Check for pre-roll ads
    if (settings?.pre_roll_enabled) {
      const preRollAds = getAvailableAds('pre');
      if (preRollAds.length > 0) {
        setCurrentAds(preRollAds);
        setCurrentAdIndex(0);
        setAdState('pre_roll');
        return;
      }
    }
    
    setAdState('playing');
  }, [isLoading, adsLoaded, shouldShowAds, settings, getAvailableAds]);

  // Track impression for custom ads
  const trackImpression = useCallback(async (
    adId: string,
    type: 'view' | 'skip' | 'click' | 'complete'
  ) => {
    try {
      await apiClient.post('/ads/impressions', {
        adId,
        impressionType: type,
        userId: userId || undefined,
        titleId: titleId || undefined,
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }, [userId, titleId]);

  // Handle ad completion
  const handleAdComplete = useCallback(() => {
    const currentAd = currentAds[currentAdIndex];
    if (currentAd?.type === 'custom' && currentAd.customAd) {
      trackImpression(currentAd.customAd.id, 'complete');
    }

    // Check if there are more ads in the current break
    if (currentAdIndex < currentAds.length - 1) {
      setCurrentAdIndex(prev => prev + 1);
      return;
    }

    // Move to next state
    if (adState === 'pre_roll') {
      setAdState('playing');
    } else if (adState === 'mid_roll') {
      setAdState('playing');
      setNextMidRollIndex(prev => prev + 1);
    } else if (adState === 'post_roll') {
      setAdState('ended');
      onEnded?.();
    }
  }, [adState, currentAdIndex, currentAds, trackImpression, onEnded]);

  // Handle ad skip
  const handleAdSkip = useCallback(() => {
    const currentAd = currentAds[currentAdIndex];
    if (currentAd?.type === 'custom' && currentAd.customAd) {
      trackImpression(currentAd.customAd.id, 'skip');
    }
    handleAdComplete();
  }, [currentAds, currentAdIndex, trackImpression, handleAdComplete]);

  // Handle ad click
  const handleAdClick = useCallback(() => {
    const currentAd = currentAds[currentAdIndex];
    if (currentAd?.type === 'custom' && currentAd.customAd) {
      trackImpression(currentAd.customAd.id, 'click');
    }
  }, [currentAds, currentAdIndex, trackImpression]);

  // Handle video progress - check for mid-roll breaks
  const handleVideoProgress = useCallback((currentTime: number, duration: number) => {
    setVideoCurrentTime(currentTime);
    onProgress?.(currentTime, duration);

    // Check if we hit a mid-roll breakpoint
    if (
      shouldShowAds &&
      settings?.mid_roll_enabled &&
      nextMidRollIndex < midRollBreakpoints.length
    ) {
      const nextBreakpoint = midRollBreakpoints[nextMidRollIndex];
      if (currentTime >= nextBreakpoint) {
        const midRollAds = getAvailableAds('mid');
        if (midRollAds.length > 0) {
          setCurrentAds(midRollAds);
          setCurrentAdIndex(0);
          setAdState('mid_roll');
        } else {
          setNextMidRollIndex(prev => prev + 1);
        }
      }
    }
  }, [shouldShowAds, settings, midRollBreakpoints, nextMidRollIndex, onProgress, getAvailableAds]);

  // Handle video ended - show post-roll
  const handleVideoEnded = useCallback(() => {
    if (shouldShowAds && settings?.post_roll_enabled) {
      const postRollAds = getAvailableAds('post');
      if (postRollAds.length > 0) {
        setCurrentAds(postRollAds);
        setCurrentAdIndex(0);
        setAdState('post_roll');
        return;
      }
    }
    setAdState('ended');
    onEnded?.();
  }, [shouldShowAds, settings, getAvailableAds, onEnded]);

  // Show loading while fetching ad settings
  if (isLoading || (shouldShowAds && !adsLoaded)) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show ad player during ad states
  if (adState === 'pre_roll' || adState === 'mid_roll' || adState === 'post_roll') {
    const currentAd = currentAds[currentAdIndex];
    
    if (!currentAd) {
      // No ad available, skip to next state
      if (adState === 'pre_roll') setAdState('playing');
      else if (adState === 'mid_roll') {
        setAdState('playing');
        setNextMidRollIndex(prev => prev + 1);
      }
      else setAdState('ended');
      return null;
    }

    // Track view impression when ad starts (for custom ads)
    if (currentAdIndex === 0 && currentAd.type === 'custom' && currentAd.customAd) {
      trackImpression(currentAd.customAd.id, 'view');
    }

    return (
      <AdPlayer
        // Custom ad props
        videoUrl={currentAd.type === 'custom' ? currentAd.customAd?.video_url : undefined}
        clickUrl={currentAd.type === 'custom' ? currentAd.customAd?.click_url : undefined}
        // VAST ad props
        vastAd={currentAd.type === 'vast' ? currentAd.vastAd : undefined}
        // Common props
        skipAfterSeconds={settings?.skip_after_seconds || 5}
        onComplete={handleAdComplete}
        onSkip={handleAdSkip}
        onClick={handleAdClick}
        adNumber={currentAdIndex + 1}
        totalAds={currentAds.length}
      />
    );
  }

  // Validate src before passing to player
  if (!src || src.trim() === '' || src === 'null' || src === 'undefined') {
    console.error('❌ VideoPlayerWithAds: Invalid or empty src:', src);
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white p-4">
          <h2 className="text-xl font-bold mb-2">Video Not Available</h2>
          <p className="text-gray-400">The video URL is missing or invalid.</p>
          <p className="text-sm text-gray-500 mt-2">Please check the video source in the admin panel.</p>
        </div>
      </div>
    );
  }

  // Show video player
  return (
    <VideoPlayer
      src={src}
      poster={poster}
      title={title}
      onProgress={handleVideoProgress}
      onEnded={handleVideoEnded}
      startTime={startTime}
      autoPlay={autoPlay}
      fallbackDuration={videoDuration * 60}
      titleId={titleId}
      episodeId={episode?.id}
    />
  );
};

export default VideoPlayerWithAds;
