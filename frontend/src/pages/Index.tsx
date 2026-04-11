import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import TitleRow from '@/components/TitleRow';
import { useTitlesContext } from '@/contexts/TitlesContext';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { 
    titles, 
    isLoading, 
    getTrendingTitles, 
    getNewReleases, 
    getMovies, 
    getSeries, 
    getFreeTitles, 
    getTitlesByGenre 
  } = useTitlesContext();
  const { getContinueWatchingTitles, getProgressPercentage } = usePlaybackProgress();
  
  // Safe filter with error handling
  const continueWatching = (() => {
    try {
      const titles = getContinueWatchingTitles();
      if (!titles || !Array.isArray(titles)) return [];
      
      return titles.filter(title => {
        try {
          // Only show titles with valid progress (between 5% and 95%)
          if (title.type === 'series' && title.seasons) {
            // For series, check if any episode has progress
            const allEpisodes = title.seasons.flatMap(s => s.episodes || []);
            return allEpisodes.some(episode => {
              try {
                const percent = getProgressPercentage(title.id, episode.id);
                return percent >= 5 && percent < 95;
              } catch {
                return false;
              }
            });
          } else if (title.type === 'movie') {
            // Netflix-style: For movies, check title progress
            try {
              const percent = getProgressPercentage(title.id);
              // Only show if progress is between 5% and 95% (not just started, not completed)
              return percent >= 5 && percent < 95;
            } catch {
              return false;
            }
          } else {
            // Unknown type, don't show
            return false;
          }
        } catch (error) {
          console.error('Error filtering continue watching:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error getting continue watching titles:', error);
      return [];
    }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const heroTitles = getTrendingTitles().slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSlider titles={heroTitles} />
      
      {/* Content Rows */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-[30px] pb-16 space-y-12">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <TitleRow title="Continue Watching" titles={continueWatching} showProgress />
        )}
        
        {/* Trending Now */}
        <TitleRow title="Trending Now" titles={getTrendingTitles()} size="large" />
        
        {/* New Releases */}
        <TitleRow title="New Releases" titles={getNewReleases()} />
        
        {/* Free to Watch */}
        <TitleRow title="Free to Watch" titles={getFreeTitles()} />
        
        {/* Movies */}
        <TitleRow title="Movies" titles={getMovies()} />
        
        {/* TV Series */}
        <TitleRow title="TV Series" titles={getSeries()} />
        
        {/* By Genre */}
        <TitleRow title="Action & Adventure" titles={getTitlesByGenre('Action')} />
        <TitleRow title="Drama" titles={getTitlesByGenre('Drama')} />
        <TitleRow title="Sci-Fi" titles={getTitlesByGenre('Sci-Fi')} />
        <TitleRow title="Documentaries" titles={getTitlesByGenre('Documentary')} />
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
