import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Hls from 'hls.js';
import { VASTAd, selectBestMediaFile } from '@/lib/vastParser';
import { createAdTracker, formatPlayhead } from '@/lib/adTracking';

interface AdPlayerProps {
  // Custom ad props
  videoUrl?: string;
  clickUrl?: string | null;
  // VAST ad props
  vastAd?: VASTAd;
  // Common props
  skipAfterSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
  onClick?: () => void;
  adNumber?: number;
  totalAds?: number;
}

export const AdPlayer = ({
  videoUrl,
  clickUrl,
  vastAd,
  skipAfterSeconds,
  onComplete,
  onSkip,
  onClick,
  adNumber = 1,
  totalAds = 1,
}: AdPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine effective video URL and click URL (from props or VAST)
  const effectiveVideoUrl = useMemo(() => {
    if (vastAd) {
      const mediaFile = selectBestMediaFile(vastAd.mediaFiles);
      return mediaFile?.url || '';
    }
    return videoUrl || '';
  }, [vastAd, videoUrl]);

  const effectiveClickUrl = useMemo(() => {
    if (vastAd?.clickThrough) {
      return vastAd.clickThrough;
    }
    return clickUrl;
  }, [vastAd, clickUrl]);

  // Skip offset from VAST or props
  const effectiveSkipOffset = useMemo(() => {
    if (vastAd?.skipOffset !== undefined) {
      return vastAd.skipOffset;
    }
    return skipAfterSeconds;
  }, [vastAd, skipAfterSeconds]);

  // Create VAST tracker if we have a VAST ad
  const tracker = useMemo(() => {
    if (vastAd) {
      return createAdTracker(vastAd.trackingEvents);
    }
    return null;
  }, [vastAd]);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Load video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveVideoUrl) return;

    // Cleanup previous HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && effectiveVideoUrl.includes('.m3u8')) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(effectiveVideoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = effectiveVideoUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
    } else {
      video.src = effectiveVideoUrl;
      video.addEventListener('canplay', () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
      video.load();
    }

    // Fire VAST impression when video loads
    if (tracker) {
      tracker.fireImpression();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveVideoUrl, tracker]);

  // Handle time updates and VAST tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hasFiredStart = false;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      if (time >= effectiveSkipOffset) {
        setCanSkip(true);
      }

      // Fire VAST tracking events
      if (tracker && duration > 0) {
        if (!hasFiredStart && time > 0) {
          tracker.fireStart({ CONTENTPLAYHEAD: formatPlayhead(time) });
          hasFiredStart = true;
        }
        
        const progressPercent = (time / duration) * 100;
        tracker.fireQuartile(progressPercent, { CONTENTPLAYHEAD: formatPlayhead(time) });
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      if (tracker) {
        tracker.fireComplete({ CONTENTPLAYHEAD: formatPlayhead(video.duration) });
      }
      onComplete();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [effectiveSkipOffset, onComplete, tracker, duration]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleAdClick = useCallback(() => {
    if (effectiveClickUrl) {
      // Fire VAST click tracking
      if (tracker) {
        tracker.fireClick({ CONTENTPLAYHEAD: formatPlayhead(currentTime) });
      }
      window.open(effectiveClickUrl, '_blank', 'noopener,noreferrer');
      onClick?.();
    }
  }, [effectiveClickUrl, onClick, tracker, currentTime]);

  const handleSkip = useCallback(() => {
    if (tracker) {
      tracker.fireSkip({ CONTENTPLAYHEAD: formatPlayhead(currentTime) });
    }
    onSkip();
  }, [onSkip, tracker, currentTime]);

  const skipRemaining = Math.max(0, Math.ceil(skipAfterSeconds - currentTime));
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Ad Video */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          playsInline
          onClick={handleAdClick}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Ad Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded">
            Ad {adNumber}/{totalAds}
          </span>
          {effectiveClickUrl && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 text-xs"
              onClick={handleAdClick}
            >
              <ExternalLink className="w-3 h-3" />
              Learn More
            </Button>
          )}
        </div>

        {/* Skip Button / Countdown */}
        <div className="absolute bottom-20 right-4">
          <AnimatePresence mode="wait">
            {canSkip ? (
              <motion.div
                key="skip"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button
                  onClick={handleSkip}
                  className="bg-white text-black hover:bg-gray-200 font-semibold px-6"
                >
                  Skip Ad →
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 bg-black/80 text-white rounded text-sm"
              >
                Skip in {Math.max(0, Math.ceil(effectiveSkipOffset - currentTime))}s
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Volume Toggle */}
        <button
          onClick={toggleMute}
          className="absolute bottom-20 left-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-yellow-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default AdPlayer;
