<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, Clock, Export, Map } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import RelationList from '$lib/components/workspace/RelationList.svelte';
	import StatusBadge from '$lib/components/workspace/StatusBadge.svelte';
	import VisibilityBadge from '$lib/components/workspace/VisibilityBadge.svelte';
	import { decisionThreadById } from '$lib/data/workspace';

	let id = $derived(page.params.id ?? '');
	let thread = $derived(decisionThreadById(id));
	let tab = $state<'Overview' | 'Evidence' | 'Activity'>('Overview');

	const statusTone = $derived(thread?.status === 'Shipped' ? 'success' : thread?.status === 'In decision' ? 'accent' : 'warning');
	const nextStep = $derived(thread?.status === 'In decision' ? 'Review choices' : thread?.status === 'Planned' ? 'Prepare update' : 'Check results');
</script>

<svelte:head><title>{thread?.title ?? 'Product decision'} | Product Client</title></svelte:head>

{#if thread}
	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
		<header class="border-b border-[var(--pc-border-strong)]/30 pb-6 pt-8 sm:pt-10">
			<a href="/workspace/decisions" class="inline-flex min-h-8 items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> Product decisions</a>
			<div class="mt-5 flex flex-wrap items-center gap-2"><Chip size="xs" variant="accent">Product decision</Chip><StatusBadge label={thread.status === 'In decision' ? 'Choosing now' : thread.status} tone={statusTone} /><VisibilityBadge label={thread.visibility} /></div>
			<div class="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="min-w-0"><h1 class="mt-1 max-w-[32ch] text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px]">{thread.title}</h1><p class="mt-2 max-w-[60ch] text-[13px] leading-[1.6] tracking-[-0.003em] text-[var(--pc-text-muted)] text-pretty">{thread.problem}</p></div>
				<div class="flex shrink-0 flex-wrap gap-2"><Button href={`/workspace/products/${thread.productSlug}`} variant="outline" size="sm"><Map size={14} weight="Outline" aria-hidden="true" /> Product overview</Button><Button href={`/p/${thread.productSlug}`} variant="primary" size="sm"><Export size={14} weight="Outline" aria-hidden="true" /> Customer preview</Button></div>
			</div>
		</header>

		<div class="flex gap-1 overflow-x-auto border-b border-[var(--pc-border-strong)]/30 py-3" role="tablist" aria-label="Product decision sections">
			{#each ['Overview', 'Evidence', 'Activity'] as item}
				<button type="button" role="tab" aria-selected={tab === item} onclick={() => (tab = item as typeof tab)} class="inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs transition-[background-color,color] duration-150 {tab === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'}">{item === 'Evidence' ? 'What led us here' : item === 'Activity' ? 'History' : item}</button>
			{/each}
		</div>

		<div class="grid gap-6 py-6 pb-12 lg:grid-cols-[minmax(0,1fr)_300px]">
			<main class="min-w-0 space-y-4">
				{#if tab === 'Overview'}
					<div class="min-h-[200px] py-4" aria-hidden="true"></div>
				{:else}
					<div class="min-h-[200px] py-4" aria-hidden="true"></div>
				{/if}

			</main>

			<aside class="space-y-4">
				<div class="min-h-[200px] py-4" aria-hidden="true"></div>
			</aside>
		</div>
	</div>
{:else}
	<div class="px-4 sm:px-6"><StatePanel size="page" icon={Map} title="Product decision not found" description="We could not find this decision in the workspace." actionLabel="Back to product decisions" actionHref="/workspace/decisions" class="pc-enter" /></div>
{/if}
