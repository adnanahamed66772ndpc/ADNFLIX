import { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  Settings,
  Subtitles,
  Rewind,
  FastForward,
  XCircle,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number, forceImmediate?: boolean) => void;
  onEnded?: () => void;
  startTime?: number;
  autoPlay?: boolean;
  fallbackDuration?: number;
  titleId?: string;
  episodeId?: string;
}

const VideoPlayer = ({
  src,
  poster,
  title,
  onProgress,
  onEnded,
  startTime = 0,
  autoPlay = false,
  fallbackDuration = 0,
  titleId,
  episodeId,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const progressCallbackRef = useRef(onProgress);
  const endedCallbackRef = useRef(onEnded);
  const startTimeRef = useRef(startTime);
  const didApplyStartTimeRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // Keep callback refs updated without triggering re-renders
  useEffect(() => {
    progressCallbackRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    endedCallbackRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  // Update duration when fallback duration prop changes
  useEffect(() => {
    if (fallbackDuration > 0 && duration === 0) {
      setDuration(fallbackDuration);
    }
  }, [fallbackDuration, duration]);

  // Reset seek-to-start tracking when video source changes
  useEffect(() => {
    didApplyStartTimeRef.current = false;
    setIsLoading(true);
    setPlaybackError(null);
    setIsBuffering(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const applyStartTimeOnce = () => {
      if (didApplyStartTimeRef.current) return;
      const t = startTimeRef.current;
      if (t > 0 && Number.isFinite(t)) {
        try {
          // Netflix-style: Resume from exact position
          video.currentTime = t;
          didApplyStartTimeRef.current = true;
          console.log('🎬 Video resumed from position:', t, 'seconds');
        } catch (error) {
          console.warn('Failed to set startTime:', error);
        }
      }
    };

    if (Hls.isSupported() && src.includes('.m3u8')) {
      // HLS streaming - plays in chunks automatically
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Optimize chunk loading for better streaming performance
        maxBufferLength: 30, // Maximum buffer length in seconds
        maxMaxBufferLength: 60, // Maximum max buffer length
        maxBufferSize: 60 * 1000 * 1000, // 60MB max buffer
        maxBufferHole: 0.5, // Max buffer hole in seconds
        highBufferWatchdogPeriod: 2, // Check buffer every 2 seconds
        nudgeOffset: 0.1, // Nudge offset for buffer management
        nudgeMaxRetry: 3, // Max retries for buffer nudging
        fragLoadingTimeOut: 20, // Fragment loading timeout
        manifestLoadingTimeOut: 10, // Manifest loading timeout
        levelLoadingTimeOut: 10, // Level loading timeout
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });
      
      // Apply startTime when video is ready
      const handleLevelLoaded = () => {
        applyStartTimeOnce();
      };
      
      const handleCanPlay = () => {
        applyStartTimeOnce();
        if (autoPlay) {
          video.play().catch(() => {});
        }
      };
      
      hls.on(Hls.Events.LEVEL_LOADED, handleLevelLoaded);
      video.addEventListener('canplay', handleCanPlay, { once: true });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
        }
      });
      
      return () => {
        hls.off(Hls.Events.LEVEL_LOADED, handleLevelLoaded);
        video.removeEventListener('canplay', handleCanPlay);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = src;
      const handleLoaded = () => {
        setIsLoading(false);
        applyStartTimeOnce();
        
        if (autoPlay) {
          video.play().catch(() => {});
        }
      };
      const handleCanPlay = () => {
        applyStartTimeOnce();
      };
      video.addEventListener('loadedmetadata', handleLoaded);
      video.addEventListener('canplay', handleCanPlay, { once: true });
      return () => {
        video.removeEventListener('loadedmetadata', handleLoaded);
        video.removeEventListener('canplay', handleCanPlay);
      };
    } else {
      // Validate video URL before attempting to load
      if (!src || src.trim() === '') {
        setPlaybackError('No video URL provided. Please check the video source.');
        setIsLoading(false);
        return;
      }

      // Check if URL is valid
      try {
        new URL(src);
      } catch (e) {
        // If not a valid URL, it might be a relative path - that's okay
        if (!src.startsWith('/') && !src.startsWith('./')) {
          setPlaybackError(`Invalid video URL: ${src}. Please check the video source.`);
          setIsLoading(false);
          return;
        }
      }

      // Direct video source (MP4, WebM, MKV, AVI, MOV, etc.)
      // Configure for chunked streaming using HTTP range requests
      // Note: Browser support varies by format
      // MP4 and WebM have best support, MKV/AVI/MOV may work depending on codecs
      video.src = src;
      
      // Configure preload for efficient chunked loading
      // 'metadata' loads only metadata, allowing browser to request chunks as needed
      video.preload = 'metadata';
      
      const handleCanPlay = () => {
        applyStartTimeOnce();
        setIsLoading(false);
        setPlaybackError(null); // Clear any previous errors
        
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked, user interaction required
          });
        }
      };
      
      const handleLoadedMetadata = () => {
        // Try to apply startTime when metadata is loaded
        applyStartTimeOnce();
        // Update duration from video element if available
        if (video.duration && video.duration > 0 && isNaN(video.duration) === false) {
          setDuration(video.duration);
        }
      };
      
      const handleLoadedData = () => {
        // Also try when data is loaded
        applyStartTimeOnce();
        // Update duration if not already set
        if (video.duration && video.duration > 0 && duration === 0) {
          setDuration(video.duration);
        }
      };
      
      const handleCanPlayThrough = () => {
        // Video is fully ready
        setPlaybackError(null); // Clear any previous errors
      };
      
      const handleLoadStart = () => {
        setIsLoading(true);
        setPlaybackError(null); // Clear previous errors when starting to load
      };
      
      const handleError = (e: Event) => {
        const video = videoRef.current;
        if (video) {
          const error = video.error;
          if (error) {
            // Detect file format from source URL
            const isMKV = src.toLowerCase().includes('.mkv');
            const isMP4 = src.toLowerCase().includes('.mp4');
            const isWebM = src.toLowerCase().includes('.webm');
            const isAVI = src.toLowerCase().includes('.avi');
            const isMOV = src.toLowerCase().includes('.mov');
            
            // Get file extension for better error messages
            const urlParts = src.split('.');
            const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : 'unknown';
            
            let errorMessage = 'Video playback error';
            let detailedMessage = '';
            
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMessage = 'Video loading was aborted';
                detailedMessage = 'The video loading was interrupted. Please try again.';
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error while loading video';
                detailedMessage = `Unable to load video from: ${src}. Please check your internet connection and verify the video URL is accessible.`;
                break;
              case error.MEDIA_ERR_DECODE:
                if (isMKV) {
                  errorMessage = 'MKV format not fully supported';
                  detailedMessage = 'This browser has limited support for MKV files. For best compatibility, please use MP4 format (H.264 codec).';
                } else if (isAVI || isMOV) {
                  errorMessage = 'Video codec not supported';
                  detailedMessage = `${extension.toUpperCase()} format may not be fully supported by this browser. Please convert the video to MP4 format (H.264 codec) for maximum compatibility.`;
                } else {
                  errorMessage = 'Video format not supported';
                  detailedMessage = `The video codec (${extension.toUpperCase()}) is not supported by this browser. Please ensure videos are in MP4 format with H.264 codec for maximum compatibility.`;
                }
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                if (isMKV) {
                  errorMessage = 'MKV format not supported by browser';
                  detailedMessage = 'MKV files have limited browser support. Chrome/Edge may support MKV with H.264 codec, but Safari and some browsers do not. For best compatibility across all browsers, please use MP4 format (H.264 codec).';
                } else if (!isMP4 && !isWebM) {
                  errorMessage = 'Video format not supported';
                  detailedMessage = `${extension.toUpperCase()} format is not supported by this browser. Please use MP4 format (H.264 codec) for maximum compatibility.`;
                } else {
                  errorMessage = 'Video format not supported';
                  detailedMessage = `This video format (${extension.toUpperCase()}) is not supported by your browser. The video may be corrupted, inaccessible, or the codec is not supported. Please use MP4 format (H.264 codec) for maximum compatibility. Video URL: ${src}`;
                }
                break;
              default:
                errorMessage = 'Video playback error';
                detailedMessage = `An error occurred while playing the video (Error code: ${error.code}). Please verify the video URL is correct and accessible: ${src}. If the problem persists, try refreshing the page or contact support.`;
            }
            
            console.error('Video error details:', {
              errorCode: error.code,
              errorMessage,
              videoSrc: src,
              videoError: error,
              canPlayType: {
                'video/mp4': video.canPlayType('video/mp4'),
                'video/webm': video.canPlayType('video/webm'),
                'video/x-matroska': video.canPlayType('video/x-matroska'),
              }
            });
            setPlaybackError(detailedMessage || errorMessage);
          } else {
            // No error object but error event fired - might be URL issue
            console.error('Video error event without error object. Video src:', src);
            setPlaybackError(`Unable to load video from: ${src}. Please verify the video URL is correct and accessible.`);
          }
        }
        setIsLoading(false);
        setIsBuffering(false);
      };
      
      // Monitor progress events to verify chunked loading
      const handleProgress = () => {
        // Progress tracking for chunked loading
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('error', handleError);
      video.addEventListener('progress', handleProgress);
      
      // Trigger load
      video.load();
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('error', handleError);
        video.removeEventListener('progress', handleProgress);
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // Initialize video volume and muted state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Ensure video is not muted and volume is set
    video.muted = false;
    video.volume = volume;
  }, [volume]);

  // Save video position every 2 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const savePosition = () => {
      if (video.duration && video.currentTime > 0) {
        // Create a unique key for this video
        const videoKey = titleId 
          ? `video_progress_${titleId}_${episodeId || 'movie'}`
          : `video_progress_${src}`;
        
        // Save to localStorage
        try {
          localStorage.setItem(videoKey, JSON.stringify({
            position: video.currentTime,
            duration: video.duration,
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.warn('Failed to save video position to localStorage:', error);
        }
      }
    };

    // Netflix-style: Save position every 1 second for high-write volume
    // This ensures seamless resume even if user closes browser/tab
    const interval = setInterval(() => {
      if (video.currentTime > 0 && video.duration > 0) {
        savePosition();
      }
    }, 1000);

    // Netflix-style: Save on all meaningful events for high-write volume
    // This ensures progress is saved even when user goes back/forward, pauses, or plays
    const handlePlay = () => {
      // Save when user starts playing (immediate progress tracking)
      if (video.currentTime > 0 && video.duration > 0) {
        savePosition();
      }
    };
    const handleSeeking = () => {
      // Netflix-style: Save when user starts seeking (going back/forward)
      // Immediately save progress without waiting for throttle
      if (video.currentTime > 0 && video.duration > 0) {
        savePosition();
        // Also trigger progress callback immediately with forceImmediate flag (bypasses throttle)
        progressCallbackRef.current?.(video.currentTime, video.duration, true);
      }
    };
    const handleSeeked = () => {
      // Netflix-style: Save when seek completes (user finished going back/forward)
      // This is the final position after seek - save immediately
      // Netflix uses I-frame alignment, but for simplicity we save exact position
      if (video.currentTime > 0 && video.duration > 0) {
        savePosition();
        // Trigger progress callback with final seek position and forceImmediate flag (bypasses throttle)
        progressCallbackRef.current?.(video.currentTime, video.duration, true);
      }
    };
    
    // Netflix-style: Save on pause (key event)
    const handlePauseEvent = () => {
      if (video.currentTime > 0 && video.duration > 0) {
        savePosition();
        // Save immediately on pause (key event)
        progressCallbackRef.current?.(video.currentTime, video.duration, true);
      }
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePauseEvent);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      clearInterval(interval);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePauseEvent);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [src, titleId, episodeId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastUpdateTime = 0;

    const showBuffering = () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
      // Only show spinner if buffering lasts a moment (prevents flicker)
      bufferingTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
        setIsBuffering(true);
      }, 200);
    };

    const hideBuffering = () => {
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = undefined;
      }
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleTimeUpdate = () => {
      const now = performance.now();
      // Throttle state updates to every 250ms to prevent flickering
      if (now - lastUpdateTime > 250) {
        setCurrentTime(video.currentTime);
        // Netflix-style: Call progress callback on every timeupdate
        // The callback itself will throttle to 1 second for database writes
        progressCallbackRef.current?.(video.currentTime, video.duration);
        lastUpdateTime = now;
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      hideBuffering();
      setIsPlaying(false);
      // Netflix-style: Save progress immediately on video ended (key event)
      if (video.currentTime > 0 && video.duration > 0) {
        savePosition();
        // Save immediately on ended - bypasses throttle
        progressCallbackRef.current?.(video.currentTime, video.duration, true);
      }
      endedCallbackRef.current?.();
    };

    const handleWaiting = () => showBuffering();
    const handlePlaying = () => {
      hideBuffering();
      setIsPlaying(true);
    };
    const handlePause = () => {
      hideBuffering();
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);

      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = undefined;
      }
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = value[0];
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    video.currentTime = newTime;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };


  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
      onTouchEnd={() => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        poster={poster}
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
        preload="metadata"
        controls={false}
        muted={false}
        // Optimize for chunked streaming
        // Browser will automatically use HTTP range requests for chunked loading
      />

      {/* Loading Spinner */}
      {isLoading && !playbackError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            {isBuffering && (
              <p className="text-sm text-white/80">Buffering...</p>
            )}
          </div>
        </div>
      )}

      {/* Error Message Overlay */}
      {playbackError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="max-w-md mx-4 p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Playback Error</h3>
                <p className="text-sm text-white/80 mb-4">{playbackError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPlaybackError(null);
                      const video = videoRef.current;
                      if (video) {
                        video.load();
                      }
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setPlaybackError(null)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center Play Button (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 flex items-center justify-center bg-primary/90 rounded-full hover:bg-primary transition-colors">
            <Play className="w-10 h-10 text-primary-foreground fill-current ml-1" />
          </div>
        </button>
      )}

      {/* Controls Overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={`absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/40 ${
          showControls ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Top Bar - only show if no external navigation */}
        <div className="flex items-center justify-end p-2 sm:p-4 pt-12 sm:pt-16" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center gap-1 sm:gap-2" style={{ pointerEvents: 'auto' }}>
            <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-md transition-colors">
              <Subtitles className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-md transition-colors">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-white/80 w-10 sm:w-12">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs sm:text-sm text-white/80 w-10 sm:w-12 text-right">{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-md transition-colors touch-manipulation"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                )}
              </button>

              {/* Skip Buttons */}
              <button
                onClick={() => skip(-10)}
                className="p-2 hover:bg-white/10 rounded-md transition-colors hidden sm:block"
              >
                <Rewind className="w-5 h-5" />
              </button>
              <button
                onClick={() => skip(10)}
                className="p-2 hover:bg-white/10 rounded-md transition-colors hidden sm:block"
              >
                <FastForward className="w-5 h-5" />
              </button>

              {/* Next Episode */}
              <button className="p-2 hover:bg-white/10 rounded-md transition-colors hidden sm:block">
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 sm:gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-md transition-colors touch-manipulation"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-md transition-colors touch-manipulation"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoPlayer;
