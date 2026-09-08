import { redirect } from '@sveltejs/kit';

export function load() {
	redirect(307, '/workspace/status/incidents/new');
}
