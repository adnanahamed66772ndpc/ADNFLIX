import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, SkipForward, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import VideoPlayerWithAds from '@/components/VideoPlayerWithAds';
import { getPlayableVideoUrl } from '@/lib/videoUrl';
import { useTitlesContext, Episode } from '@/contexts/TitlesContext';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Watch = () => {
  // ============================================
  // 1. ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONS
  // ============================================
  
  // Router hooks
  const { titleId, episodeId } = useParams<{ titleId: string; episodeId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Context hooks
  const { getTitleById, isLoading } = useTitlesContext();
  const { user } = useAuth();
  const { updateProgress, getProgress, addToContinueWatching, progress, isProgressLoaded } = usePlaybackProgress();
  
  // State hooks
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);
  const [savedProgress, setSavedProgress] = useState<number>(0);
  
  // Get title
  const title = getTitleById(titleId || '');

  // ============================================
  // 2. MEMOIZED COMPUTED VALUES
  // ============================================
  
  // Compute episode and video URL based on title type
  const computedData = useMemo(() => {
    // Default values
    let currentEp: Episode | undefined = undefined;
    let currentSsn: { seasonNumber: number } | undefined = undefined;
    let vidUrl = '';
    let vidTitle = '';
    
    if (!title) {
      return {
        currentEpisode: undefined,
        currentSeason: undefined,
        videoUrl: '',
        videoTitle: '',
        hasVideoUrl: false,
        canWatch: true,
        isMovie: false,
        isSeries: false,
      };
    }

    const isMovie = title.type === 'movie';
    const isSeries = title.type === 'series';
    
    // Helper to clean video URL
    const cleanUrl = (url: string | null | undefined): string => {
      if (!url) return '';
      const trimmed = String(url).trim();
      return (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') ? '' : trimmed;
    };

    if (isMovie) {
      // MOVIE: Use title.videoUrl directly (single video file)
      vidUrl = cleanUrl(title.videoUrl) || cleanUrl((title as any).video_url) || '';
      vidTitle = title.name || 'Movie';
    } else if (isSeries && episodeId && title.seasons) {
      // SERIES: Find the episode and use episode.videoUrl
      for (const season of title.seasons) {
        const episode = season.episodes?.find(e => e.id === episodeId);
        if (episode) {
          const epVideoUrl = (episode as any).videoUrl || (episode as any).video_url || '';
          const episodeNumber = (episode as any).episodeNumber || (episode as any).episode_number || 1;
          const thumbnailUrl = (episode as any).thumbnailUrl || (episode as any).thumbnail_url || '';
          
          currentEp = {
            ...episode,
            videoUrl: epVideoUrl,
            episodeNumber: episodeNumber,
            thumbnailUrl: thumbnailUrl,
          };
          
          const seasonNum = season.seasonNumber ?? (season as any).season_number ?? 1;
          currentSsn = { seasonNumber: seasonNum };
          
          vidUrl = cleanUrl(epVideoUrl);
          vidTitle = `${title.name} - S${seasonNum}E${episodeNumber}: ${episode.name || 'Episode'}`;
          break;
        }
      }
    }

    const isPremium = title.premium ?? false;
    const canWatchVal = !isPremium || (user?.subscriptionPlan !== 'free');
    
    const hasVidUrl = Boolean(vidUrl && vidUrl.length > 0);

    return {
      currentEpisode: currentEp,
      currentSeason: currentSsn,
      videoUrl: vidUrl,
      videoTitle: vidTitle || title.name || '',
      hasVideoUrl: hasVidUrl,
      canWatch: canWatchVal,
      isMovie,
      isSeries,
    };
  }, [title, episodeId, user?.subscriptionPlan]);

  // Destructure for easier use
  const { 
    currentEpisode, 
    currentSeason, 
    videoUrl, 
    videoTitle, 
    hasVideoUrl, 
    canWatch,
    isMovie,
    isSeries,
  } = computedData;

  // ============================================
  // 3. CALLBACK HOOKS
  // ============================================
  
  const handleProgress = useCallback((currentTime: number, duration: number, forceImmediate: boolean = false) => {
    if (duration > 0 && titleId && title) {
      // For movies: no episodeId; for series: use episodeId
      const epId = isMovie ? undefined : episodeId;
      updateProgress(titleId, currentTime, duration, epId, forceImmediate);
      if (currentTime > 0 && currentTime < duration * 0.95) {
        addToContinueWatching(title);
      }
    }
  }, [titleId, title, isMovie, episodeId, updateProgress, addToContinueWatching]);

  const handleEnded = useCallback(() => {
    // Netflix-style: Mark current episode as completed and go to next
    if (titleId && title) {
      // Get video element to mark as 100% complete
      const video = document.querySelector('video');
      if (video && video.duration > 0) {
        const epId = isMovie ? undefined : episodeId;
        // Mark as completed (100%)
        updateProgress(titleId, video.duration, video.duration, epId, true);
        console.log('📺 Episode completed, marked as 100%');
      }
    }
    
    // Auto-advance to next episode (Netflix-style)
    if (nextEpisode && title && isSeries) {
      console.log('📺 Auto-advancing to next episode:', nextEpisode.name);
      navigate(`/watch/${title.id}/${nextEpisode.id}`);
    }
  }, [nextEpisode, title, titleId, episodeId, isMovie, isSeries, navigate, updateProgress]);

  const playNextEpisode = useCallback(() => {
    if (nextEpisode && title) {
      navigate(`/watch/${title.id}/${nextEpisode.id}`);
    }
  }, [nextEpisode, title, navigate]);

  // ============================================
  // 4. EFFECT HOOKS - ALL CALLED UNCONDITIONALLY
  // ============================================

  // Effect 1: Netflix-style Series Resume - Redirect to correct episode
  // This is a ref to track if we've already redirected (to prevent duplicate redirects)
  const hasRedirectedRef = useRef(false);
  
  useEffect(() => {
    // Reset redirect flag when title changes
    if (titleId) {
      hasRedirectedRef.current = false;
    }
  }, [titleId]);
  
  useEffect(() => {
    if (!title || isLoading || !isSeries || episodeId || !title.seasons) return;
    
    // CRITICAL: Wait for progress data to be loaded before making redirect decision
    if (!isProgressLoaded) {
      console.log('📺 Netflix Resume: Waiting for progress data to load...');
      return;
    }
    
    // Prevent duplicate redirects
    if (hasRedirectedRef.current) return;
    
    const allEpisodes = title.seasons.flatMap(s => s.episodes || []);
    if (allEpisodes.length === 0) return;
    
    const firstEpisode = allEpisodes[0];

    // Netflix-style: Find the episode to resume
    // 1. Find the most recently watched episode that's not completed (< 95%)
    // 2. If all watched episodes are completed, find the next unwatched episode
    // 3. If no progress at all, start from first episode
    
    console.log('📺 Netflix Resume: Checking progress for', allEpisodes.length, 'episodes');
    console.log('📺 Progress data available:', progress.length, 'items');
    
    let resumeEpisode = null;
    let resumeProgress = null;
    let latestUpdateTime = 0;
    
    // First pass: Find most recently watched episode that's NOT completed
    for (const episode of allEpisodes) {
      const epProgress = getProgress(titleId || '', episode.id);
      if (epProgress) {
        const progressPercent = epProgress.durationSeconds > 0 
          ? (epProgress.progressSeconds / epProgress.durationSeconds) * 100 
          : 0;
        const updateTime = new Date(epProgress.updatedAt).getTime();
        
        console.log('📺 Episode', episode.name, ':', progressPercent.toFixed(1), '%');
        
        // Episode is in progress (not completed)
        if (progressPercent >= 5 && progressPercent < 95) {
          if (!resumeProgress || updateTime > latestUpdateTime) {
            latestUpdateTime = updateTime;
            resumeEpisode = episode;
            resumeProgress = epProgress;
            console.log('📺 Found in-progress episode:', episode.name, 'at', epProgress.progressSeconds, 'seconds');
          }
        }
      }
    }
    
    // If found an in-progress episode, resume from there
    if (resumeEpisode && resumeProgress) {
      const progressSeconds = Math.floor(resumeProgress.progressSeconds);
      console.log('📺 Netflix Resume: Continuing from in-progress episode', resumeEpisode.name, 'at', progressSeconds, 'seconds');
      hasRedirectedRef.current = true;
      navigate(`/watch/${titleId}/${resumeEpisode.id}?t=${progressSeconds}`, { replace: true });
      return;
    }
    
    // Second pass: Find the first unwatched episode after the last completed one
    let lastCompletedIndex = -1;
    for (let i = 0; i < allEpisodes.length; i++) {
      const episode = allEpisodes[i];
      const epProgress = getProgress(titleId || '', episode.id);
      if (epProgress) {
        const progressPercent = epProgress.durationSeconds > 0 
          ? (epProgress.progressSeconds / epProgress.durationSeconds) * 100 
          : 0;
        if (progressPercent >= 95) {
          lastCompletedIndex = i; // This episode is completed
          console.log('📺 Episode', episode.name, 'is completed (', progressPercent.toFixed(1), '%)');
        }
      }
    }
    
    // Start from next episode after last completed
    if (lastCompletedIndex >= 0 && lastCompletedIndex < allEpisodes.length - 1) {
      const nextEp = allEpisodes[lastCompletedIndex + 1];
      console.log('📺 Netflix Resume: Starting next episode after completed one (Episode', lastCompletedIndex + 2, ')');
      hasRedirectedRef.current = true;
      navigate(`/watch/${titleId}/${nextEp.id}`, { replace: true });
      return;
    }
    
    // If all episodes are completed, restart from first
    if (lastCompletedIndex === allEpisodes.length - 1) {
      console.log('📺 Netflix Resume: All episodes completed, restarting from first');
      hasRedirectedRef.current = true;
      navigate(`/watch/${titleId}/${firstEpisode.id}`, { replace: true });
      return;
    }
    
    // No progress at all - start from first episode
    console.log('📺 Netflix Resume: No progress found, starting from first episode');
    hasRedirectedRef.current = true;
    navigate(`/watch/${titleId}/${firstEpisode.id}`, { replace: true });
  }, [title, isLoading, isSeries, episodeId, titleId, navigate, getProgress, progress, isProgressLoaded]);

  // Effect 2: Find next episode for series
  useEffect(() => {
    if (!title?.seasons || !episodeId || !isSeries) {
      setNextEpisode(null);
      return;
    }
    
    const allEpisodes = title.seasons.flatMap((s, si) => 
      s.episodes.map((e, ei) => ({ ...e, seasonIndex: si, episodeIndex: ei }))
    );
    const currentIndex = allEpisodes.findIndex(e => e.id === episodeId);
    
    if (currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
      setNextEpisode(allEpisodes[currentIndex + 1]);
    } else {
      setNextEpisode(null);
    }
  }, [title, episodeId, isSeries]);

  // Effect 3: Load saved progress (Netflix-style)
  useEffect(() => {
    if (!titleId || !title) return;
    
    // For SERIES: Check URL parameter first (from redirect with ?t=xxx)
    // This ensures we resume from exact position when navigating from series redirect
    if (isSeries && episodeId) {
      const urlStartTime = searchParams.get('t');
      if (urlStartTime) {
        const startTime = parseFloat(urlStartTime);
        if (!isNaN(startTime) && startTime >= 0) {
          console.log('📺 Series: Resuming from URL parameter:', startTime, 'seconds');
          setSavedProgress(startTime);
          addToContinueWatching(title);
          return;
        }
      }
    }
    
    // For MOVIES: Always fetch from database (no URL params)
    // For SERIES without URL param: Fetch from database
    const epIdForProgress = isMovie ? undefined : episodeId;
    const saved = getProgress(titleId, epIdForProgress);
    
    if (saved && saved.progressSeconds > 0) {
      // Don't resume if almost finished (95%+ watched)
      const progressPercent = (saved.progressSeconds / saved.durationSeconds) * 100;
      if (progressPercent < 95) {
        console.log('🎬 Resuming from saved progress:', Math.floor(saved.progressSeconds), 'seconds (', progressPercent.toFixed(1), '%)');
        setSavedProgress(saved.progressSeconds);
      } else {
        console.log('🎬 Content almost finished, starting from beginning');
        setSavedProgress(0);
      }
    } else {
      console.log('🎬 No saved progress, starting from beginning');
      setSavedProgress(0);
    }
    
    addToContinueWatching(title);
  }, [titleId, episodeId, title, isMovie, isSeries, getProgress, addToContinueWatching, searchParams]);

  // Effect 4: Save progress on page exit
  useEffect(() => {
    if (!titleId || !title) return;

    let videoElementRef: HTMLVideoElement | null = null;
    
    const updateVideoRef = () => {
      videoElementRef = document.querySelector('video');
    };
    
    const checkInterval = setInterval(updateVideoRef, 500);
    updateVideoRef();

    const saveProgressOnExit = () => {
      const video = videoElementRef || document.querySelector('video');
      if (video && video.currentTime > 0 && video.duration > 0) {
        const epId = isMovie ? undefined : episodeId;
        console.log('?? Saving progress on exit:', { 
          titleId, 
          episodeId: epId, 
          currentTime: video.currentTime, 
          duration: video.duration,
          type: isMovie ? 'movie' : 'series'
        });
        updateProgress(titleId, video.currentTime, video.duration, epId, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) saveProgressOnExit();
    };

    const handleBeforeUnload = () => saveProgressOnExit();
    const handlePageHide = () => saveProgressOnExit();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(checkInterval);
      saveProgressOnExit();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [titleId, episodeId, title, isMovie, updateProgress]);

  // Effect 5: Debug logging
  useEffect(() => {
    if (!title) return;
    
    console.group('?? Watch Page Debug');
    console.log('Title ID:', titleId);
    console.log('Title Name:', title.name);
    console.log('Title Type:', title.type);
    console.log('Is Movie:', isMovie);
    console.log('Is Series:', isSeries);
    
    if (isMovie) {
      console.log('?? MOVIE MODE');
      console.log('Video URL:', videoUrl);
      console.log('Has Video URL:', hasVideoUrl);
    } else if (isSeries) {
      console.log('?? SERIES MODE');
      console.log('Episode ID:', episodeId);
      console.log('Current Episode:', currentEpisode);
      console.log('Current Season:', currentSeason);
      console.log('Episode Video URL:', videoUrl);
      console.log('Has Video URL:', hasVideoUrl);
    }
    
    console.log('Saved Progress:', savedProgress);
    console.groupEnd();
  }, [title, titleId, isMovie, isSeries, episodeId, currentEpisode, currentSeason, videoUrl, hasVideoUrl, savedProgress]);

  // ============================================
  // 5. RENDER - EARLY RETURNS AFTER ALL HOOKS
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Title not found</h1>
          <Button onClick={() => navigate('/browse')}>Browse All</Button>
        </div>
      </div>
    );
  }

  if (!canWatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <img
            src={title.posterUrl}
            alt={title.name}
            className="w-48 h-72 object-cover rounded-lg mx-auto mb-6 opacity-50"
          />
          <h1 className="text-2xl font-bold mb-2 text-foreground">{title.name}</h1>
          <p className="text-muted-foreground mb-6">
            This is premium content. Upgrade your subscription to watch.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/account?tab=subscription')} className="glow-primary">
              Upgrade to Premium
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!hasVideoUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <h1 className="text-2xl font-bold mb-2 text-foreground">{videoTitle}</h1>
          <p className="text-muted-foreground mb-6">
            {isSeries && currentEpisode
              ? 'This episode does not have a video available yet.'
              : isMovie
              ? 'This movie does not have a video available yet.'
              : 'This content does not have a video available yet.'}
          </p>
          <Button variant="outline" onClick={() => navigate(`/title/${title.id}`)}>
            Go Back to Details
          </Button>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // 6. MAIN RENDER
  // ============================================

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-50 p-2 sm:p-4 bg-gradient-to-b from-black/80 to-transparent"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/title/${title.id}`)}
            className="flex items-center gap-1 sm:gap-2 text-white hover:text-primary transition-colors px-2 py-1 sm:px-0 sm:py-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm sm:text-base">Back to Details</span>
          </button>

          {/* Next Episode button - only for series */}
          {isSeries && nextEpisode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={playNextEpisode}
              className="text-white text-xs sm:text-sm px-2 sm:px-3"
            >
              <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Next Episode</span>
              <span className="xs:hidden">Next</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* Video Player */}
      <div className="flex-1 w-full h-full">
        <VideoPlayerWithAds
          src={getPlayableVideoUrl(videoUrl)}
          poster={title.backdropUrl}
          title={videoTitle}
          onProgress={handleProgress}
          onEnded={handleEnded}
          startTime={savedProgress}
          autoPlay
          videoDuration={currentEpisode?.duration || title.duration || 0}
          userSubscriptionPlan={user?.subscriptionPlan || 'free'}
          userId={user?.id}
          titleId={title.id}
          episode={currentEpisode}
          titleData={title}
        />
      </div>

      {/* Episode List - only for series */}
      {isSeries && title.seasons && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-t border-border p-3 sm:p-4"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">More Episodes</h3>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {title.seasons.flatMap(season =>
              season.episodes.map(episode => (
                <button
                  key={episode.id}
                  onClick={() => navigate(`/watch/${title.id}/${episode.id}`)}
                  className={`flex-shrink-0 w-32 sm:w-40 md:w-48 rounded-md overflow-hidden transition-transform hover:scale-105 ${
                    episode.id === episodeId ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="relative aspect-video">
                    <img
                      src={episode.thumbnailUrl || title.backdropUrl}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 bg-gradient-to-t from-black to-transparent">
                      <p className="text-[10px] sm:text-xs text-white font-medium line-clamp-1">
                        E{episode.episodeNumber}: {episode.name}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Watch;
