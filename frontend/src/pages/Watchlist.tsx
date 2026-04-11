import { useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Trash2, Play, Clock, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FilterBar from '@/components/FilterBar';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTitlesContext, Title } from '@/contexts/TitlesContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { Button } from '@/components/ui/button';
import TitleCard from '@/components/TitleCard';

const Watchlist = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { getTitleById, searchTitles } = useTitlesContext();
  const { items, isLoading: watchlistLoading, removeFromWatchlist } = useWatchlist();
  const { getContinueWatchingTitles, getProgressPercentage, getProgress } = usePlaybackProgress();
  const navigate = useNavigate();

  // Map watchlist items to titles using TitlesContext
  const allWatchlistTitles: Title[] = items
    .map(item => getTitleById(item.titleId))
    .filter((t): t is Title => t !== undefined);
  const continueWatchingTitles = getContinueWatchingTitles();

  // Filter states from URL params
  const searchQuery = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || 'all';
  const genreFilter = searchParams.get('genre') || 'all';
  const yearFilter = searchParams.get('year') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  // Filter and sort watchlist titles
  const watchlistTitles = useMemo(() => {
    let result = [...allWatchlistTitles];

    // Search filter
    if (searchQuery) {
      result = searchTitles(searchQuery).filter(t => 
        allWatchlistTitles.some(wt => wt.id === t.id)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Genre filter
    if (genreFilter !== 'all') {
      result = result.filter(t => 
        t.genres.some(g => g.toLowerCase() === genreFilter.toLowerCase())
      );
    }

    // Year filter
    if (yearFilter !== 'all') {
      result = result.filter(t => (t.year || t.release_year)?.toString() === yearFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [allWatchlistTitles, searchQuery, typeFilter, genreFilter, yearFilter, sortBy, searchTitles]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your Watchlist</h1>
            <p className="text-muted-foreground mb-6">Save movies and shows to watch later</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m left`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m left`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Continue Watching Section */}
          {continueWatchingTitles.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Continue Watching</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {continueWatchingTitles.map((title, index) => {
                  const progress = getProgress(title.id);
                  const progressPercent = getProgressPercentage(title.id);
                  
                  return (
                    <motion.div
                      key={title.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-lg overflow-hidden group hover:ring-2 hover:ring-primary transition-all"
                    >
                      <Link to={`/watch/${title.id}`}>
                        <div className="relative aspect-video">
                          <img
                            src={title.backdropUrl}
                            alt={title.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                              <Play className="w-6 h-6 fill-current ml-1" />
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <h3 className="font-semibold line-clamp-1">{title.name}</h3>
                        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                          <span>{Math.round(progressPercent)}% watched</span>
                          {progress && (
                            <span>{formatTimeLeft(progress.durationSeconds - progress.progressSeconds)}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Watchlist Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bookmark className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">My Watchlist</h2>
                <span className="text-muted-foreground">({watchlistTitles.length} of {allWatchlistTitles.length} titles)</span>
              </div>
            </div>

            {/* Filter Bar */}
            {allWatchlistTitles.length > 0 && (
              <FilterBar titles={allWatchlistTitles} />
            )}

            {watchlistLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : watchlistTitles.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Browse our catalog and add titles to watch later
                </p>
                <Button onClick={() => navigate('/browse')}>Browse Titles</Button>
              </div>
            ) : watchlistTitles.length === 0 && (searchQuery || typeFilter !== 'all' || genreFilter !== 'all' || yearFilter !== 'all') ? (
              <div className="text-center py-16 bg-card rounded-lg">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No titles match your filters</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchlistTitles.map((title, index) => (
                  <div key={title.id} className="relative group">
                    <TitleCard title={title} index={index} size="medium" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWatchlist(title.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-2 bg-black/70 hover:bg-destructive/80 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Watchlist;
