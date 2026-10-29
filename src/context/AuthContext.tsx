import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import type { Profile } from '../types/crm.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string } | void>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error?: string } | void>;
  signInAsDemo: (role?: 'admin' | 'manager' | 'counsellor') => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const userProfile = await authService.getProfile(userId);
    setProfile(userProfile);
  };

  const loadLocalDemoUser = (): boolean => {
    const demoUser = localStorage.getItem('brightpath_demo_user');
    if (demoUser) {
      try {
        const parsed = JSON.parse(demoUser);
        setProfile(parsed);
        setUser({ id: parsed.id, email: `${parsed.role || 'demo'}@brightpath.edu` } as User);
        return true;
      } catch (e) {
        console.error(e);
      }
    }
    return false;
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadLocalDemoUser();
      setIsLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        loadLocalDemoUser();
        setIsLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    const { profile: resProfile, error } = await authService.signIn(email, pass);
    setIsLoading(false);
    if (error) {
      return { error };
    }
    setProfile(resProfile);
  };

  const signUp = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    const { profile: resProfile, error } = await authService.signUp(email, pass, name);
    setIsLoading(false);
    if (error) {
      return { error };
    }
    setProfile(resProfile);
  };

  const signInAsDemo = (role: 'admin' | 'manager' | 'counsellor' = 'admin') => {
    const demoProf = authService.signInAsDemo(role);
    setProfile(demoProf);
    setUser({ id: demoProf.id, email: `${demoProf.role}@brightpath.edu` } as User);
  };

  const signOut = async () => {
    setIsLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signInAsDemo,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
