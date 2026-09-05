<script lang="ts">
	import { ArrowRight, CheckCircle, Heart, MessageDots, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Button, Card, Chip, Input, StatePanel } from '$lib/components/ui';
	import { proofs } from '$lib/data/workspace';

	let filter = $state<'All' | 'Approved' | 'Needs review'>('All');
	let query = $state('');
	let approved = $state<Record<string, boolean>>({});
	let filtered = $derived(proofs.filter((proof) => {
		const haystack = `${proof.quote} ${proof.name} ${proof.role} ${proof.productName} ${proof.tags.join(' ')}`.toLowerCase();
		const displayStatus = approved[proof.id] ? 'Approved' : proof.status;
		return (filter === 'All' || displayStatus === filter) && haystack.includes(query.trim().toLowerCase());
	}));
</script>

<svelte:head><title>Customer stories | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Customer stories" description="Turn real customer quotes into approved stories people can understand and share." actionLabel="Preview customer stories" actionHref="/wall/tetra-proof" />
	<div class="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"><div class="relative w-full sm:max-w-[380px]"><Search size={15} weight="Outline" class="pointer-events-none absolute left-3 top-3 opacity-55" aria-hidden="true" /><label for="proof-filter" class="sr-only">Search customer stories</label><Input id="proof-filter" bind:value={query} placeholder="Find a quote, person, or product" class="pl-9 text-base sm:text-sm" /></div><span class="text-xs text-[var(--pc-text-faint)]">{filtered.length} stor{filtered.length === 1 ? 'y' : 'ies'}</span></div>
	<div class="flex flex-wrap items-center gap-2 pb-5" role="group" aria-label="Proof filters">{#each ['All', 'Approved', 'Needs review'] as item}<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex min-h-9 items-center rounded-full px-3 text-xs transition-[background-color,color,transform] duration-150 active:scale-[0.96] {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{item}</button>{/each}</div>
	<div class="grid gap-3 pb-10 md:grid-cols-2">
		{#each filtered as proof (proof.id)}
			{@const canApprove = proof.consent !== 'Needs confirmation'}
			<Card padding="lg" class="flex h-full flex-col" id={proof.id}>
				<div class="flex items-center justify-between gap-3"><div class="flex items-center gap-2"><img src={proof.avatar} alt={proof.name} class="size-8 rounded-full object-cover" /><div><p class="text-xs font-medium">{proof.name}</p><p class="text-[10px] text-[var(--pc-text-faint)]">{proof.role}</p></div></div>{#if (approved[proof.id] ? 'Approved' : proof.status) === 'Approved'}<CheckCircle size={16} weight="Outline" class="text-[var(--pc-accent-light)]" aria-hidden="true" />{:else}<MessageDots size={16} weight="Outline" class="opacity-50" aria-hidden="true" />{/if}</div>
				<blockquote class="mt-5 flex-1 text-[15px] leading-relaxed tracking-tight">"{proof.quote}"</blockquote>
				<div class="mt-5 flex flex-wrap items-center gap-1.5"><Chip variant="accent" size="xs">{proof.productName}</Chip>{#each proof.tags as tag}<Chip size="xs">{tag}</Chip>{/each}<span class="ml-auto text-[10px] text-[var(--pc-text-faint)]">{proof.source}</span></div>
				<div class="mt-4 rounded-[11px] bg-[var(--pc-surface)] p-3 text-[11px] leading-relaxed"><p><span class="text-[var(--pc-text-faint)]">Permission:</span> <span class={proof.consent === 'Confirmed' ? 'text-[var(--pc-accent-light)]' : 'text-[var(--pc-text)]'}>{proof.consent ?? 'Not recorded'}</span></p><p class="mt-1 text-[var(--pc-text-muted)]"><span class="text-[var(--pc-text-faint)]">Can share:</span> {proof.allowedUses?.join(', ') ?? 'No uses recorded'}</p>{#if proof.outcome}<p class="mt-1 text-[var(--pc-text-muted)]"><span class="text-[var(--pc-text-faint)]">What it shows:</span> {proof.outcome}</p>{/if}</div>
				<div class="mt-4 flex items-center justify-between gap-3 border-t border-[var(--pc-border-strong)]/25 pt-3"><a href={`/workspace/products/${proof.productSlug}`} class="text-[11px] text-[var(--pc-accent-light)]">See this product <ArrowRight size={12} weight="Outline" class="inline" aria-hidden="true" /></a>{#if (approved[proof.id] ? 'Approved' : proof.status) === 'Needs review'}{#if canApprove}<Button variant="ghost" size="sm" onclick={() => (approved = { ...approved, [proof.id]: true })}>Approve quote</Button>{:else}<span class="max-w-[17ch] text-right text-[10px] leading-relaxed text-[var(--pc-text-muted)]">Confirm permission before approving</span>{/if}{:else}<span class="inline-flex items-center gap-1 text-[10px] text-[var(--pc-accent-light)]"><CheckCircle size={12} weight="Outline" aria-hidden="true" /> Approved quote</span>{/if}</div>
			</Card>
		{/each}
		{#if filtered.length === 0}<StatePanel icon={Heart} title="No customer stories match" description="Try a different product, person, or status." actionLabel="Clear filters" onAction={() => { query = ''; filter = 'All'; }} class="col-span-full" />{/if}
	</div>
	<div class="flex flex-wrap items-center gap-3 border-t border-[var(--pc-border-strong)]/30 py-6"><Heart size={17} weight="Outline" class="opacity-55" /><p class="text-xs text-[var(--pc-text-muted)] opacity-70">Approved quotes can appear on a Wall of Love, product page, case study, or product update.</p><Button href="/wall/tetra-proof" variant="ghost" size="sm">Preview public stories <ArrowRight size={13} weight="Outline" /></Button></div>
</div>
