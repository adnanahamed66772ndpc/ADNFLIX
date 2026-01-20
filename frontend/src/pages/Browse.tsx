import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid, List, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TitleCard from '@/components/TitleCard';
import FilterBar from '@/components/FilterBar';
import { useTitlesContext } from '@/contexts/TitlesContext';
import { Button } from '@/components/ui/button';

const Browse = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { titles, isLoading, searchTitles } = useTitlesContext();

  // Filter states from URL params
  const searchQuery = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || 'all';
  const genreFilter = searchParams.get('genre') || 'all';
  const yearFilter = searchParams.get('year') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  // Filter and sort titles
  const filteredTitles = useMemo(() => {
    let result = [...titles];

    // Search filter
    if (searchQuery) {
      result = searchTitles(searchQuery);
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
      result = result.filter(t => {
        const titleYear = t.year || t.release_year;
        return titleYear?.toString() === yearFilter;
      });
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
  }, [titles, searchQuery, typeFilter, genreFilter, yearFilter, sortBy, searchTitles]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display mb-2">Browse All</h1>
            <p className="text-muted-foreground">
              {filteredTitles.length} titles available
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center">
            <FilterBar titles={titles} />
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-border rounded-md p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {filteredTitles.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4'
                  : 'flex flex-col gap-3 sm:gap-4'
              }
            >
              {filteredTitles.map((title, index) => (
                <TitleCard key={title.id} title={title} index={index} size="medium" />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No titles found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Browse;
