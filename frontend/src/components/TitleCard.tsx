import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Check, Star, Crown, Clock, X } from 'lucide-react';
import { Title } from '@/hooks/useTitles';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useToast } from '@/hooks/use-toast';

interface TitleCardProps {
  title: Title;
  index?: number;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

const TitleCard = ({ title, index = 0, size = 'medium', showProgress = false }: TitleCardProps) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { getProgressPercentage, getProgress, removeFromContinueWatching } = usePlaybackProgress();
  const { toast } = useToast();
  const inWatchlist = isInWatchlist(title.id);
  const navigate = useNavigate();

  // Get progress for this title
  // For series, we need to check if there's progress on any episode
  // For movies, check progress on the title itself
  let progressPercent = 0;
  let progress = undefined;
  
  try {
    if (title.type === 'series' && title.seasons) {
      // For series, find the most recent episode progress
      const allEpisodes = title.seasons.flatMap(s => s.episodes);
      let latestProgress: ReturnType<typeof getProgress> = undefined;
      let latestPercent = 0;
      
      for (const episode of allEpisodes) {
        const epProgress = getProgress(title.id, episode.id);
        if (epProgress) {
          const epPercent = getProgressPercentage(title.id, episode.id);
          if (epPercent > latestPercent) {
            latestPercent = epPercent;
            latestProgress = epProgress;
          }
        }
      }
      
      progressPercent = latestPercent;
      progress = latestProgress;
    } else {
      // For movies, get progress directly
      progressPercent = getProgressPercentage(title.id);
      progress = getProgress(title.id);
    }
  } catch (error) {
    console.error('Error getting progress:', error);
    progressPercent = 0;
    progress = undefined;
  }
  
  const hasProgress = progressPercent > 0 && progressPercent < 95;

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(title.id);
    } else {
      addToWatchlist(title.id);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Netflix-style: Resume from saved position if available
    if (hasProgress && progress) {
      try {
        if (title.type === 'series' && title.seasons) {
          // For series, find the episode with progress
          const allEpisodes = title.seasons.flatMap(s => s.episodes);
          const episodeWithProgress = allEpisodes.find(ep => {
            const epProgress = getProgress(title.id, ep.id);
            return epProgress && epProgress.progressSeconds > 0;
          });
          
          if (episodeWithProgress) {
            const epProgress = getProgress(title.id, episodeWithProgress.id);
            if (epProgress) {
              navigate(`/watch/${title.id}/${episodeWithProgress.id}?t=${Math.floor(epProgress.progressSeconds)}`);
              return;
            }
          }
        } else {
          // For movies, resume from saved position
          navigate(`/watch/${title.id}?t=${Math.floor(progress.progressSeconds)}`);
          return;
        }
      } catch (error) {
        console.error('Error navigating to resume position:', error);
      }
    }
    
    // No progress, start from beginning
    navigate(`/watch/${title.id}`);
  };

  const handleRemoveFromContinueWatching = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (removeFromContinueWatching) {
        const success = await removeFromContinueWatching(title.id);
        if (success) {
          toast({
            title: "Removed from Continue Watching",
            description: `${title.name} has been removed from your Continue Watching list.`,
          });
        }
      }
    } catch (error) {
      console.error('Error removing from continue watching:', error);
    }
  };

  const sizeClasses = {
    small: 'w-28 xs:w-32 sm:w-36',
    medium: 'w-32 xs:w-40 sm:w-48',
    large: 'w-40 xs:w-48 sm:w-56 md:w-64',
  };

  const aspectClasses = {
    small: 'aspect-[2/3]',
    medium: 'aspect-[2/3]',
    large: 'aspect-[2/3]',
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`${sizeClasses[size]} flex-shrink-0 group`}
    >
      <Link to={`/title/${title.id}`}>
        <div className={`relative ${aspectClasses[size]} rounded-lg overflow-hidden poster-card bg-elevated`}>
          {/* Poster Image */}
          <img
            src={title.posterUrl}
            alt={title.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Premium Badge */}
          {title.premium && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-semibold px-2 py-0.5 rounded">
              <Crown className="w-3 h-3" />
              <span>PREMIUM</span>
            </div>
          )}

          {/* Rating Badge */}
          {title.rating > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{title.rating}</span>
            </div>
          )}

          {/* Progress Bar (for continue watching) */}
          {(showProgress || hasProgress) && hasProgress && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="h-1 bg-black/50">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {progress && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(progress.durationSeconds - progress.progressSeconds)}
                </div>
              )}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {/* Action Buttons */}
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={handlePlayClick}
                  className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-medium text-sm transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {hasProgress ? 'Resume' : 'Play'}
                </button>
                <button
                  onClick={handleWatchlistClick}
                  className={`p-2 rounded-md border transition-colors ${
                    inWatchlist
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-black/50 border-white/30 text-white hover:border-white'
                  }`}
                >
                  {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
                {/* Netflix-style: Remove from Continue Watching button (only show if has progress) */}
                {hasProgress && showProgress && (
                  <button
                    onClick={handleRemoveFromContinueWatching}
                    className="p-2 rounded-md bg-black/50 border border-white/30 text-white hover:bg-black/70 transition-colors"
                    title="Remove from Continue Watching"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Title Info */}
              <p className="text-white font-medium text-sm line-clamp-1">{title.name}</p>
              <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                <span>{title.year}</span>
                <span>•</span>
                <span>{title.type === 'movie' ? `${title.duration}m` : 'Series'}</span>
                <span>•</span>
                <span className="border border-white/30 px-1 rounded text-[10px]">{title.maturity}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Title below card (mobile) */}
      <p className="mt-3 text-sm font-medium text-foreground/90 line-clamp-1 group-hover:text-primary transition-colors md:hidden">
        {title.name}
      </p>
    </motion.div>
  );
};

export default TitleCard;
