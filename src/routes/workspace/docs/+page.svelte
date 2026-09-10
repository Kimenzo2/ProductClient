<script lang="ts">
	import { ArrowRight, Book, FileText, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Card, Input, StatePanel } from '$lib/components/ui';
	import { hostedDocsPage } from '$lib/config/tenant';
	import { docs, searchGaps } from '$lib/data/workspace';
	import { onMount } from 'svelte';
	import { trackAnalyticsEvent } from '$lib/data/analytics';

	let query = $state('');
	let filtered = $derived(docs.filter((doc) => `${doc.title} ${doc.description} ${doc.productName} ${doc.section}`.toLowerCase().includes(query.toLowerCase())));
	let unanswered = $derived(searchGaps.filter((gap) => gap.status !== 'Answered'));

	onMount(() => { void trackAnalyticsEvent('docs.view', { path: '/workspace/docs' }); });
	let lastQuery = '';
	$effect(() => {
		const q = query.trim();
		if (!q || q === lastQuery) return;
		lastQuery = q;
		void trackAnalyticsEvent('docs.search', { query: q, path: '/workspace/docs' });
		if (filtered.length === 0) void trackAnalyticsEvent('docs.search_no_results', { query: q, path: '/workspace/docs' });
	});
</script>

<svelte:head><title>Help docs | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader title="Help docs" description="Give customers and developers one clear place to learn how the product works." actionLabel="Write help content" actionHref="/studio" secondaryActionLabel="Open docs" secondaryActionHref={hostedDocsPage.href} secondaryActionExternal />
	<div class="relative max-w-[620px] py-5"><Search size={16} weight="Outline" class="pointer-events-none absolute left-3 top-8 opacity-55" /><Input bind:value={query} placeholder="Find a help page or product..." aria-label="Search help docs" class="pl-9 text-base sm:text-sm" /></div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Documentation pages">
			{#each filtered as doc (doc.productSlug + doc.slug)}<div onclick={() => void trackAnalyticsEvent('docs.search_click', { query, path: doc.publicPath })} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void trackAnalyticsEvent('docs.search_click', { query, path: doc.publicPath }); } }} role="button" tabindex="0"><EntityRow href={doc.publicPath} kind="Doc" title={doc.title} subtitle={`${doc.productName} · ${doc.section}`} description={doc.description} status="Published" meta={`Updated ${doc.updatedAt}`} /></div>{/each}
			{#if filtered.length === 0}<StatePanel icon={FileText} title="No help pages found" description="Try a broader search." />{/if}
		</section>
		<aside><div class="min-h-[200px] py-4" aria-hidden="true"></div>
			{#if unanswered.length > 0}<div class="min-h-[200px] py-4" aria-hidden="true"></div>{/if}</aside>
	</div>
</div>