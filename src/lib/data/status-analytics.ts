import { supabase } from '#lib/supabaseClient.js';
import type { AnalyticsRange } from '#lib/data/analytics-range.svelte.js';

export type StatusAnalytics = { metrics: { views: number; spike: number; subscribers: number }; currentStatus: string; liveUrlStatus: string };

const RANGE_DAYS: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

function empty(): StatusAnalytics {
	return { metrics: { views: 0, spike: 0, subscribers: 0 }, currentStatus: 'Operational', liveUrlStatus: '—' };
}

export async function fetchStatusAnalytics(userId: string, range: AnalyticsRange): Promise<StatusAnalytics> {
	if (!supabase) return empty();
	try {
		const since = new Date(Date.now() - RANGE_DAYS[range] * 86_400_000).toISOString();
		const { data: memberships } = await supabase.from('tenant_members').select('tenant_id');
		const tenantIds = [...new Set((((memberships ?? []) as Array<{ tenant_id: string }>).map((m) => m.tenant_id).filter(Boolean)))];

		const [incidentsResult, viewsResult, productsResult] = await Promise.all([
			tenantIds.length
				? supabase.from('incidents').select('status').in('tenant_id', tenantIds)
				: Promise.resolve({ data: [], error: null }),
			supabase
				.from('analytics_events')
				.select('created_at')
				.eq('user_id', userId)
				.eq('name', 'status.view')
				.gte('created_at', since)
				.limit(1000),
			supabase.from('products').select('live_url').eq('maker_id', userId).is('deleted_at', null).limit(100)
		]);
		if (incidentsResult.error || viewsResult.error || productsResult.error) return empty();

		const incidents = ((incidentsResult.data ?? []) as Array<{ status: string }>);
		const openCount = incidents.filter((i) => i.status !== 'resolved').length;
		const views = ((viewsResult.data ?? []) as Array<{ created_at: string }>);
		const perDay = new Map<string, number>();
		for (const v of views) {
			const day = v.created_at.slice(0, 10);
			perDay.set(day, (perDay.get(day) ?? 0) + 1);
		}
		const products = ((productsResult.data ?? []) as Array<{ live_url: string | null }>);
		const live = products.filter((p) => p.live_url && p.live_url.trim()).length;
		return {
			metrics: {
				views: views.length,
				spike: perDay.size ? Math.max(...perDay.values()) : 0,
				// No subscriber store exists — zero is the honest count, not a gap.
				subscribers: 0
			},
			currentStatus: openCount > 0 ? 'Active incident' : 'Operational',
			liveUrlStatus: products.length ? `${live}/${products.length} live` : '—'
		};
	} catch {
		return empty();
	}
}
