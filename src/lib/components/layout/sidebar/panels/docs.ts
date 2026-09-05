import { FileText } from 'reicon-svelte';
import { hostedDocsPage } from '$lib/config/tenant';
import { docs, searchGaps } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const docsPanel: PanelDef = {
	label: 'Docs',
	icon: FileText,
	description: 'Help guides for customers and developers',
	links: [
		{ label: 'Overview', href: '/workspace/docs' },
		{ label: 'All help pages', href: '/workspace/docs', badge: docs.length },
		{ label: 'Unanswered searches', href: '/workspace/docs', badge: searchGaps.filter((g) => g.status !== 'Answered').length },
		{ label: 'Product guides', href: '/workspace/products' },
		{ label: 'Open docs', href: hostedDocsPage.href, external: true }
	],
	recent: docs.slice(0, 4).map((d) => ({ label: d.title, subtitle: `${d.productName} · ${d.section}`, href: d.publicPath })),
	action: { label: 'Write help content', href: '/studio' }
};
