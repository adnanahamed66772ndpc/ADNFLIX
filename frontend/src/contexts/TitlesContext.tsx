import { createContext, useContext, ReactNode } from 'react';
import { useTitles, Title, Season, Episode } from '@/hooks/useTitles';

interface TitlesContextType {
  titles: Title[];
  isLoading: boolean;
  refresh: () => void;
  getTitleById: (id: string) => Title | undefined;
  getTrendingTitles: () => Title[];
  getNewReleases: () => Title[];
  getMovies: () => Title[];
  getSeries: () => Title[];
  getTitlesByGenre: (genre: string) => Title[];
  getFreeTitles: () => Title[];
  getPremiumTitles: () => Title[];
  searchTitles: (query: string) => Title[];
}

const TitlesContext = createContext<TitlesContextType | undefined>(undefined);

export function TitlesProvider({ children }: { children: ReactNode }) {
  const titlesHook = useTitles();

  return (
    <TitlesContext.Provider value={titlesHook}>
      {children}
    </TitlesContext.Provider>
  );
}

export function useTitlesContext() {
  const context = useContext(TitlesContext);
  if (context === undefined) {
    throw new Error('useTitlesContext must be used within a TitlesProvider');
  }
  return context;
}

export type { Title, Season, Episode };
