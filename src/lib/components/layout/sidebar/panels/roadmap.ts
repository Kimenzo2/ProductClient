import { Map } from 'reicon-svelte';
import { roadmapItems } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const roadmapPanel: PanelDef = {
	label: 'Roadmap',
	icon: Map,
	description: 'Plan what is now, next, and later',
	links: [
		{ label: 'Board view', href: '/workspace/roadmap' },
		{ label: 'Now', href: '/workspace/roadmap', badge: roadmapItems.filter((r) => r.status === 'Now').length },
		{ label: 'Next', href: '/workspace/roadmap', badge: roadmapItems.filter((r) => r.status === 'Next').length },
		{ label: 'Shipped', href: '/workspace/roadmap', badge: roadmapItems.filter((r) => r.status === 'Shipped').length }
	],
	recent: roadmapItems.slice(0, 3).map((r) => ({ label: r.title, subtitle: `${r.productName} · ${r.status}`, href: `/workspace/roadmap#${r.id}` })),
	action: { label: 'Add item', href: '/workspace/roadmap' }
};
