import { supabase } from '$lib/supabaseClient';
import { analyticsRange, type AnalyticsRange } from '$lib/data/analytics-range.svelte';

export type DocsAnalytics = {
	metrics: { views: number; visitors: number; searches: number; noResultQueries: number; helpfulYes: number; helpfulNo: number; playgroundRuns: number; codeCopies: number; };
	topPages: { path: string; views: number; humanViews: number; assistantViews: number }[];
	searches: { query: string; hits: number }[];
	noResultQueries: { query: string; count: number }[];
	staleDocs: { path: string; lastEdited: string; lastRelease: string }[];
};

export async function fetchDocsAnalytics(userId: string, range: AnalyticsRange): Promise<DocsAnalytics> {
	if (!supabase) return empty();
	// Prefer analytics_events if exists, else fallback to 0
	try {
		const since = new Date(Date.now() - (range === '7d' ? 7 : range === '30d' ? 30 : 90) * 86_400_000).toISOString();
		// Try new table, fallback to empty on missing table
		const { data: events, error } = await supabase.from('analytics_events').select('name, path, query, created_at').eq('user_id', userId).gte('created_at', since).limit(500);
		if (error) throw error;
		const views = events?.filter(e => e.name === 'docs.view').length ?? 0;
		const searches = events?.filter(e => e.name === 'docs.search') ?? [];
		const noRes = events?.filter(e => e.name === 'docs.search_no_results') ?? [];
		return {
			metrics: {
				views,
				visitors: new Set(events?.map(e => e.query).filter(Boolean)).size || views,
				searches: searches.length,
				noResultQueries: noRes.length,
				helpfulYes: events?.filter(e => e.name === 'docs.helpful' && (e as any).value === 'yes').length ?? 0,
				helpfulNo: events?.filter(e => e.name === 'docs.helpful' && (e as any).value === 'no').length ?? 0,
				playgroundRuns: events?.filter(e => e.name === 'docs.playground_run').length ?? 0,
				codeCopies: events?.filter(e => e.name === 'docs.code_copy').length ?? 0,
			},
			topPages: [],
			searches: searches.slice(0,5).map(s => ({ query: s.query ?? '(empty)', hits: 1 })),
			noResultQueries: noRes.slice(0,3).map(s => ({ query: s.query ?? '(empty)', count: 1 })),
			staleDocs: []
		};
	} catch {
		return empty();
	}
	function empty(): DocsAnalytics {
		return {
			metrics: { views: 0, visitors: 0, searches: 0, noResultQueries: 0, helpfulYes: 0, helpfulNo: 0, playgroundRuns: 0, codeCopies: 0 },
			topPages: [],
			searches: [],
			noResultQueries: [],
			staleDocs: []
		};
	}
}
