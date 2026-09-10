import { supabase } from '$lib/supabaseClient';

export type AnalyticsEventName =
	| 'docs.view'
	| 'docs.search'
	| 'docs.search_no_results'
	| 'docs.search_click'
	| 'docs.helpful'
	| 'docs.code_copy'
	| 'docs.playground_run'
	| 'docs.assistant_fetch'
	| 'feedback.new'
	| 'feedback.comment'
	| 'feedback.shipped'
	| 'roadmap.moved'
	| 'incidents.opened'
	| 'incidents.resolved'
	| 'incidents.first_update'
	| 'status.view';

export async function trackAnalyticsEvent(
	name: AnalyticsEventName,
	opts: { productId?: string; path?: string; query?: string; value?: string; eventId?: string } = {}
) {
	if (!supabase) return;
	try {
		const { data } = await supabase.auth.getUser();
		const userId = data.user?.id;
		if (!userId) return;
		const eventId = opts.eventId ?? `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		await supabase.from('analytics_events').insert({
			user_id: userId,
			product_id: opts.productId ?? null,
			name,
			path: opts.path ?? null,
			query: opts.query ?? null,
			value: opts.value ?? null,
			event_id: eventId
		});
	} catch {
		// no-op — analytics must not break product UI
	}
}
