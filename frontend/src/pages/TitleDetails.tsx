import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Calendar,
  Globe,
  Crown,
  Share2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TitleRow from '@/components/TitleRow';
import { useTitlesContext } from '@/contexts/TitlesContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TitleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { titles, isLoading, getTitleById } = useTitlesContext();
  const title = getTitleById(id || '');
  const [expandedSynopsis, setExpandedSynopsis] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { user, isAuthenticated } = useAuthContext();
  const { addToContinueWatching, getProgress, getProgressPercentage } = usePlaybackProgress();

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
          <h1 className="text-2xl font-bold mb-4">Title not found</h1>
          <Button onClick={() => navigate('/browse')}>Browse All</Button>
        </div>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(title.id);
  const canWatch = !title.premium || (user?.subscriptionPlan !== 'free');
  
  // Get watch progress for this title
  let watchProgress = null;
  let progressPercent = 0;
  let hasProgress = false;
  let resumeEpisode: any = null;
  let resumeEpisodeName = '';
  
  if (title.type === 'movie') {
    // Netflix-style: Get progress for movies
    watchProgress = getProgress(title.id);
    progressPercent = getProgressPercentage(title.id);
    // Has progress if watched more than 5% and less than 95% (not completed)
    hasProgress = progressPercent >= 5 && progressPercent < 95;
  } else if (title.type === 'series' && title.seasons) {
    // Netflix-style: Find the episode to resume
    const allEpisodes = title.seasons.flatMap((s, si) => 
      s.episodes.map(e => ({ ...e, seasonNumber: s.seasonNumber || si + 1 }))
    );
    
    let latestInProgressEpisode = null;
    let latestInProgressData = null;
    let latestUpdateTime = 0;
    let lastCompletedIndex = -1;
    
    // Find most recently watched in-progress episode OR last completed episode
    for (let i = 0; i < allEpisodes.length; i++) {
      const episode = allEpisodes[i];
      const epProgress = getProgress(title.id, episode.id);
      
      if (epProgress) {
        const epPercent = epProgress.durationSeconds > 0 
          ? (epProgress.progressSeconds / epProgress.durationSeconds) * 100 
          : 0;
        const updateTime = new Date(epProgress.updatedAt).getTime();
        
        if (epPercent >= 95) {
          // Episode completed
          lastCompletedIndex = i;
        } else if (epPercent >= 5) {
          // Episode in progress - prefer most recent
          if (!latestInProgressData || updateTime > latestUpdateTime) {
            latestUpdateTime = updateTime;
            latestInProgressEpisode = episode;
            latestInProgressData = epProgress;
          }
        }
      }
    }
    
    // Determine resume episode
    if (latestInProgressEpisode && latestInProgressData) {
      // Resume in-progress episode
      watchProgress = latestInProgressData;
      progressPercent = watchProgress.durationSeconds > 0 
        ? (watchProgress.progressSeconds / watchProgress.durationSeconds) * 100 
        : 0;
      hasProgress = true;
      resumeEpisode = latestInProgressEpisode;
      resumeEpisodeName = `S${latestInProgressEpisode.seasonNumber}E${latestInProgressEpisode.episodeNumber}: ${latestInProgressEpisode.name}`;
    } else if (lastCompletedIndex >= 0 && lastCompletedIndex < allEpisodes.length - 1) {
      // Next episode after last completed
      resumeEpisode = allEpisodes[lastCompletedIndex + 1];
      resumeEpisodeName = `S${resumeEpisode.seasonNumber}E${resumeEpisode.episodeNumber}: ${resumeEpisode.name}`;
      hasProgress = false; // No progress on this episode yet
    }
  }
  
  // Get related titles (same genre)
  const relatedTitles = titles
    .filter(t => t.id !== title.id && t.genres.some(g => title.genres.includes(g)))
    .slice(0, 10);

  const handlePlay = () => {
    if (!canWatch && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!canWatch) {
      navigate('/account?tab=subscription');
      return;
    }
    // Add to continue watching when play is clicked
    addToContinueWatching(title);
    
    if (title.type === 'movie') {
      // Netflix-style: For movies - navigate without URL parameter
      // Watch.tsx will fetch the latest progress from database
      // This ensures we always resume from the most recent position
      navigate(`/watch/${title.id}`);
    } else if (title.type === 'series') {
      // Netflix-style: For series - navigate to the series watch page
      // Watch.tsx will automatically redirect to the correct episode with latest progress
      navigate(`/watch/${title.id}`);
    } else {
      navigate(`/watch/${title.id}`);
    }
  };

  const handleWatchlistClick = () => {
    if (inWatchlist) {
      removeFromWatchlist(title.id);
    } else {
      addToWatchlist(title.id);
    }
  };

  const currentSeason = title.seasons?.find(s => s.seasonNumber === selectedSeason);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh]">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src={title.backdropUrl}
            alt={title.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-32 pb-8 sm:pb-12 md:pb-16 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          {/* Poster - Show on mobile too but smaller */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-32 sm:w-40 md:w-48 lg:w-64 flex-shrink-0 mx-auto lg:mx-0"
          >
            <img
              src={title.posterUrl}
              alt={title.name}
              className="w-full rounded-lg shadow-poster"
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 max-w-2xl"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {title.premium ? (
                <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold px-3 py-1 rounded">
                  <Crown className="w-3.5 h-3.5" />
                  PREMIUM
                </span>
              ) : null}
              {(() => {
                const rating = Number(title.rating);
                return rating > 0 ? (
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {title.rating}
                  </span>
                ) : null;
              })()}
              <span className="text-sm text-muted-foreground capitalize">{title.type}</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl mb-3 sm:mb-4">{title.name}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {title.year}
              </span>
              {title.duration ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(title.duration / 60)}h {title.duration % 60}m
                </span>
              ) : null}
              {title.type === 'series' && title.seasons && title.seasons.length > 0 ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {title.seasons.length} Season{title.seasons.length > 1 ? 's' : ''}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {title.language}
              </span>
              <span className="border border-muted-foreground/30 px-2 py-0.5 rounded text-xs">
                {title.maturity}
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {title.genres.map((genre) => (
                <Link
                  key={genre}
                  to={`/browse?genre=${genre.toLowerCase()}`}
                  className="bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full text-sm transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            {/* Synopsis */}
            <div className="mb-6">
              <p className={`text-foreground/80 leading-relaxed ${!expandedSynopsis ? 'line-clamp-3' : ''}`}>
                {title.synopsis}
              </p>
              {title.synopsis && title.synopsis.length > 200 ? (
                <button
                  onClick={() => setExpandedSynopsis(!expandedSynopsis)}
                  className="flex items-center gap-1 text-primary text-sm mt-2 hover:underline"
                >
                  {expandedSynopsis ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Read more
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {/* Cast & Crew */}
            {title.cast && title.cast.length > 0 ? (
              <div className="mb-8">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground">Cast:</span> {title.cast.join(', ')}
                </p>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full">
              <Button
                size="lg"
                onClick={handlePlay}
                className="text-sm sm:text-base font-semibold px-6 sm:px-8 glow-primary flex-1 sm:flex-none"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
                <span className="hidden xs:inline">{canWatch ? (hasProgress ? 'Resume' : 'Play Now') : 'Upgrade to Watch'}</span>
                <span className="xs:hidden">{canWatch ? (hasProgress ? 'Resume' : 'Play') : 'Upgrade'}</span>
              </Button>
              
              {/* Progress Indicator */}
              {(hasProgress || resumeEpisodeName) && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground px-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {title.type === 'series' && resumeEpisodeName ? (
                      // Series: Show episode info
                      <>
                        {hasProgress && watchProgress ? (
                          <>
                            {resumeEpisodeName} - {Math.floor(progressPercent)}%
                            <span className="hidden sm:inline ml-1">
                              ({Math.floor(watchProgress.progressSeconds / 60)}m left)
                            </span>
                          </>
                        ) : (
                          <>Next: {resumeEpisodeName}</>
                        )}
                      </>
                    ) : (
                      // Movie: Show progress
                      <>
                        {Math.floor(progressPercent)}% watched
                        {watchProgress && watchProgress.progressSeconds > 0 && (
                          <span className="hidden sm:inline ml-1">
                            ({Math.floor(watchProgress.progressSeconds / 60)}m / {Math.floor((watchProgress.durationSeconds || 0) / 60)}m)
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              )}
              
              <div className="flex gap-2 sm:gap-3 flex-1 sm:flex-none">
                {title.trailerUrl ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => window.open(title.trailerUrl, '_blank')}
                    className="text-sm sm:text-base font-semibold px-4 sm:px-6 flex-1 sm:flex-none"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Trailer</span>
                    <span className="sm:hidden">Trailer</span>
                  </Button>
                ) : null}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleWatchlistClick}
                  className={`flex-1 sm:flex-none ${inWatchlist ? 'border-primary text-primary' : ''}`}
                >
                  {inWatchlist ? (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden sm:inline">In Watchlist</span>
                      <span className="sm:hidden">Saved</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden sm:inline">Watchlist</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </Button>

                <Button size="lg" variant="ghost" className="px-3 sm:px-4">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {/* Premium Notice */}
            {title.premium && !canWatch ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-400/10 border border-amber-500/30 rounded-lg"
              >
                <p className="text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>
                    This is premium content.{' '}
                    <Link to="/account?tab=subscription" className="text-primary hover:underline font-medium">
                      Upgrade your plan
                    </Link>{' '}
                    to watch.
                  </span>
                </p>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </div>

      {/* Seasons & Episodes (for series) */}
      {title.type === 'series' && title.seasons && title.seasons.length > 0 ? (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Tabs defaultValue={`season-${selectedSeason}`} className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold">Episodes</h2>
              <TabsList className="bg-secondary w-full sm:w-auto overflow-x-auto">
                {title.seasons.map((season) => (
                  <TabsTrigger
                    key={season.id}
                    value={`season-${season.seasonNumber}`}
                    onClick={() => setSelectedSeason(season.seasonNumber)}
                    className="text-xs sm:text-sm"
                  >
                    Season {season.seasonNumber}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {title.seasons.map((season) => (
              <TabsContent key={season.id} value={`season-${season.seasonNumber}`}>
                <div className="grid gap-4">
                  {season.episodes.map((episode) => {
                    const episodeProgress = getProgress(title.id, episode.id);
                    const episodeProgressPercent = getProgressPercentage(title.id, episode.id);
                    const hasEpisodeProgress = episodeProgressPercent > 0 && episodeProgressPercent < 95;
                    
                    return (
                      <motion.div
                        key={episode.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-4 bg-card rounded-lg overflow-hidden hover:bg-card/80 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full md:w-48 aspect-video md:aspect-auto md:h-28 flex-shrink-0">
                          <img
                            src={episode.thumbnailUrl}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Progress Bar Overlay */}
                          {hasEpisodeProgress && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${episodeProgressPercent}%` }}
                              />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => {
                                if (hasEpisodeProgress && episodeProgress) {
                                  navigate(`/watch/${title.id}/${episode.id}?t=${Math.floor(episodeProgress.progressSeconds)}`);
                                } else {
                                  navigate(`/watch/${title.id}/${episode.id}`);
                                }
                              }}
                              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>

                      {/* Episode Info */}
                      <div className="flex-1 p-3 sm:p-4 md:py-2">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-sm sm:text-base truncate">
                                {episode.episodeNumber}. {episode.name}
                              </h3>
                              {hasEpisodeProgress && (
                                <span className="text-xs text-primary flex items-center gap-1 flex-shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {Math.floor(episodeProgressPercent)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">{episode.duration}m</span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {episode.synopsis}
                        </p>
                      </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      ) : null}

      {/* Related Titles */}
      {relatedTitles.length > 0 ? (
        <div className="container mx-auto px-4 py-8">
          <TitleRow title="More Like This" titles={relatedTitles} />
        </div>
      ) : null}

      <Footer />
    </div>
  );
};

export default TitleDetails;
