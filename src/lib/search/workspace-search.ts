import { buildSearchRecords } from '$lib/data/workspace';
import { querySearchRecords } from '$lib/search/query';
import type { SearchKind, SearchRecord } from '$lib/search/types';
const workspaceRecords = buildSearchRecords();

export function workspaceSearchRecords(query: string, kind: 'All' | SearchKind = 'All'): SearchRecord[] {
	return querySearchRecords(workspaceRecords, query, kind).map((record) => ({
		...record,
		href: record.workspaceHref ?? record.href
	}));
}
