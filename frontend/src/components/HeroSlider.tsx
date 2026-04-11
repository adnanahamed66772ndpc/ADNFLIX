import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Plus, Check, ChevronLeft, ChevronRight, Star, Crown } from 'lucide-react';
import { Title } from '@/hooks/useTitles';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Button } from '@/components/ui/button';

interface HeroSliderProps {
  titles: Title[];
  autoPlayInterval?: number;
}

const HeroSlider = ({ titles, autoPlayInterval = 8000 }: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const navigate = useNavigate();

  const currentTitle = titles[currentIndex];
  const inWatchlist = isInWatchlist(currentTitle?.id || '');

  useEffect(() => {
    if (isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % titles.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [titles.length, autoPlayInterval, isHovered]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + titles.length) % titles.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % titles.length);
  };

  const handleWatchlistClick = () => {
    if (inWatchlist) {
      removeFromWatchlist(currentTitle.id);
    } else {
      addToWatchlist(currentTitle.id);
    }
  };

  if (!currentTitle) return null;

  return (
    <div 
      className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTitle.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={currentTitle.backdropUrl}
            alt={currentTitle.name}
            className="w-full h-full object-cover"
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTitle.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                {currentTitle.premium && (
                  <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold px-3 py-1 rounded">
                    <Crown className="w-3.5 h-3.5" />
                    PREMIUM
                  </span>
                )}
                {currentTitle.rating > 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground/80">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {currentTitle.rating}
                  </span>
                )}
                <span className="text-sm text-foreground/60">{currentTitle.year}</span>
                <span className="border border-foreground/30 px-2 py-0.5 rounded text-xs text-foreground/70">
                  {currentTitle.maturity}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl text-foreground mb-3 sm:mb-4 leading-tight sm:leading-none">
                {currentTitle.name}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-foreground/70">
                <span className="capitalize">{currentTitle.type}</span>
                {currentTitle.duration && (
                  <>
                    <span>•</span>
                    <span>{currentTitle.duration} min</span>
                  </>
                )}
                {currentTitle.type === 'series' && currentTitle.seasons && currentTitle.seasons.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{currentTitle.seasons.length} Season{currentTitle.seasons.length > 1 ? 's' : ''}</span>
                  </>
                )}
                <span>•</span>
                <span>{currentTitle.genres.slice(0, 3).join(', ')}</span>
              </div>

              {/* Synopsis */}
              <p className="text-foreground/80 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
                {currentTitle.synopsis}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  size="default"
                  onClick={() => navigate(`/watch/${currentTitle.id}`)}
                  className="text-sm sm:text-base font-semibold px-4 sm:px-6 md:px-8 glow-primary"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 fill-current" />
                  <span className="hidden xs:inline">Play Now</span>
                  <span className="xs:hidden">Play</span>
                </Button>
                <Button
                  size="default"
                  variant="secondary"
                  onClick={() => navigate(`/title/${currentTitle.id}`)}
                  className="text-sm sm:text-base font-semibold px-3 sm:px-4 md:px-6"
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">More Info</span>
                  <span className="sm:hidden">Info</span>
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={handleWatchlistClick}
                  className={`px-3 sm:px-4 ${inWatchlist ? 'border-primary text-primary' : ''}`}
                >
                  {inWatchlist ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/30 hover:bg-black/50 rounded-full transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
        {titles.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-primary'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
