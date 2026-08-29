<script lang="ts">
	import { ArrowRight, Book, FileText, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Card, Input, StatePanel } from '$lib/components/ui';
	import { docs, searchGaps } from '$lib/data/workspace';

	let query = $state('');
	let filtered = $derived(docs.filter((doc) => `${doc.title} ${doc.description} ${doc.productName} ${doc.section}`.toLowerCase().includes(query.toLowerCase())));
	let unanswered = $derived(searchGaps.filter((gap) => gap.status !== 'Answered'));
</script>

<svelte:head><title>Help docs | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Help docs" description="Give customers and developers one clear place to learn how the product works." actionLabel="Write help content" actionHref="/studio" />
	<div class="relative max-w-[620px] py-5"><Search size={16} weight="Outline" class="pointer-events-none absolute left-3 top-8 opacity-55" /><Input bind:value={query} placeholder="Find a help page or product..." aria-label="Search help docs" class="pl-9 text-base sm:text-sm" /></div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Documentation pages">
			{#each filtered as doc (doc.productSlug + doc.slug)}<EntityRow href={doc.publicPath} kind="Doc" title={doc.title} subtitle={`${doc.productName} · ${doc.section}`} description={doc.description} status="Published" meta={`Updated ${doc.updatedAt}`} />{/each}
			{#if filtered.length === 0}<StatePanel icon={FileText} title="No help pages found" description="Try a broader search." />{/if}
		</section>
		<aside><Card padding="md"><div class="flex items-center gap-2"><Book size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Help content</h2></div><div class="mt-4 space-y-3 text-xs"><div class="flex justify-between"><span class="text-[var(--pc-text-muted)]">Published pages</span><span class="font-medium">{docs.length}</span></div><div class="flex justify-between"><span class="text-[var(--pc-text-muted)]">Questions without a clear answer</span><span class="font-medium text-[var(--pc-accent-light)]">{unanswered.length}</span></div><div class="flex justify-between"><span class="text-[var(--pc-text-muted)]">Help comments to review</span><span class="font-medium">2</span></div></div><a href="/workspace/analytics" class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">See help page results <ArrowRight size={13} weight="Outline" /></a></Card>
			{#if unanswered.length > 0}<Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Questions people could not answer</p><div class="mt-3 space-y-2">{#each unanswered as gap (gap.id)}<a href={`/docs/${gap.productSlug}/${gap.linkedDocSlug}`} class="group block rounded-[11px] bg-[var(--pc-surface)] p-2.5"><p class="text-xs font-medium group-hover:text-[var(--pc-accent-light)]">“{gap.query}”</p><p class="mt-1 text-[10px] text-[var(--pc-text-muted)] opacity-70">{gap.searches} searches · {gap.status}</p></a>{/each}</div><a href="/workspace/analytics" class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">See all search results <ArrowRight size={13} weight="Outline" /></a></Card>{/if}</aside>
	</div>
</div>
