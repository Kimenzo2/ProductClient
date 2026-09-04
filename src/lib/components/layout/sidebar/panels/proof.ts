import { Heart } from 'reicon-svelte';
import { proofs } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const proofPanel: PanelDef = {
	label: 'Proof',
	icon: Heart,
	description: 'Customer stories and social proof',
	links: [
		{ label: 'All stories', href: '/workspace/proof', badge: proofs.length },
		{ label: 'Approved', href: '/workspace/proof', badge: proofs.filter((p) => p.status === 'Approved').length },
		{ label: 'Needs review', href: '/workspace/proof', badge: proofs.filter((p) => p.status === 'Needs review').length }
	],
	recent: proofs.slice(0, 3).map((p) => ({ label: p.quote.slice(0, 42) + '…', subtitle: `${p.name} · ${p.status}`, href: `/workspace/proof#${p.id}` })),
	action: { label: 'Add story', href: '/workspace/proof' }
};
