<script lang="ts">
	import { Box, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Button, Card, Chip, Input, StatePanel } from '$lib/components/ui';
	import { products } from '$lib/data/workspace';

	let query = $state('');
	let filtered = $derived(products.filter((product) => `${product.name} ${product.category ?? ''} ${product.makerName}`.toLowerCase().includes(query.trim().toLowerCase())));
</script>

<svelte:head><title>Products | Product Client workspace</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Products" description="Each product has one place for its public page, feedback, updates, help docs, and team decisions." actionLabel="Add product" actionHref="/studio" />
	<div class="flex items-center gap-2 py-5"><Search size={16} weight="Outline" class="ml-1 opacity-55" /><Input bind:value={query} placeholder="Find a product..." class="max-w-[360px]" /><span class="ml-auto text-xs text-[var(--pc-text-faint)]">{filtered.length} products</span></div>
	<div class="grid gap-3 pb-10 sm:grid-cols-2 xl:grid-cols-3">
		{#each filtered as product (product.slug)}
			<Card padding="md" class="group flex min-h-[184px] flex-col">
				<div class="flex items-start gap-3"><img src={product.avatar} alt="" class="size-11 rounded-[13px] object-cover outline outline-1 -outline-offset-1 outline-white/10" /><div class="min-w-0 flex-1"><div class="flex items-center gap-2"><h2 class="truncate text-[14px] font-medium">{product.name}</h2><Chip size="xs" variant={product.status === 'Beta' ? 'accent' : 'default'}>{product.status}</Chip></div><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{product.makerName} · {product.category}</p></div></div>
				<p class="mt-4 line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-75">{product.tagline ?? 'One place for planning, updates, and customer feedback.'}</p>
				<div class="mt-auto flex items-center gap-2 pt-5"><Button href={product.workspacePath} variant="primary" size="sm"><Box size={14} weight="Outline" /> Open product</Button><a href={product.publicPath} class="ml-auto text-xs text-[var(--pc-accent-light)] hover:underline">View public page</a></div>
			</Card>
		{/each}
	</div>
	{#if filtered.length === 0}<StatePanel icon={Box} title="No products match that filter" description="Try a maker name or category." class="sm:col-span-2 xl:col-span-3" />{/if}
</div>


