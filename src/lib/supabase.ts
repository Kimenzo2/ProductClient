import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Wire after you create Supabase project and fill .env
// PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY
export const supabase =
	env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY
		? createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY)
		: null;
