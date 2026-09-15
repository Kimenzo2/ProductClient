<script lang="ts">
import { onMount } from 'svelte';
import { Box } from 'reicon-svelte';
import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';

let products = $derived(activeProductStore.products);
let filtered = $derived(products);

	onMount(() => { void hydrateActiveProduct(); });
</script>

<svelte:head><title>Products | Product Client workspace</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader title="Products" description="Each product has one place for its public page, feedback, updates, help docs, and team decisions." actionLabel="Add product" actionHref="/submit" />
	<div class="grid gap-3 pt-5 pb-10 sm:grid-cols-2 xl:grid-cols-3">
		{#each filtered as product (product.id)}
			{@const workspacePath = `/workspace/products/${product.slug}`}
			<Card padding="md" class="group flex min-h-[184px] flex-col">
				<div class="flex items-start gap-3">
					<span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[13px] bg-[var(--pc-surface-2)] outline outline-1 -outline-offset-1 outline-white/10">
						{#if product.avatar || product.logo_url}<img src={product.avatar ?? product.logo_url ?? ''} alt="" class="size-11 rounded-[13px] object-cover" />{:else}<Box size={16} weight="Outline" class="text-[var(--pc-text-muted)]" aria-hidden="true" />{/if}
					</span>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2"><h2 class="truncate text-[14px] font-medium">{product.name}</h2>{#if product.status}<Chip size="xs">{product.status}</Chip>{/if}</div>
						{#if product.category}<p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{product.category}</p>{/if}
					</div>
				</div>
				<p class="mt-4 line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-75">{product.tagline ?? 'One place for planning, updates, and customer feedback.'}</p>
				<div class="mt-auto flex items-center gap-2 pt-5"><Button href={workspacePath} variant="primary" size="sm"><Box size={14} weight="Outline" /> Open product</Button></div>
			</Card>
		{/each}
	</div>
	{#if filtered.length === 0}
		<StatePanel
			icon={Box}
			title={products.length === 0 ? 'No products yet' : 'No products found'}
			description={products.length === 0 ? 'Add your first product to get started.' : 'No products to display.'}
			actionLabel={products.length === 0 ? 'Add product' : undefined}
			actionHref={products.length === 0 ? '/submit' : undefined}
			class="sm:col-span-2 xl:col-span-3"
		/>
	{/if}
</div>
