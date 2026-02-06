import { createClient } from '@supabase/supabase-js';

// Ye variables .env.local se keys khinchenge
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase client initialize ho raha hai
export const supabase = createClient(supabaseUrl, supabaseAnonKey);