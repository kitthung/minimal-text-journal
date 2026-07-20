import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials exist and are not placeholder strings
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseAnonKey.includes('your-actual-anon-key')
);

// Fallback dummy client if unconfigured to prevent runtime crash
const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyKey
);
