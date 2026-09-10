import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
export type RoadmapAnalytics = { byColumn: Record<string, number>; recentlyMoved: {title:string;from:string;to:string;at:string}[]; oldestPlanned: {title:string;age:string}|null };
export async function fetchRoadmapAnalytics(_userId: string, _range: AnalyticsRange): Promise<RoadmapAnalytics> {
	return { byColumn: {}, recentlyMoved: [], oldestPlanned: null };
}
