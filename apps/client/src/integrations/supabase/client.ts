import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://bkthkotzicohjizmcmsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdGhrb3R6aWNvaGppem1jbXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDk2MzksImV4cCI6MjA3NjcyNTYzOX0.EFv5aj0kJj4m5X9ks8Sw3aW9cEaFbWLfTAL6yFBSjgo';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  }
});
