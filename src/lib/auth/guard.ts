import { goto } from '$app/navigation';
import { supabase } from '$lib/supabaseClient';

export async function requireSession(next: string): Promise<boolean> {
	if (!supabase) return false;
	const { data } = await supabase.auth.getSession();
	if (data.session) return true;
	void goto(`/auth?next=${encodeURIComponent(next)}`, { replaceState: true });
	return false;
}
