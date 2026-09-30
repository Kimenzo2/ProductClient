import { supabase } from '$lib/supabaseClient';
import type { AnalyticsRange } from '$lib/data/analytics-range.svelte';
import { timeAgo } from '$lib/data/feedbackInbox';

export type IncidentsAnalytics = { metrics: { open: number; resolved: number; ttfu: string | null; ttr: string | null }; bySeverity: {severity:string;count:number}[]; recent: {title:string;severity:string;opened:string}[]; missingFix:number; missingDoc:number };

const RANGE_DAYS: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

function empty(): IncidentsAnalytics {
	return { metrics: { open: 0, resolved: 0, ttfu: null, ttr: null }, bySeverity: [], recent: [], missingFix: 0, missingDoc: 0 };
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function formatDuration(ms: number | null): string | null {
	if (ms === null || ms < 0) return null;
	const minutes = Math.floor(ms / 60_000);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 48) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}

type IncidentRow = { id: string; title: string; severity: string | null; status: string; started_at: string; resolved_at: string | null };

export async function fetchIncidentsAnalytics(_userId: string, range: AnalyticsRange): Promise<IncidentsAnalytics> {
	if (!supabase) return empty();
	try {
		// Tenant-scoped twice: own memberships first, then an explicit filter.
		// Any failure resolves to empty, never to an unscoped read.
		const { data: memberships, error: membershipError } = await supabase.from('tenant_members').select('tenant_id');
		if (membershipError || !memberships) return empty();
		const tenantIds = [...new Set(((memberships ?? []) as Array<{ tenant_id: string }>).map((m) => m.tenant_id).filter(Boolean))];
		if (tenantIds.length === 0) return empty();

		const since = new Date(Date.now() - RANGE_DAYS[range] * 86_400_000).toISOString();
		const { data, error } = await supabase
			.from('incidents')
			.select('id, title, severity, status, started_at, resolved_at')
			.in('tenant_id', tenantIds)
			.gte('started_at', since)
			.order('started_at', { ascending: false })
			.limit(200);
		if (error) return empty();
		const rows = ((data ?? []) as IncidentRow[]).filter((r) => r.started_at);
		if (rows.length === 0) return empty();

		const open = rows.filter((r) => r.status !== 'resolved').length;
		const resolvedRows = rows.filter((r) => r.status === 'resolved');
		const severityMap = new Map<string, number>();
		for (const r of rows) severityMap.set(r.severity ?? 'Untriaged', (severityMap.get(r.severity ?? 'Untriaged') ?? 0) + 1);

		const ids = rows.map((r) => r.id);
		const [{ data: updates }, { data: workItems }] = await Promise.all([
			supabase.from('incident_updates').select('incident_id, published_at, created_at').in('incident_id', ids).order('published_at', { ascending: true }),
			supabase.from('incident_work_items').select('incident_id, kind, status').in('incident_id', ids)
		]);
		const firstUpdateByIncident = new Map<string, number>();
		for (const u of ((updates ?? []) as Array<{ incident_id: string; published_at: string | null; created_at: string }>)) {
			if (firstUpdateByIncident.has(u.incident_id)) continue;
			const at = Date.parse(u.published_at ?? u.created_at);
			if (!Number.isNaN(at)) firstUpdateByIncident.set(u.incident_id, at);
		}
		const ttfu = formatDuration(
			median(
				rows
					.map((r) => {
						const first = firstUpdateByIncident.get(r.id);
						const start = Date.parse(r.started_at);
						return first !== undefined && !Number.isNaN(start) ? first - start : null;
					})
					.filter((v): v is number => v !== null)
			)
		);
		const ttr = formatDuration(
			median(
				resolvedRows
					.map((r) => {
						const start = Date.parse(r.started_at);
						const end = r.resolved_at ? Date.parse(r.resolved_at) : NaN;
						return !Number.isNaN(start) && !Number.isNaN(end) ? end - start : null;
					})
					.filter((v): v is number => v !== null)
			)
		);

		const workByIncident = new Map<string, Array<{ kind: string; status: string }>>();
		for (const w of ((workItems ?? []) as Array<{ incident_id: string; kind: string; status: string }>)) {
			workByIncident.set(w.incident_id, [...(workByIncident.get(w.incident_id) ?? []), { kind: w.kind, status: w.status }]);
		}
		let missingFix = 0;
		let missingDoc = 0;
		for (const r of resolvedRows) {
			const work = workByIncident.get(r.id) ?? [];
			if (!work.some((w) => w.kind === 'Product work')) missingFix += 1;
			if (!work.some((w) => w.kind === 'Customer review' && w.status === 'Done')) missingDoc += 1;
		}

		return {
			metrics: { open, resolved: resolvedRows.length, ttfu, ttr },
			bySeverity: Array.from(severityMap.entries())
				.map(([severity, count]) => ({ severity, count }))
				.sort((a, b) => b.count - a.count),
			recent: rows.slice(0, 5).map((r) => ({ title: r.title, severity: r.severity ?? 'Untriaged', opened: timeAgo(r.started_at) })),
			missingFix,
			missingDoc
		};
	} catch {
		return empty();
	}
}
