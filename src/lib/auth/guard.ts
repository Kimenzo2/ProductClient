import { goto } from '$app/navigation';
import { supabase } from '$lib/supabaseClient';
import { authHref } from '$lib/auth/urls';

export async function requireSession(next: string): Promise<boolean> {
	if (!supabase) return false;
	const { data } = await supabase.auth.getSession();
	if (data.session) return true;
	const destination = authHref('login', next);
	if (destination.startsWith('http')) {
		window.location.assign(destination);
	} else {
		void goto(destination, { replaceState: true });
	}
	return false;
}
