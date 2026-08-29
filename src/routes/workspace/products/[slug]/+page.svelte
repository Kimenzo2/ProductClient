<script lang="ts">
	import { page } from '$app/state';
	import { ArrowRight, Box, FileText, Heart, History, Inbox, Map, Export } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import DecisionThread from '$lib/components/workspace/DecisionThread.svelte';
	import { decisionThreads, productBySlug, releasesForProduct, feedbackForProduct, incidentForProduct, docs, proofs, roadmapItems } from '$lib/data/workspace';

	let slug = $derived(page.params.slug ?? '');
	let product = $derived(productBySlug(slug));
	let releases = $derived(releasesForProduct(slug));
	let feedback = $derived(feedbackForProduct(slug));
	let incidents = $derived(incidentForProduct(slug));
	let productDocs = $derived(docs.filter((doc) => doc.productSlug === slug));
	let productProof = $derived(proofs.filter((proof) => proof.productSlug === slug));
	let roadmap = $derived(roadmapItems.filter((item) => item.productSlug === slug));
	let threads = $derived(decisionThreads.filter((thread) => thread.productSlug === slug));
</script>

<svelte:head><title>{product?.name ?? slug} overview | Product Client</title></svelte:head>

{#if product}
	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
		<header class="border-b border-[var(--pc-border-strong)]/30 pb-6 pt-8 sm:pt-10"><a href="/workspace/products" class="text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">Products</a><div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div class="flex min-w-0 items-center gap-3"><img src={product.avatar} alt="" class="size-14 rounded-[16px] object-cover outline outline-1 -outline-offset-1 outline-white/10" /><div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Product overview</p><h1 class="mt-1 truncate text-[24px] font-medium tracking-tight md:text-[30px]">{product.name}</h1><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{product.makerName} · {product.status} · {product.category}</p></div></div><div class="flex flex-wrap gap-2"><Button href={product.publicPath} variant="outline" size="sm"><Export size={14} weight="Outline" /> Public page</Button><Button href="/studio" variant="primary" size="sm">Write product update</Button></div></div><p class="mt-4 max-w-[64ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-80">{product.tagline ?? 'One place for this product, its decisions, its updates, and its help pages.'}</p></header>

		{#if threads.length > 0}<section class="pb-1 pt-6" aria-labelledby="product-thread-title"><div class="mb-3 flex items-end justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Product story</p><h2 id="product-thread-title" class="mt-1 text-lg font-medium">Why this work matters</h2></div><a href="/workspace/decisions" class="text-xs text-[var(--pc-accent-light)]">All product decisions</a></div><DecisionThread thread={threads[0]} compact /></section>{/if}

		<div class="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
			<main class="min-w-0 space-y-7">
				<section aria-labelledby="release-title"><div class="mb-3 flex items-end justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Updates</p><h2 id="release-title" class="mt-1 text-lg font-medium">Recent product updates</h2></div><a href="/workspace/releases" class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">All product updates <ArrowRight size={13} weight="Outline" /></a></div><div class="space-y-2">{#each releases.slice(0, 3) as release (release.id)}<a href={release.workspacePath} class="block rounded-[16px] bg-[var(--pc-surface-2)] p-4 transition-[background-color] duration-150 hover:bg-[var(--pc-surface)]"><div class="flex items-center gap-2"><Chip size="xs" variant="accent">{release.type}</Chip><span class="text-[10px] text-[var(--pc-text-faint)]">{release.postedAt}</span><span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">{release.reads} reads</span></div><h3 class="mt-2 text-[13px] font-medium">{release.title}</h3><p class="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">{release.description}</p></a>{/each}{#if releases.length === 0}<Card padding="md"><p class="text-sm font-medium">No product updates yet.</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-65">Write the first update when something changes for customers.</p></Card>{/if}</div></section>
				<section aria-labelledby="signals-title"><div class="mb-3 flex items-end justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">Learn</p><h2 id="signals-title" class="mt-1 text-lg font-medium">Customer feedback</h2></div><a href="/workspace/inbox" class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Open inbox <ArrowRight size={13} weight="Outline" /></a></div><div class="grid gap-2 sm:grid-cols-2">{#each feedback as item (item.id)}<a href={item.workspacePath} class="rounded-[15px] bg-[var(--pc-surface-2)] p-3 transition-[background-color] duration-150 hover:bg-[var(--pc-surface)]"><div class="flex items-center gap-2"><Inbox size={14} weight="Outline" class="opacity-55" /><Chip size="xs">{item.type}</Chip><span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">{item.status}</span></div><h3 class="mt-2 text-[13px] font-medium leading-snug">{item.title}</h3><p class="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-65">{item.body}</p></a>{/each}{#if feedback.length === 0}<Card padding="md" class="sm:col-span-2"><p class="text-sm font-medium">No feedback linked yet.</p></Card>{/if}</div></section>
			</main>
			<aside class="space-y-4"><Card padding="md"><div class="flex items-center justify-between"><h2 class="text-[13px] font-medium">Related pages</h2><Box size={15} weight="Outline" class="opacity-45" /></div><div class="mt-3 space-y-1">{#each [{ label: 'Roadmap', value: roadmap.length, href: '/workspace/roadmap', icon: Map }, { label: 'Help docs', value: productDocs.length, href: '/workspace/docs', icon: FileText }, { label: 'Service problems', value: incidents.length, href: '/workspace/incidents', icon: History }, { label: 'Customer stories', value: productProof.length, href: '/workspace/proof', icon: Heart }] as surface}<a href={surface.href} class="flex items-center gap-2 rounded-[10px] px-2 py-2 text-xs transition-colors hover:bg-[var(--pc-surface)]"><surface.icon size={14} weight="Outline" class="opacity-55" /><span class="flex-1">{surface.label}</span><span class="tabular-nums text-[var(--pc-text-faint)]">{surface.value}</span><ArrowRight size={12} weight="Outline" class="opacity-40" /></a>{/each}</div></Card>
				{#if incidents.length > 0}<Card padding="md"><div class="flex items-center gap-2"><History size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Service problems</h2></div>{#each incidents.slice(0, 2) as incident (incident.id)}<a href={incident.workspacePath} class="mt-3 block rounded-[11px] bg-[var(--pc-surface)] p-3"><div class="flex items-center gap-2"><span class="size-1.5 rounded-full" style:background={incident.status === 'Resolved' ? 'var(--color-green-600)' : 'var(--color-yellow-600)'}></span><span class="text-[11px] font-medium">{incident.status}</span><span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">{incident.severity}</span></div><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-75">{incident.title}</p></a>{/each}</Card>{/if}
			</aside>
		</div>
	</div>
{:else}
	<div class="px-4 sm:px-6"><StatePanel size="page" icon={Box} title="Product not found" description={`There is no product overview for “${slug}”.`} actionLabel="Back to products" actionHref="/workspace/products" class="pc-enter" /></div>
{/if}

<style>
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
