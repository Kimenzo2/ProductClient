import { ChartBar } from 'reicon-svelte';
import { searchGaps } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const analyticsPanel: PanelDef = {
	label: 'Analytics',
	icon: ChartBar,
	description: 'Measure how releases and docs perform',
	links: [
		{ label: 'Overview', href: '/workspace/analytics' },
		{ label: 'Releases', href: '/workspace/releases' },
		{ label: 'Help searches', href: '/workspace/docs' }
	],
	recent: searchGaps.slice(0, 3).map((g) => ({ label: g.query, subtitle: `${g.searches} searches · ${g.status}`, href: '/workspace/analytics' })),
	action: { label: 'View analytics', href: '/workspace/analytics' }
};
