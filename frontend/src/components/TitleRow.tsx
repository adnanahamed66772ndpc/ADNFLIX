import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Title } from '@/hooks/useTitles';
import TitleCard from './TitleCard';

interface TitleRowProps {
  title: string;
  titles: Title[];
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

const TitleRow = ({ title, titles, size = 'medium', showProgress = false }: TitleRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (titles.length === 0) return null;

  return (
    <section className="relative group mt-6 sm:mt-8 md:mt-10 mb-6 sm:mb-8 md:mb-10">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6 px-2 sm:px-0">{title}</h2>
      
      <div className="relative">
        {/* Left Navigation */}
        <button
          onClick={() => scroll('left')}
          className="row-nav-btn left-1 sm:left-2 md:left-4 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="scroll-container px-2 sm:px-0"
        >
          {titles.map((t, index) => (
            <TitleCard key={t.id} title={t} index={index} size={size} showProgress={showProgress} />
          ))}
        </div>

        {/* Right Navigation */}
        <button
          onClick={() => scroll('right')}
          className="row-nav-btn right-1 sm:right-2 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </section>
  );
};

export default TitleRow;
