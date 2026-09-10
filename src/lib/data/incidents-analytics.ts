import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
export type IncidentsAnalytics = { metrics: { open: number; resolved: number; ttfu: string | null; ttr: string | null }; bySeverity: {severity:string;count:number}[]; recent: {title:string;severity:string;opened:string}[]; missingFix:number; missingDoc:number };
export async function fetchIncidentsAnalytics(_userId: string, _range: AnalyticsRange): Promise<IncidentsAnalytics> {
	return { metrics: { open: 0, resolved: 0, ttfu: null, ttr: null }, bySeverity: [], recent: [], missingFix: 0, missingDoc: 0 };
}
