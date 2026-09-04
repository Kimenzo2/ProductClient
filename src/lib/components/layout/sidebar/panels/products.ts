import { Box } from 'reicon-svelte';
import { products } from '$lib/data/workspace';
import type { PanelDef } from '../types';

export const productsPanel: PanelDef = {
	label: 'Products',
	icon: Box,
	description: 'Public pages and workspace for each product',
	links: [
		{ label: 'All products', href: '/workspace/products', badge: products.length },
		{ label: 'Live', href: '/workspace/products', badge: products.filter((p) => p.status === 'Live').length },
		{ label: 'Beta', href: '/workspace/products', badge: products.filter((p) => p.status === 'Beta').length },
		{ label: 'Roadmap', href: '/workspace/roadmap' }
	],
	recent: products.slice(0, 4).map((p) => ({ label: p.name, subtitle: `${p.makerName} · ${p.category ?? 'Product'}`, href: p.workspacePath })),
	action: { label: 'Add product', href: '/studio' }
};
