<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Box } from 'reicon-svelte';
import { Button, Chip, StatePanel } from '$lib/components/ui';
import { activeProductStore, hydrateActiveProduct, setActiveProduct } from '$lib/stores/activeProduct.svelte';
import ProductLogo from '$lib/components/brand/ProductLogo.svelte';

	let slug = $derived(page.params.slug ?? '');
	let product = $derived(activeProductStore.products.find((p) => p.slug === slug) ?? null);

	onMount(() => { void hydrateActiveProduct(); });

	// Keep the switcher in sync when visiting a product page directly — URL slug drives active product
	$effect(() => {
		const p = product;
		const active = activeProductStore.activeProduct;
		if (p && active && active.slug !== p.slug) {
			void setActiveProduct(p.id);
		} else if (p && !active) {
			void setActiveProduct(p.id);
		}
	});
</script>

<svelte:head><title>{product?.name ?? slug} overview | Product Client</title></svelte:head>

{#if product}
	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
		<header class="border-b border-[var(--pc-border-strong)]/30 pb-6 pt-8 sm:pt-10">
			<a href="/workspace/products" class="text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Products</a>
			<div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div class="flex min-w-0 items-center gap-3">
					<ProductLogo src={product.logo_url ?? product.avatar} size={56} shape="square" class="outline outline-1 -outline-offset-1 outline-white/10" />
					<div class="min-w-0">
						<h1 class="mt-1 truncate text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px] text-wrap-balance">{product.name}</h1>
						<p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{product.status} · {product.category ?? 'Uncategorized'}</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button href="/submit" variant="primary" size="sm">Write product update</Button>
					{#if product.github_url}<Button href={product.github_url} target="_blank" variant="outline" size="sm">GitHub <span aria-hidden="true">↗</span></Button>{/if}
				</div>
			</div>
			{#if product.tagline}<p class="mt-4 max-w-[60ch] text-[13px] leading-[1.6] tracking-[-0.003em] text-[var(--pc-text-muted)] text-pretty">{product.tagline}</p>{/if}
		</header>
	</div>
{:else}
	<div class="px-4 sm:px-6">
		<StatePanel size="page" icon={Box} title={activeProductStore.loading ? 'Loading…' : 'Product not found'} description={activeProductStore.loading ? 'Fetching your products.' : `There is no product overview for “${slug}”.`} actionLabel={activeProductStore.loading ? undefined : 'Back to products'} actionHref={activeProductStore.loading ? undefined : '/workspace/products'} class="pc-enter" />
	</div>
{/if}
