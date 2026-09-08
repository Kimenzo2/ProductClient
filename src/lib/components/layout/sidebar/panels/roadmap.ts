import { Edit, Roadmap } from 'reicon-svelte';
import { roadmapItems } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const roadmapPanel: PanelDef = {
	label: 'Roadmap',
	icon: Roadmap,
	description: 'Plan what is now, next, and later',
	links: [
		{ label: 'Board view', href: '/workspace/roadmap' },
		{ label: 'Editor', href: '/workspace/roadmap/editor', icon: Edit },
		{ label: 'Now', href: '/workspace/roadmap?status=Now' },
		{ label: 'Next', href: '/workspace/roadmap?status=Next' },
		{ label: 'Shipped', href: '/workspace/roadmap?status=Shipped' }
	],
	recent: roadmapItems.slice(0, 3).map((r) => ({ label: r.title, subtitle: `${r.productName} · ${r.status}`, href: `/workspace/roadmap#${r.id}` })),
	action: { label: 'Add item', href: '/workspace/roadmap' }
};
