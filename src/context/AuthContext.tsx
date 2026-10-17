import React, { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthContext } from './authContextDef';

const DEMO_USER: User = {
  id: 'demo-user-12345678-abcd-ef01-2345-6789abcdef01',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@agentmail.dev',
};

const DEMO_SESSION: Session = {
  access_token: 'demo-jwt-token-access',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'demo-refresh-token',
  user: DEMO_USER,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('agentmail_demo_mode') === 'true';
  });

  const [user, setUser] = useState<User | null>(() => {
    const demo = typeof window !== 'undefined' && localStorage.getItem('agentmail_demo_mode') === 'true';
    return demo ? DEMO_USER : null;
  });

  const [session, setSession] = useState<Session | null>(() => {
    const demo = typeof window !== 'undefined' && localStorage.getItem('agentmail_demo_mode') === 'true';
    return demo ? DEMO_SESSION : null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const demo = typeof window !== 'undefined' && localStorage.getItem('agentmail_demo_mode') === 'true';
    if (demo) return false;
    return isSupabaseConfigured;
  });

  useEffect(() => {
    if (isDemoMode || !isSupabaseConfigured) {
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching Supabase session:', err);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemoMode]);

  const signInWithOtp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        ),
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error(
          'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        ),
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem('agentmail_demo_mode');
      setIsDemoMode(false);
      setUser(null);
      setSession(null);
      return;
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, [isDemoMode]);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (isDemoMode) {
      return DEMO_SESSION.access_token;
    }

    if (!isSupabaseConfigured) {
      return null;
    }

    const { data: { session: currentSession }, error } = await supabase.auth.getSession();
    if (error || !currentSession) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) {
        return null;
      }
      setSession(refreshed.session);
      setUser(refreshed.session.user);
      return refreshed.session.access_token;
    }

    return currentSession.access_token;
  }, [isDemoMode]);

  const enableDemoMode = useCallback(() => {
    localStorage.setItem('agentmail_demo_mode', 'true');
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setSession(DEMO_SESSION);
    setLoading(false);
  }, []);

  const disableDemoMode = useCallback(() => {
    localStorage.removeItem('agentmail_demo_mode');
    setIsDemoMode(false);
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isDemoMode,
        signInWithOtp,
        signInWithGoogle,
        signOut,
        getValidAccessToken,
        enableDemoMode,
        disableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
