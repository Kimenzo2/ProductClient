import { buildPublicSearchRecords } from '$lib/data/public';
import { querySearchRecords } from '$lib/search/query';
import type { SearchKind, SearchRecord } from '$lib/search/types';

export const publicSearchKinds: Array<'All' | SearchKind> = ['All', 'Product', 'Release', 'Doc', 'Feedback', 'Incident', 'Proof', 'Maker'];
export const workspaceSearchKinds: Array<'All' | SearchKind> = ['All', 'Product', 'Problem', 'Decision', 'Release', 'Doc', 'Feedback', 'Incident', 'Roadmap', 'Proof', 'Maker'];
const publicRecords = buildPublicSearchRecords();

export function publicSearchRecords(query: string, kind: 'All' | SearchKind = 'All'): SearchRecord[] {
	return querySearchRecords(publicRecords, query, kind);
}

export function popularSearches(): string[] {
	return ['AI', 'Developer tools', 'Release notes', 'Customer feedback', 'Service problems', 'Supabase'];
}
