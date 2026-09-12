import { supabase } from '$lib/supabaseClient';
import { analyticsRange, type AnalyticsRange } from '$lib/data/analytics-range.svelte';

export type DocsAnalytics = {
	metrics: { views: number; visitors: number; searches: number; noResultQueries: number; helpfulYes: number; helpfulNo: number; playgroundRuns: number; codeCopies: number; };
	topPages: { path: string; views: number; humanViews: number; assistantViews: number }[];
	searches: { query: string; hits: number }[];
	noResultQueries: { query: string; count: number }[];
	staleDocs: { path: string; lastEdited: string; lastRelease: string }[];
	feedbackPerPage: { path: string; yes: number; no: number; total: number }[];
	askMisses: { question: string; count: number }[];
};

export async function fetchDocsAnalytics(userId: string, range: AnalyticsRange): Promise<DocsAnalytics> {
	if (!supabase) return empty();
	try {
		const since = new Date(Date.now() - (range === '7d' ? 7 : range === '30d' ? 30 : 90) * 86_400_000).toISOString();
		const { data: events, error } = await supabase.from('analytics_events').select('name, path, query, value, created_at').eq('user_id', userId).gte('created_at', since).limit(800);
		if (error) throw error;
		const views = events?.filter((e) => e.name === 'docs.view') ?? [];
		const searches = events?.filter((e) => e.name === 'docs.search') ?? [];
		const noRes = events?.filter((e) => e.name === 'docs.search_no_results') ?? [];
		const helpful = events?.filter((e) => e.name === 'docs.helpful') ?? [];
		const assistant = events?.filter((e) => e.name === 'docs.assistant_fetch' || e.name === 'docs.ask') ?? [];
		const askMissesRaw = events?.filter((e) => (e.name === 'docs.ask' || e.name === 'docs.assistant_fetch') && (e as unknown as { value?: string }).value === 'miss') ?? [];

		// Top pages: group by path for docs.view
		const pathCounts = new Map<string, { views: number; assistant: number }>();
		for (const v of views) {
			const p = v.path ?? '(unknown)';
			const cur = pathCounts.get(p) ?? { views: 0, assistant: 0 };
			cur.views += 1;
			pathCounts.set(p, cur);
		}
		for (const a of assistant) {
			const p = a.path ?? '(unknown)';
			const cur = pathCounts.get(p) ?? { views: 0, assistant: 0 };
			cur.assistant += 1;
			pathCounts.set(p, cur);
		}
		const topPages = Array.from(pathCounts.entries())
			.map(([path, c]) => ({ path, views: c.views, humanViews: c.views - c.assistant, assistantViews: c.assistant }))
			.sort((a, b) => b.views - a.views)
			.slice(0, 5);

		// Feedback per page
		const fbMap = new Map<string, { yes: number; no: number }>();
		for (const h of helpful) {
			const p = h.path ?? '(unknown)';
			const cur = fbMap.get(p) ?? { yes: 0, no: 0 };
			const v = (h as unknown as { value?: string }).value;
			if (v === 'yes') cur.yes += 1;
			else if (v === 'no') cur.no += 1;
			fbMap.set(p, cur);
		}
		const feedbackPerPage = Array.from(fbMap.entries())
			.map(([path, c]) => ({ path, yes: c.yes, no: c.no, total: c.yes + c.no }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 5);

		// Ask misses: question grouped
		const askMap = new Map<string, number>();
		for (const q of askMissesRaw) {
			const query = q.query ?? q.path ?? '(empty)';
			askMap.set(query, (askMap.get(query) ?? 0) + 1);
		}
		const askMisses = Array.from(askMap.entries())
			.map(([question, count]) => ({ question, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 3);

		return {
			metrics: {
				views: views.length,
				visitors: new Set(events?.map((e) => e.query).filter(Boolean) as string[]).size || views.length,
				searches: searches.length,
				noResultQueries: noRes.length,
				helpfulYes: helpful.filter((e) => (e as unknown as { value?: string }).value === 'yes').length,
				helpfulNo: helpful.filter((e) => (e as unknown as { value?: string }).value === 'no').length,
				playgroundRuns: events?.filter((e) => e.name === 'docs.playground_run').length ?? 0,
				codeCopies: events?.filter((e) => e.name === 'docs.code_copy').length ?? 0
			},
			topPages,
			searches: searches.slice(0, 5).map((s) => ({ query: s.query ?? '(empty)', hits: 1 })),
			noResultQueries: Array.from(
				noRes.reduce((m, s) => {
					const q = s.query ?? '(empty)';
					m.set(q, (m.get(q) ?? 0) + 1);
					return m;
				}, new Map<string, number>())
			)
				.map(([query, count]) => ({ query, count }))
				.slice(0, 3),
			staleDocs: [],
			feedbackPerPage,
			askMisses
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
			staleDocs: [],
			feedbackPerPage: [],
			askMisses: []
		};
	}
}
