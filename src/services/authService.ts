import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Profile, UserRole } from '../types/crm.types';

export const authService = {
  /**
   * Signs in an existing user with email and password
   */
  async signIn(email: string, password: string): Promise<{ profile: Profile | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      // In unconfigured demo mode, simulate successful login with demo counsellor
      const demoProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: email.split('@')[0] || 'Demo Counsellor',
        role: 'counsellor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('brightpath_demo_user', JSON.stringify(demoProfile));
      return { profile: demoProfile, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { profile: null, error: error.message };
      if (!data.user) return { profile: null, error: 'User account not found.' };

      const profile = await this.getProfile(data.user.id);
      return { profile, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
      return { profile: null, error: message };
    }
  },

  /**
   * Registers a new staff account
   */
  async signUp(email: string, password: string, fullName: string): Promise<{ profile: Profile | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      const demoProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: fullName || 'Demo Counsellor',
        role: 'counsellor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('brightpath_demo_user', JSON.stringify(demoProfile));
      return { profile: demoProfile, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) return { profile: null, error: error.message };
      if (!data.user) return { profile: null, error: 'Registration succeeded, check confirmation.' };

      // Allow trigger to complete or insert fallback
      const profile = await this.getProfile(data.user.id);
      return { profile, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign up.';
      return { profile: null, error: message };
    }
  },

  /**
   * Fetches profile from public.profiles table
   */
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('brightpath_demo_user');
      return stored ? JSON.parse(stored) : null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        return data as Profile;
      }

      // If user exists in auth but profile trigger failed, return basic profile object
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user && authData.user.id === userId) {
        const fallbackProfile: Profile = {
          id: userId,
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Staff Member',
          role: 'counsellor' as UserRole,
          created_at: authData.user.created_at,
          updated_at: authData.user.created_at
        };
        return fallbackProfile;
      }

      return null;
    } catch (err) {
      console.error('Error in getProfile:', err);
      return null;
    }
  },

  /**
   * Fetches all staff profiles (for assignment dropdowns)
   */
  async getAllProfiles(): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          id: '00000000-0000-0000-0000-000000000001',
          full_name: 'Ananya Deshmukh',
          role: 'counsellor',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          full_name: 'Rajesh Kulkarni',
          role: 'manager',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching staff profiles:', error);
        return [];
      }
      return (data || []) as Profile[];
    } catch (err) {
      console.error('Error in getAllProfiles:', err);
      return [];
    }
  },

  /**
   * Signs out current user
   */
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('brightpath_demo_user');
      return;
    }
    await supabase.auth.signOut();
  }
};
