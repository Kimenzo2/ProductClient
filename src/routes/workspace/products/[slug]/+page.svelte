<script lang="ts">
	import { page } from '$app/state';
	import { ArrowRight, Box, Export } from 'reicon-svelte';
	import { Button, Chip, StatePanel } from '$lib/components/ui';
	import DecisionThread from '$lib/components/workspace/DecisionThread.svelte';
	import { decisionThreads, productBySlug, releasesForProduct } from '$lib/data/workspace';

	let slug = $derived(page.params.slug ?? '');
	let product = $derived(productBySlug(slug));
	let releases = $derived(releasesForProduct(slug));
	let threads = $derived(decisionThreads.filter((thread) => thread.productSlug === slug));
</script>

<svelte:head><title>{product?.name ?? slug} overview | Product Client</title></svelte:head>

{#if product}
	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
		<header class="border-b border-[var(--pc-border-strong)]/30 pb-6 pt-8 sm:pt-10"><a href="/workspace/products" class="text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Products</a><div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div class="flex min-w-0 items-center gap-3"><img src={product.avatar} alt="" class="size-14 rounded-[16px] object-cover outline outline-1 -outline-offset-1 outline-white/10" /><div class="min-w-0"><h1 class="mt-1 truncate text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px]">{product.name}</h1><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{product.makerName} · {product.status} · {product.category}</p></div></div><div class="flex flex-wrap gap-2"><Button href={product.publicPath} variant="outline" size="sm"><Export size={14} weight="Outline" /> Public page</Button><Button href="/studio" variant="primary" size="sm">Write product update</Button></div></div><p class="mt-4 max-w-[60ch] text-[13px] leading-[1.6] tracking-[-0.003em] text-[var(--pc-text-muted)] text-pretty">{product.tagline ?? 'One place for this product, its decisions, its updates, and its help pages.'}</p></header>

		{#if threads.length > 0}<section class="pb-1 pt-6" aria-labelledby="product-thread-title"><div class="mb-3 flex items-end justify-between gap-3"><div><h2 id="product-thread-title" class="mt-1 text-lg font-medium">Why this work matters</h2></div><a href="/workspace/decisions" class="text-xs text-[var(--pc-accent-light)]">All product decisions</a></div><DecisionThread thread={threads[0]} compact /></section>{/if}

		<div class="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
			<main class="min-w-0 space-y-7">
				<section aria-labelledby="release-title"><div class="mb-3 flex items-end justify-between gap-3"><div><h2 id="release-title" class="mt-1 text-lg font-medium">Recent product updates</h2></div><a href="/workspace/releases" class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">All product updates <ArrowRight size={13} weight="Outline" /></a></div><div class="space-y-2">{#each releases.slice(0, 3) as release (release.id)}<a href={release.workspacePath} class="block rounded-[16px] bg-[var(--pc-surface-2)] p-4 transition-[background-color] duration-150 hover:bg-[var(--pc-surface)]"><div class="flex items-center gap-2"><Chip size="xs" variant="accent">{release.type}</Chip><span class="text-[10px] text-[var(--pc-text-faint)]">{release.postedAt}</span><span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">{release.reads} reads</span></div><h3 class="mt-2 text-[13px] font-medium">{release.title}</h3><p class="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">{release.description}</p></a>{/each}{#if releases.length === 0}<div class="min-h-[200px] py-4" aria-hidden="true"></div>{/if}</div></section>
			</main>
			<aside class="space-y-4" aria-hidden="true"><div class="min-h-[200px] py-4" aria-hidden="true"></div><div class="min-h-[200px] py-4" aria-hidden="true"></div></aside>
		</div>
	</div>
{:else}
	<div class="px-4 sm:px-6"><StatePanel size="page" icon={Box} title="Product not found" description={`There is no product overview for “${slug}”.`} actionLabel="Back to products" actionHref="/workspace/products" class="pc-enter" /></div>
{/if}


