import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Validates whether Supabase environment variables are properly defined and not placeholders.
 */
export const checkSupabaseConfig = (): { isConfigured: boolean; message: string } => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isConfigured: false,
      message: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file.'
    };
  }

  if (
    supabaseUrl.includes('your-project-id') || 
    supabaseAnonKey.includes('your-publishable-anon-key') ||
    supabaseUrl.trim() === ''
  ) {
    return {
      isConfigured: false,
      message: 'Supabase credentials are set to default placeholder values.'
    };
  }

  try {
    new URL(supabaseUrl);
  } catch {
    return {
      isConfigured: false,
      message: 'VITE_SUPABASE_URL is not a valid URL format.'
    };
  }

  return { isConfigured: true, message: 'Supabase client configured successfully.' };
};

const configStatus = checkSupabaseConfig();
export const isSupabaseConfigured = configStatus.isConfigured;
export const configErrorMessage = configStatus.message;

export const isUsingDemoData = (): boolean => {
  return !isSupabaseConfigured || Boolean(localStorage.getItem('brightpath_demo_user'));
};

if (!isSupabaseConfigured) {
  console.warn(
    `[BrightPath CRM] Supabase not connected: ${configErrorMessage}\n` +
    `Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable real database persistence.`
  );
}

// Fallback dummy client if not configured so the app does not crash at bundle import time
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');
