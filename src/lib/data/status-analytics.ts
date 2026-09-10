import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
export type StatusAnalytics = { metrics: { views: number; spike: number; subscribers: number }; currentStatus: string; liveUrlStatus: string };
export async function fetchStatusAnalytics(_userId: string, _range: AnalyticsRange): Promise<StatusAnalytics> {
	return { metrics: { views: 0, spike: 0, subscribers: 0 }, currentStatus: 'Operational', liveUrlStatus: '—' };
}
