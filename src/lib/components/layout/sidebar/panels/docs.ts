import { FileText } from 'reicon-svelte';
import { hostedDocsPage } from '$lib/config/tenant';
import type { PanelDef } from '../types';

export const docsPanel: PanelDef = {
	label: 'Docs',
	icon: FileText,
	description: 'Help guides for customers and developers',
	links: [
		{ label: 'Overview', href: '/workspace/docs' },
		{ label: 'All help pages', href: '/workspace/docs?view=all' },
		{ label: 'Unanswered searches', href: '/workspace/docs?filter=unanswered' },
		{ label: 'Open docs', href: hostedDocsPage.href, external: true }
	],
	recent: [],
	action: { label: 'Open editor', href: '/workspace/docs/editor' }
};
