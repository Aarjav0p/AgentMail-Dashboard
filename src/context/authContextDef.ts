import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
