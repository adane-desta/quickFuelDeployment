// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

// Create Supabase client
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Session refresh on tab visibility (optional, but safe)
export const initSessionRefreshOnVisibility = () => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const { error } = await supabase.auth.refreshSession();
      if (error) console.warn('Session refresh failed on visibility change:', error);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
};

// Also export default for compatibility if any file uses default import
export default supabase;