<script lang="ts">
	import { ArrowRight, CheckCircle, Map, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import DecisionThread from '$lib/components/workspace/DecisionThread.svelte';
	import { Button, Card, Chip, Input, StatePanel } from '$lib/components/ui';
	import { decisionThreads } from '$lib/data/workspace';

	let query = $state('');
	let filter = $state<'All' | 'In decision' | 'Planned' | 'Shipped'>('All');
	let filtered = $derived(
		decisionThreads.filter((thread) => {
			const matchesFilter = filter === 'All' || thread.status === filter;
			const haystack = `${thread.title} ${thread.problem} ${thread.productName} ${thread.owner}`.toLowerCase();
			return matchesFilter && haystack.includes(query.trim().toLowerCase());
		})
	);
</script>

<svelte:head>
	<title>Product decisions | Product Client</title>
	<meta name="description" content="Follow product decisions from customer feedback to the roadmap, updates, help pages, and follow-up." />
</svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Choose" title="Product decisions" description="See why something matters, what people said, what we chose, and what changed." actionLabel="Add feedback" actionHref="/feedback/new" />

	<section class="mt-6 rounded-[22px] bg-[var(--pc-surface-2)] p-4 ring-1 ring-[var(--pc-border-strong)]/30 sm:p-5" aria-labelledby="thread-principle-title">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-start gap-3">
				<span class="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[var(--pc-accent)] text-white"><Map size={18} weight="Outline" aria-hidden="true" /></span>
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">How this works</p>
					<h2 id="thread-principle-title" class="mt-1 text-base font-medium">One product story, from feedback to change.</h2>
					<p class="mt-1 max-w-[58ch] text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-75">Each product decision keeps the original feedback, the choice the team makes, the update, and the help page together.</p>
				</div>
			</div>
			<a href="/search?q=Product%20decision" class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Search product decisions <ArrowRight size={13} weight="Outline" /></a>
		</div>
	</section>

	<div class="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:max-w-[360px]">
			<Search size={15} weight="Outline" class="pointer-events-none absolute left-3 top-3 opacity-55" aria-hidden="true" />
			<label for="decision-filter" class="sr-only">Filter product decisions</label>
			<Input id="decision-filter" bind:value={query} placeholder="Find a problem, product, or owner" class="pl-9 text-base sm:text-sm" />
		</div>
		<div class="flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Product decision states">
			{#each ['All', 'In decision', 'Planned', 'Shipped'] as item}
				<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">
					{#if item === 'Shipped'}<CheckCircle size={13} weight="Outline" aria-hidden="true" />{:else}<Map size={13} weight="Outline" aria-hidden="true" />{/if}
					{item === 'All' ? 'Everything' : item === 'In decision' ? 'Choosing now' : item}
				</button>
			{/each}
		</div>
	</div>

	<section class="space-y-3 pb-10" aria-label="Product decisions">
		{#each filtered as thread (thread.id)}
			<DecisionThread {thread} />
		{/each}
		{#if filtered.length === 0}
			<StatePanel icon={Map} title="No product decisions match" description="Try a product, owner, or a different status." actionLabel="Clear filters" onAction={() => { query = ''; filter = 'All'; }} />
		{/if}
	</section>
</div>
