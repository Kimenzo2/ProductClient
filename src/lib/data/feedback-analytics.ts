import { supabase } from '$lib/supabaseClient';
import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
export type FeedbackAnalytics = { metrics: { newRequests: number; comments: number; shipped: number; medianAge: number|null; watchers: number; linked: number; orphaned: number }; byStatus: {status:string;count:number}[] };
export async function fetchFeedbackAnalytics(userId: string, range: AnalyticsRange): Promise<FeedbackAnalytics> {
	try {
		if (!supabase) throw new Error('no supabase');
		// Prefer feedback_reports if exists, else empty
		const { data, error } = await supabase.from('feedback_reports').select('status').eq('user_id', userId).limit(100);
		if (error) throw error;
		const byStatusMap = new Map<string, number>();
		for (const r of (data ?? [])) { const s = (r as any).status ?? 'unknown'; byStatusMap.set(s, (byStatusMap.get(s) ?? 0) + 1); }
		return { metrics: { newRequests: data?.length ?? 0, comments: 0, shipped: 0, medianAge: null, watchers: 0, linked: 0, orphaned: data?.length ?? 0 }, byStatus: Array.from(byStatusMap.entries()).map(([status,count])=>({status,count})) };
	} catch { return { metrics: { newRequests: 0, comments: 0, shipped: 0, medianAge: null, watchers: 0, linked: 0, orphaned: 0 }, byStatus: [] }; }
}
