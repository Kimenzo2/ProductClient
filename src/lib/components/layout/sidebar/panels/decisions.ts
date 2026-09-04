import { Map } from 'reicon-svelte';
import { decisionThreads } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const decisionsPanel: PanelDef = {
	label: 'Decisions',
	icon: Map,
	description: 'Choices behind the product',
	links: [
		{ label: 'All decisions', href: '/workspace/decisions', badge: decisionThreads.length },
		{ label: 'In decision', href: '/workspace/decisions', badge: decisionThreads.filter((d) => d.status === 'In decision').length },
		{ label: 'Shipped', href: '/workspace/decisions', badge: decisionThreads.filter((d) => d.status === 'Shipped').length }
	],
	recent: decisionThreads.slice(0, 3).map((t) => ({ label: t.title, subtitle: `${t.productName} · ${t.status}`, href: `/workspace/decisions/${t.id}` })),
	action: { label: 'New decision', href: '/workspace/decisions' }
};
