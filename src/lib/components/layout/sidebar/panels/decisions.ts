import { BranchDown } from 'reicon-svelte';
import { decisionThreads } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const decisionsPanel: PanelDef = {
	label: 'Decisions',
	icon: BranchDown,
	description: 'Choices behind the product',
	links: [
		{ label: 'All decisions', href: '/workspace/decisions' },
		{ label: 'In decision', href: '/workspace/decisions?status=In+decision' },
		{ label: 'Shipped', href: '/workspace/decisions?status=Shipped' }
	],
	recent: decisionThreads.slice(0, 3).map((t) => ({ label: t.title, subtitle: `${t.productName} · ${t.status}`, href: `/workspace/decisions/${t.id}` })),
	action: { label: 'New decision', href: '/workspace/decisions' }
};
