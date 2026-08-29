export type SearchKind = 'Product' | 'Release' | 'Feedback' | 'Roadmap' | 'Decision' | 'Problem' | 'Doc' | 'Incident' | 'Proof' | 'Maker';

export type SearchRecord = {
	id: string;
	kind: SearchKind;
	title: string;
	subtitle: string;
	description: string;
	href: string;
	publicHref?: string;
	workspaceHref?: string;
	status?: string;
	keywords: string[];
	relationPreview?: string;
};
