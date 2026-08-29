<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AlertTriangle, Box, Compass, FileText, Heart, History, Inbox, Search, UserSquare } from 'reicon-svelte';
	import { Button, Chip, Input, StatePanel } from '$lib/components/ui';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { workspaceSearchKinds } from '$lib/search/search';
	import { workspaceSearchRecords } from '$lib/search/workspace-search';
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

	let query = $state(page.url.searchParams.get('q') ?? '');
	let kind = $state<'All' | SearchKind>('All');
	let results = $derived(workspaceSearchRecords(query, kind));

	function submitSearch() {
		const next = query.trim();
		void goto(next ? `/workspace/search?q=${encodeURIComponent(next)}` : '/workspace/search', { replaceState: true });
	}

	function labelFor(record: SearchRecord): string {
		return record.kind === 'Doc' ? 'Help' : record.kind === 'Decision' ? 'Product decision' : record.kind === 'Problem' ? 'Problem' : record.kind === 'Incident' ? 'Service problem' : record.kind === 'Proof' ? 'Customer story' : record.kind === 'Release' ? 'Product update' : record.kind;
	}

	function filterLabel(item: 'All' | SearchKind): string {
		return item === 'All' ? 'Everything' : item === 'Doc' ? 'Help' : item === 'Decision' ? 'Decisions' : item === 'Problem' ? 'Problems' : item === 'Incident' ? 'Service problems' : item === 'Proof' ? 'Customer stories' : item === 'Release' ? 'Product updates' : `${item}s`;
	}
</script>

<svelte:head>
	<title>{query ? `Search: ${query}` : 'Workspace search'} | Product Client</title>
	<meta name="description" content="Search private Product Client workspace records." />
</svelte:head>

<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Find your product work." description="Search feedback, problems, decisions, updates, help, and service problems from one private index." />

	<form class="search-form" onsubmit={(event) => { event.preventDefault(); submitSearch(); }}>
		<Search size={18} weight="Outline" class="shrink-0 opacity-60" aria-hidden="true" />
		<label for="workspace-search-input" class="sr-only">Search your product work</label>
		<Input id="workspace-search-input" bind:value={query} placeholder="Try a product, request, problem, or person" class="!bg-transparent !px-1 !py-2.5 !ring-0" />
		{#if query}<Button type="button" variant="ghost" size="sm" onclick={() => { query = ''; submitSearch(); }}>Clear</Button>{/if}
		<Button type="submit" variant="primary" size="sm">Search</Button>
	</form>

	<div class="filters" role="group" aria-label="Search type filters">
		{#each workspaceSearchKinds as item}
			<button type="button" onclick={() => (kind = item)} aria-pressed={kind === item}>{filterLabel(item)}</button>
		{/each}
		{#if query.trim()}<span>{results.length} result{results.length === 1 ? '' : 's'}</span>{/if}
	</div>

	{#if !query.trim()}
		<section class="search-start" aria-labelledby="search-start-title">
			<p class="section-kicker">Search your workspace</p>
			<h2 id="search-start-title">Find the context behind the work.</h2>
			<p>Search the words people used, then open the feedback, decision, update, or help page connected to them.</p>
		</section>
	{:else if results.length === 0}
		<StatePanel icon={Search} title={`Nothing found for “${query}”`} description="Try a product, request, problem, update, help page, or person." actionLabel="Add this as feedback" actionHref="/feedback/new" size="section" />
	{:else}
		<section class="results" aria-label="Workspace search results">
			{#each results as result (result.kind + result.id)}
				{@const Icon = icons[result.kind]}
				<a href={result.href} class="result">
					<span class="result-icon" aria-hidden="true"><Icon size={17} weight="Outline" /></span>
					<span class="result-copy"><span class="result-title"><strong>{result.title}</strong><Chip size="xs">{labelFor(result)}</Chip>{#if result.status}<small>{result.status}</small>{/if}</span><span class="result-subtitle">{result.subtitle}</span><span class="result-description">{result.description}</span>{#if result.relationPreview}<span class="result-relation">Related: {result.relationPreview}</span>{/if}</span>
				</a>
			{/each}
		</section>
	{/if}
</div>

<style>
	.search-form { display: flex; align-items: center; gap: 10px; margin-top: 23px; padding: 7px 8px 7px 15px; border: 1px solid var(--pc-border-strong); border-radius: 16px; background: var(--pc-surface-2); transition: border-color 150ms ease, background-color 150ms ease; }
	.search-form:focus-within { border-color: rgba(198, 254, 30, .38); background: var(--pc-surface); }
	.search-form :global(input) { min-width: 0; flex: 1; }
	.filters { display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 16px 0 23px; scrollbar-width: none; }
	.filters::-webkit-scrollbar { display: none; }
	.filters button { min-height: 34px; flex: 0 0 auto; padding: 0 11px; border: 0; border-radius: 999px; color: var(--pc-text-muted); background: var(--pc-surface-2); font-size: 11px; cursor: pointer; transition: background-color 150ms ease, color 150ms ease; }
	.filters button:hover, .filters button[aria-pressed="true"] { color: var(--pc-bg); background: var(--pc-text); }
	.filters span { margin-left: auto; flex: 0 0 auto; color: var(--pc-text-faint); font-size: 11px; }
	.search-start { padding: 30px 24px; border-radius: 18px; background: var(--pc-surface-2); }
	.section-kicker { margin: 0 0 7px; color: var(--pc-accent-light); font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
	.search-start h2 { margin: 0; color: var(--pc-text); font-size: 20px; font-weight: 500; letter-spacing: -.04em; }
	.search-start p:last-child { max-width: 54ch; margin: 9px 0 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.6; }
	.results { display: grid; gap: 7px; padding-bottom: 40px; }
	.result { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 12px; padding: 13px; border-radius: 15px; color: var(--pc-text-muted); background: var(--pc-surface-2); transition: background-color 150ms ease, transform 150ms ease; }
	.result:hover { color: var(--pc-text); background: var(--pc-surface); transform: translateY(-1px); }
	.result-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); }
	.result-copy { min-width: 0; }
	.result-title { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
	.result-title strong { color: inherit; font-size: 13px; font-weight: 500; }
	.result-title small { color: var(--pc-text-faint); font-size: 10px; }
	.result-subtitle, .result-description, .result-relation { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.result-subtitle { margin-top: 3px; color: var(--pc-text-muted); font-size: 11px; }
	.result-description { margin-top: 5px; color: var(--pc-text-muted); opacity: .7; font-size: 11px; }
	.result-relation { margin-top: 5px; color: var(--pc-accent-light); opacity: .8; font-size: 10px; }
	@media (max-width: 560px) { .search-form { margin-top: 18px; }.search-form :global(button) { padding-inline: 12px; }.search-start { padding: 24px 18px; } }
	@media (prefers-reduced-motion: reduce) { .search-form, .filters button, .result { transition: none; } }
</style>
