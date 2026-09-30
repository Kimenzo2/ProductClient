import { supabase } from '$lib/supabaseClient';
import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
import { timeAgo } from '$lib/data/feedbackInbox';

export type RoadmapAnalytics = { byColumn: Record<string, number>; recentlyMoved: {title:string;from:string;to:string;at:string}[]; oldestPlanned: {title:string;age:string}|null };

function empty(): RoadmapAnalytics {
	return { byColumn: {}, recentlyMoved: [], oldestPlanned: null };
}

type RoadmapChapter = { id?: string; label?: string; items?: Array<{ title?: string; stage?: string; updatedAt?: string }> };
type RoadmapDoc = { chapters?: RoadmapChapter[]; stages?: Record<string, { label?: string }> };

export async function fetchRoadmapAnalytics(_userId: string, _range: AnalyticsRange): Promise<RoadmapAnalytics> {
	if (!supabase) return empty();
	try {
		// Roadmap items live inside each tenant's roadmap_docs.doc JSON
		// (chapters with labeled columns), not in an items table.
		const { data: memberships, error: membershipError } = await supabase.from('tenant_members').select('tenant_id');
		if (membershipError || !memberships) return empty();
		const tenantIds = [...new Set(((memberships ?? []) as Array<{ tenant_id: string }>).map((m) => m.tenant_id).filter(Boolean))];
		if (tenantIds.length === 0) return empty();

		const { data, error } = await supabase.from('roadmap_docs').select('doc').in('tenant_id', tenantIds).limit(20);
		if (error || !data) return empty();

		const byColumn = new Map<string, number>();
		const dated: Array<{ title: string; to: string; at: string }> = [];
		const planned: Array<{ title: string; at: string }> = [];
		for (const row of data as Array<{ doc: RoadmapDoc }>) {
			const doc = row.doc;
			if (!doc || !Array.isArray(doc.chapters)) continue;
			doc.chapters.forEach((chapter, chapterIndex) => {
				const label = chapter.label ?? chapter.id ?? 'Unsorted';
				const items = Array.isArray(chapter.items) ? chapter.items : [];
				byColumn.set(label, (byColumn.get(label) ?? 0) + items.length);
				for (const item of items) {
					if (!item.title) continue;
					const to = doc.stages?.[item.stage ?? '']?.label ?? item.stage ?? label;
					if (item.updatedAt && !Number.isNaN(Date.parse(item.updatedAt))) {
						dated.push({ title: item.title, to, at: item.updatedAt });
						// Chapters past the first are the plan columns (Next/Later)
						if (chapterIndex > 0) planned.push({ title: item.title, at: item.updatedAt });
					}
				}
			});
		}
		dated.sort((a, b) => (a.at < b.at ? 1 : -1));
		planned.sort((a, b) => (a.at < b.at ? 1 : -1));
		const oldest = planned.length ? planned[planned.length - 1] : null;
		return {
			byColumn: Object.fromEntries(byColumn),
			// No move history exists in the schema — this is recency of change,
			// not a from/to migration. The origin column is unknown by design.
			recentlyMoved: dated.slice(0, 5).map((d) => ({ title: d.title, from: '—', to: d.to, at: timeAgo(d.at) })),
			oldestPlanned: oldest ? { title: oldest.title, age: timeAgo(oldest.at) } : null
		};
	} catch {
		return empty();
	}
}
