import { History } from 'reicon-svelte';
import { releases } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const releasesPanel: PanelDef = {
	label: 'Releases',
	icon: History,
	description: 'Ship updates and share what changed',
	links: [
		{ label: 'All releases', href: '/workspace/releases' },
		{ label: 'Live updates', href: '/workspace/releases?status=Live' },
		{ label: 'By product', href: '/workspace/products' }
	],
	recent: releases.slice(0, 3).map((r) => ({ label: r.title, subtitle: `${r.productName} · ${r.type}`, href: r.workspacePath })),
	action: { label: 'New release', href: '/submit' }
};
