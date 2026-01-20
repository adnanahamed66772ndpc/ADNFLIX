import { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthUser } from '@/hooks/useAuth';

interface AuthContextType {
  user: AuthUser | null;
  session: { userId: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<AuthUser, 'displayName' | 'avatarUrl'>>) => Promise<boolean>;
  updateSubscription: (plan: 'free' | 'with-ads' | 'premium') => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  try {
    const auth = useAuth();

    return (
      <AuthContext.Provider value={auth}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('[AuthProvider] Error:', error);
    // Return children anyway to prevent blank page
    return <>{children}</>;
  }
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
