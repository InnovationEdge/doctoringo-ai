import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pdokkwbhvfifqkcuzdzn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb2trd2JodmZpZnFrY3V6ZHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDkxOTEsImV4cCI6MjA5MTk4NTE5MX0.YutA5ZYSIlwrR56c2YGXQQoUzi-tbAk9Hs_Om_7SsZw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge function URL helper
export const edgeFunctionUrl = (name: string) =>
  `${supabaseUrl}/functions/v1/${name}`;
