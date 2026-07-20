import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yuhlidfiqdkyojhjhpko.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aGxpZGZpcWRreW9qaGpocGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MjI3MTQsImV4cCI6MjEwMDA5ODcxNH0.sPRYVFIhZVmKqsmH8iT0Cjd7W7IDDY9fIdDwmcMf55A';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  !supabaseAnonKey.includes('your-actual-anon-key')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
