import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface FilterBarProps {
  titles: any[];
  showSearch?: boolean;
  showType?: boolean;
  showYear?: boolean;
  showSort?: boolean;
  defaultType?: 'all' | 'movie' | 'series';
}

export default function FilterBar({
  titles,
  showSearch = true,
  showType = true,
  showYear = true,
  showSort = true,
  defaultType = 'all',
}: FilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Get filter values from URL params
  const searchQuery = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || defaultType;
  const genreFilter = searchParams.get('genre') || 'all';
  const yearFilter = searchParams.get('year') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  // Get unique genres from titles
  const allGenres = Array.from(
    new Set(titles.flatMap(t => t.genres || []))
  ).sort();

  // Get unique years from titles
  const years = Array.from(
    new Set(titles.map(t => t.year || t.release_year || 0).filter(y => y > 0))
  ).sort((a, b) => b - a);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters =
    searchQuery ||
    (typeFilter !== 'all' && typeFilter !== defaultType) ||
    genreFilter !== 'all' ||
    yearFilter !== 'all';

  return (
    <div className="mb-6">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        {/* Search Input */}
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search titles, actors, genres..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9 sm:pl-10 bg-secondary border-border text-sm sm:text-base"
            />
          </div>
        )}

        {/* Filter Toggle (Mobile) */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              !
            </span>
          )}
        </Button>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 flex-wrap">
          {showType && (
            <Select
              value={typeFilter}
              onValueChange={(v) => updateFilter('type', v)}
            >
              <SelectTrigger className="w-28 sm:w-32 bg-secondary text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="movie">Movies</SelectItem>
                <SelectItem value="series">TV Series</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select
            value={genreFilter}
            onValueChange={(v) => updateFilter('genre', v)}
          >
            <SelectTrigger className="w-32 sm:w-36 bg-secondary text-sm">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {allGenres.map((genre) => (
                <SelectItem key={genre} value={genre.toLowerCase()}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showYear && years.length > 0 && (
            <Select
              value={yearFilter}
              onValueChange={(v) => updateFilter('year', v)}
            >
              <SelectTrigger className="w-24 sm:w-28 bg-secondary text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.slice(0, 20).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showSort && (
            <Select
              value={sortBy}
              onValueChange={(v) => updateFilter('sort', v)}
            >
              <SelectTrigger className="w-28 sm:w-32 bg-secondary text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="name">A-Z</SelectItem>
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs sm:text-sm"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 p-4 bg-secondary rounded-lg space-y-3"
          >
            {showType && (
              <Select
                value={typeFilter}
                onValueChange={(v) => updateFilter('type', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="series">TV Series</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select
              value={genreFilter}
              onValueChange={(v) => updateFilter('genre', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {allGenres.map((genre) => (
                  <SelectItem key={genre} value={genre.toLowerCase()}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showYear && years.length > 0 && (
              <Select
                value={yearFilter}
                onValueChange={(v) => updateFilter('year', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.slice(0, 20).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showSort && (
              <Select
                value={sortBy}
                onValueChange={(v) => updateFilter('sort', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="name">A-Z</SelectItem>
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
