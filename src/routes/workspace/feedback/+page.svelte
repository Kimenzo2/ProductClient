<script lang="ts">
	import { ArrowRight, Inbox, Search, Sparkles } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, Card, Input, StatePanel } from '$lib/components/ui';
	import { feedback } from '$lib/data/workspace';

	let query = $state('');
	let filter = $state<'All' | 'New' | 'Reviewed' | 'Planned' | 'Resolved'>('All');
	let filtered = $derived(
		feedback.filter((item) => {
			const haystack = `${item.title} ${item.body} ${item.productName} ${item.from}`.toLowerCase();
			return (filter === 'All' || item.status === filter) && haystack.includes(query.trim().toLowerCase());
		})
	);
</script>

<svelte:head><title>Feedback | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Understand" title="Feedback" description="Keep the customer's own words while you turn them into a clear problem, a choice, and a follow-up." actionLabel="Add feedback" actionHref="/feedback/new" />

	<div class="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:max-w-[380px]"><Search size={15} weight="Outline" class="pointer-events-none absolute left-3 top-3 opacity-55" aria-hidden="true" /><label for="feedback-filter" class="sr-only">Filter feedback</label><Input id="feedback-filter" bind:value={query} placeholder="Find a request, person, or product" class="pl-9 text-base sm:text-sm" /></div>
		<span class="text-xs text-[var(--pc-text-faint)]">{filtered.length} item{filtered.length === 1 ? '' : 's'}</span>
	</div>

	<div class="flex gap-1.5 overflow-x-auto pb-5" role="group" aria-label="Feedback states">
		{#each ['All', 'New', 'Reviewed', 'Planned', 'Resolved'] as item}
			<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{item === 'All' ? 'Everything' : item}</button>
		{/each}
	</div>

	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_300px]">
		<section class="space-y-2" aria-label="Feedback records">
			{#each filtered as item (item.id)}
				<EntityRow href={item.workspacePath} kind="Feedback" title={item.title} subtitle={`${item.productName} · ${item.type} · ${item.priority} priority`} description={item.body} status={item.status} meta={`${item.from} · ${item.postedAt}`} />
			{/each}
			{#if filtered.length === 0}
				<StatePanel icon={Inbox} title="No feedback matches" description="Try a product, person, or broader state." actionLabel="Clear filters" onAction={() => { query = ''; filter = 'All'; }} />
			{/if}
		</section>

		<aside class="space-y-4">
			<Card padding="md"><div class="flex items-center gap-2"><Sparkles size={15} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-[13px] font-medium">Make feedback useful</h2></div><p class="mt-3 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-75">A request tells you what someone wants. It does not always tell you the best fix. Keep the original words, then describe the problem they point to.</p><a href="/workspace/decisions" class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">See product decisions <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a></Card>
			<Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Feedback status</p><div class="mt-4 space-y-3 text-xs"><div class="flex items-center justify-between"><span class="text-[var(--pc-text-muted)]">New feedback</span><span class="tabular-nums font-medium">{feedback.filter((item) => item.status === 'New').length}</span></div><div class="flex items-center justify-between"><span class="text-[var(--pc-text-muted)]">Connected to a choice</span><span class="tabular-nums font-medium">2</span></div><div class="flex items-center justify-between"><span class="text-[var(--pc-text-muted)]">Waiting for an answer</span><span class="tabular-nums font-medium text-[var(--pc-accent-light)]">3</span></div></div></Card>
		</aside>
	</div>
</div>
