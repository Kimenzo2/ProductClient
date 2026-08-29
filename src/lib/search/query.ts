import type { SearchKind, SearchRecord } from '$lib/search/types';

export function querySearchRecords(records: SearchRecord[], query: string, kind: 'All' | SearchKind = 'All'): SearchRecord[] {
	const normalized = query.trim().toLowerCase();
	return records
		.filter((record) => kind === 'All' || record.kind === kind)
		.filter((record) => {
			if (!normalized) return true;
			return [record.title, record.subtitle, record.description, ...record.keywords].join(' ').toLowerCase().includes(normalized);
		})
		.sort((a, b) => {
			if (!normalized) return a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title);
			const aTitle = a.title.toLowerCase().startsWith(normalized) ? 0 : 1;
			const bTitle = b.title.toLowerCase().startsWith(normalized) ? 0 : 1;
			return aTitle - bTitle || a.kind.localeCompare(b.kind);
		});
}
