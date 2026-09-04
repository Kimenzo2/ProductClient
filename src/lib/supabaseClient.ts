import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
	console.warn('Supabase env missing: PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
	? createClient(supabaseUrl, supabaseKey, {
			auth: {
				autoRefreshToken: true,
				persistSession: true,
				// Auth callbacks and the cross-host session handoff are processed
				// explicitly so two clients cannot consume the same refresh token.
				detectSessionInUrl: false,
				flowType: 'pkce'
			}
		})
	: null;
