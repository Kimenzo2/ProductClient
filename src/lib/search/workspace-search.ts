import { buildSearchRecords } from '#lib/data/workspace.js';
import { querySearchRecords } from '#lib/search/query.js';
import type { SearchKind, SearchRecord } from '#lib/search/types.js';
const workspaceRecords = buildSearchRecords();

export function workspaceSearchRecords(query: string, kind: 'All' | SearchKind = 'All'): SearchRecord[] {
	return querySearchRecords(workspaceRecords, query, kind).map((record) => ({
		...record,
		href: record.workspaceHref ?? record.href
	}));
}
