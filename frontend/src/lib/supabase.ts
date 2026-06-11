import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jsdzssxyromeqtpyvhmw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZHpzc3h5cm9tZXF0cHl2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTEwMjYsImV4cCI6MjA5NTE4NzAyNn0.T2mCOw-sgZt-Znpri8sEvF_mtSF3IuiSN4QitYi9Bw8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
