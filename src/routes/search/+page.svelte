<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AlertTriangle, Box, Compass, FileText, Heart, History, Inbox, Search, UserSquare } from 'reicon-svelte';
import { Button, Chip, Input, StatePanel } from '$lib/components/ui';
import { publicSearchKinds, publicSearchRecords, popularSearches } from '$lib/search/search';
import type { SearchKind, SearchRecord } from '$lib/search/types';

	const icons: Record<SearchKind, typeof Search> = {
		Product: Box,
		Decision: Compass,
		Problem: Compass,
		Release: History,
		Feedback: Inbox,
		Roadmap: Compass,
		Doc: FileText,
		Incident: AlertTriangle,
		Proof: Heart,
		Maker: UserSquare
	};

	let q = $state(page.url.searchParams.get('q') ?? '');
	let kind = $state<'All' | SearchKind>('All');
	let results = $derived(publicSearchRecords(q, kind));

	function submitSearch() {
		const next = q.trim();
		void goto(next ? `/search?q=${encodeURIComponent(next)}` : '/search', { replaceState: true });
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			submitSearch();
		}
	}

	function labelFor(record: SearchRecord) {
		return record.kind === 'Doc' ? 'Help' : record.kind === 'Decision' ? 'Product decision' : record.kind === 'Problem' ? 'Problem' : record.kind === 'Incident' ? 'Service problem' : record.kind === 'Proof' ? 'Customer story' : record.kind === 'Release' ? 'Product update' : record.kind;
	}

	function filterLabel(item: 'All' | SearchKind) {
		return item === 'All' ? 'Everything' : item === 'Doc' ? 'Help' : item === 'Decision' ? 'Decisions' : item === 'Problem' ? 'Problems' : item === 'Incident' ? 'Service problems' : item === 'Proof' ? 'Customer stories' : item === 'Release' ? 'Product updates' : `${item}s`;
	}
</script>

<svelte:head>
	<title>{q ? `Search: ${q}` : 'Search'} | Product Client</title>
	<meta name="description" content="Search products, updates, help pages, feedback, and customer stories." />
</svelte:head>

<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
	<header class="pb-5 pt-8 sm:pt-10">
		
		<h1 class="mt-2 text-[24px] font-medium leading-tight tracking-tight md:text-[30px]">Find the answer, not just the page.</h1>
		<p class="mt-2 max-w-[58ch] text-[13px] leading-relaxed text-[var(--pc-text-muted)] opacity-75">Search products, product updates, customer feedback, help pages, and customer stories in one place.</p>
	</header>

	<form class="flex items-center gap-2 rounded-[16px] bg-[var(--pc-surface-2)] p-2 transition-[background-color,box-shadow] duration-150 focus-within:bg-[var(--pc-surface)] focus-within:ring-[0.5px] focus-within:ring-[var(--pc-focus-ring)]/40" onsubmit={(event) => { event.preventDefault(); submitSearch(); }}>
		<Search size={18} weight="Outline" class="ml-2 shrink-0 opacity-55" />
		<label class="sr-only" for="search-input">Search all Product Client records</label>
		<Input id="search-input" bind:value={q} onkeydown={handleKeydown} placeholder='Try "AI", "release notes", "customer feedback", or a product name' class="!bg-transparent !px-1 !py-2.5 !ring-0" />
		{#if q}<Button type="button" variant="ghost" size="sm" onclick={() => { q = ''; submitSearch(); }}>Clear</Button>{/if}
		<Button type="submit" variant="primary" size="sm">Search</Button>
	</form>

	<div class="flex gap-1.5 overflow-x-auto py-5 scrollbar-none" role="group" aria-label="Search type filters">
		{#each publicSearchKinds as item}
			<button type="button" onclick={() => (kind = item)} aria-pressed={kind === item} class="h-9 shrink-0 rounded-full px-3 text-xs transition-[background-color,color] duration-150 {kind === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)]'}">{filterLabel(item)}</button>
		{/each}
		<span class="ml-auto hidden shrink-0 self-center text-xs text-[var(--pc-text-faint)] sm:block">{results.length} record{results.length === 1 ? '' : 's'}</span>
	</div>

	{#if !q.trim()}
		<section class="rounded-[18px] bg-[var(--pc-surface-2)] p-5 sm:p-6" aria-labelledby="popular-title">
			<div class="flex items-center justify-between gap-3"><div><h2 id="popular-title" class="mt-1 text-lg font-medium">Common searches</h2></div><span class="text-xs text-[var(--pc-text-faint)]">{results.length} available</span></div>
			<div class="mt-4 flex flex-wrap gap-2">{#each popularSearches() as term}<button type="button" onclick={() => { q = term; submitSearch(); }} class="rounded-full bg-[var(--pc-surface)] px-3 py-2 text-xs text-[var(--pc-text-muted)] transition-[background-color,color] duration-150 hover:bg-[var(--pc-border-strong)] hover:text-[var(--pc-text)]">{term}</button>{/each}</div>
		</section>
	{:else if results.length === 0}
		<StatePanel icon={Search} title={`Nothing found for “${q}”`} description="Try a product, update, customer request, problem, or status word." actionLabel="Add this as feedback" actionHref="/feedback/new" size="section" class="pc-enter" />
	{:else}
		<section class="space-y-1.5 pb-10" aria-label="Search results">
			{#each results as result (result.kind + result.id)}
				{@const Icon = icons[result.kind]}
				<a href={result.href} target={result.href.startsWith('http') ? '_blank' : undefined} rel={result.href.startsWith('http') ? 'noopener noreferrer' : undefined} class="group flex items-start gap-3 rounded-[16px] bg-[var(--pc-surface-2)] p-3 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface)] active:scale-[0.99] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]">
					<span class="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><Icon size={17} weight="Outline" /></span>
					<span class="min-w-0 flex-1"><span class="flex flex-wrap items-center gap-2"><strong class="text-[13px] font-medium group-hover:text-[var(--pc-accent-light)]">{result.title}</strong><Chip size="xs">{labelFor(result)}</Chip>{#if result.status}<span class="text-[10px] text-[var(--pc-text-faint)]">{result.status}</span>{/if}</span><span class="mt-0.5 block truncate text-xs text-[var(--pc-text-muted)] opacity-70">{result.subtitle}</span><span class="mt-1 block line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-60">{result.description}</span>{#if result.relationPreview}<span class="mt-1 block truncate text-[10px] text-[var(--pc-accent-light)] opacity-80">Related: {result.relationPreview}</span>{/if}</span>
				</a>
			{/each}
		</section>
	{/if}
</div>

<style>
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
	.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
