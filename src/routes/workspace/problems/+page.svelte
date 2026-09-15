<script lang="ts">
import { ArrowRight, Compass, Inbox, Users2 } from 'reicon-svelte';
import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
import { problems } from '$lib/data/workspace';
import { browser } from '$app/environment';
import { onMount } from 'svelte';

let filter = $state<'All' | 'Needs context' | 'Ready for decision' | 'Planned' | 'Resolved'>('All');
let isPreview = $state(false);
onMount(() => {
	isPreview = browser && import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');
});
let sourceProblems = $derived(isPreview ? problems : []);
let filtered = $derived(sourceProblems.filter((problem) => filter === 'All' || problem.status === filter));
</script>

<svelte:head><title>Problems | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader title="Problems" description="Turn repeated feedback into a clear statement of what people need and why it matters." actionLabel="Describe a problem" actionHref="/workspace/problems/new" />

	<div class="flex justify-end py-5">
		<span class="text-xs text-[var(--pc-text-faint)]">{filtered.length} problem{filtered.length === 1 ? '' : 's'}</span>
	</div>

	<div class="flex gap-1.5 overflow-x-auto pb-5" role="group" aria-label="Problem status filters">
		{#each ['All', 'Needs context', 'Ready for decision', 'Planned', 'Resolved'] as item}
			<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{item === 'All' ? 'Everything' : item}</button>
		{/each}
	</div>

	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_300px]">
		<section class="space-y-3" aria-label="Problem records">
			{#each filtered as problem (problem.id)}
				<a href={problem.workspacePath} class="group block rounded-[18px] bg-[var(--pc-surface-2)] p-4 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface)] active:scale-[0.99] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]">
					<div class="flex items-start gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><Compass size={17} weight="Outline" aria-hidden="true" /></span><span class="min-w-0 flex-1"><span class="flex flex-wrap items-center gap-2"><strong class="text-[14px] font-medium group-hover:text-[var(--pc-accent-light)]">{problem.title}</strong><Chip size="xs">{problem.status}</Chip></span><span class="mt-1 block text-xs text-[var(--pc-text-muted)] opacity-70">{problem.productName} · {problem.productArea} · {problem.owner}</span><span class="mt-2 block text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] max-w-[60ch] text-pretty antialiased">{problem.statement}</span></span></div>
					<div class="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--pc-border-strong)]/25 pt-3 text-[11px] text-[var(--pc-text-faint)]"><span class="inline-flex items-center gap-1"><Users2 size={13} weight="Outline" aria-hidden="true" /> {problem.affectedAudience}</span><span class="inline-flex items-center gap-1"><Inbox size={13} weight="Outline" aria-hidden="true" /> {problem.feedbackIds.length} source{problem.feedbackIds.length === 1 ? '' : 's'}</span><span class="ml-auto inline-flex items-center gap-1 text-[var(--pc-accent-light)]">Open problem <ArrowRight size={12} weight="Outline" aria-hidden="true" /></span></div>
				</a>
			{/each}
			{#if filtered.length === 0}<StatePanel icon={Compass} title="No problems found" description="No problems match the selected filter." actionLabel="Show all" onAction={() => (filter = 'All')} />{/if}
		</section>

		<aside class="space-y-4">
			<div class="min-h-[180px] py-4" aria-hidden="true"></div>
			<Card padding="md"><div class="mt-4 space-y-3 text-xs"><div><p class="font-medium">Needs context</p><p class="mt-1 text-[var(--pc-text-muted)] opacity-70">We need more information before choosing a direction.</p></div><div><p class="font-medium">Ready for decision</p><p class="mt-1 text-[var(--pc-text-muted)] opacity-70">The need is clear enough to compare options.</p></div><div><p class="font-medium">Planned</p><p class="mt-1 text-[var(--pc-text-muted)] opacity-70">A product decision is connected to upcoming work.</p></div></div></Card>
		</aside>
	</div>
</div>
