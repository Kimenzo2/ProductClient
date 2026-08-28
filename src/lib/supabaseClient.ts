import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Supports both .env.local / .env with PUBLIC_ prefix (no restart needed for dynamic)
const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.warn('Supabase env missing: PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : (null as any);
