import { supabase } from '$lib/supabaseClient';
import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
export type FeedbackAnalytics = { metrics: { newRequests: number; comments: number; shipped: number; medianAge: number|null; watchers: number; linked: number; orphaned: number }; byStatus: {status:string;count:number}[] };

const RANGE_DAYS: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

function empty(): FeedbackAnalytics {
	return { metrics: { newRequests: 0, comments: 0, shipped: 0, medianAge: null, watchers: 0, linked: 0, orphaned: 0 }, byStatus: [] };
}

type FeedbackRow = { status: string; created_at: string };

export async function fetchFeedbackAnalytics(userId: string, range: AnalyticsRange): Promise<FeedbackAnalytics> {
	if (!supabase) return empty();
	try {
		// Maker feedback lives in feedback_items under the maker's own
		// products — not in feedback_reports, which holds per-user rollups.
		const { data: products, error: productsError } = await supabase
			.from('products')
			.select('id')
			.eq('maker_id', userId)
			.is('deleted_at', null);
		if (productsError) return empty();
		const productIds = ((products ?? []) as Array<{ id: string }>).map((p) => p.id).filter(Boolean);
		if (productIds.length === 0) return empty();

		const since = new Date(Date.now() - RANGE_DAYS[range] * 86_400_000).toISOString();
		const { data, error } = await supabase
			.from('feedback_items')
			.select('status, created_at')
			.in('product_id', productIds)
			.gte('created_at', since)
			.limit(500);
		if (error) return empty();
		const rows = ((data ?? []) as FeedbackRow[]).filter((r) => r.created_at);
		if (rows.length === 0) return empty();

		const byStatusMap = new Map<string, number>();
		for (const r of rows) byStatusMap.set(r.status ?? 'unknown', (byStatusMap.get(r.status ?? 'unknown') ?? 0) + 1);
		const ages = rows
			.filter((r) => r.status !== 'closed' && r.status !== 'shipped')
			.map((r) => (Date.now() - Date.parse(r.created_at)) / 86_400_000)
			.filter((age) => age >= 0)
			.sort((a, b) => a - b);
		const medianAge = ages.length ? Math.round(ages[Math.floor(ages.length / 2)]) : null;
		return {
			metrics: {
				newRequests: rows.filter((r) => r.status === 'new').length,
				// No comment or watcher store exists — zeros are honest, not gaps.
				comments: 0,
				shipped: rows.filter((r) => r.status === 'shipped' || r.status === 'closed').length,
				medianAge,
				watchers: 0,
				// No release/problem linkage schema exists yet.
				linked: 0,
				orphaned: rows.length
			},
			byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count }))
		};
	} catch {
		return empty();
	}
}
