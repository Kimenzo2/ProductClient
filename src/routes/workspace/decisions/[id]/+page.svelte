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
				<div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">{thread.productName} · {thread.owner}</p><h1 class="mt-1 max-w-[30ch] text-[28px] font-medium leading-tight tracking-tight sm:text-[38px]">{thread.title}</h1><p class="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-80">{thread.problem}</p></div>
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
					<Card padding="lg">
						<div class="flex items-center gap-2"><Map size={16} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-base font-medium">What should improve</h2></div>
						<p class="mt-4 max-w-[68ch] text-sm leading-7 text-[var(--pc-text-muted)]">{thread.outcome}</p>
						<div class="mt-6 grid gap-3 sm:grid-cols-3">
							<div class="rounded-[15px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] uppercase tracking-[0.12em] text-[var(--pc-text-faint)]">What people told us</p><p class="mt-2 text-lg font-medium tabular-nums">{thread.feedbackCount ?? '—'}</p><p class="mt-0.5 text-[11px] text-[var(--pc-text-muted)]">customer comments</p></div>
							<div class="rounded-[15px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] uppercase tracking-[0.12em] text-[var(--pc-text-faint)]">How sure we are</p><p class="mt-2 text-lg font-medium">{thread.confidence}</p><p class="mt-0.5 text-[11px] text-[var(--pc-text-muted)]">based on attached feedback</p></div>
							<div class="rounded-[15px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] uppercase tracking-[0.12em] text-[var(--pc-text-faint)]">Next step</p><p class="mt-2 text-lg font-medium">{nextStep}</p><p class="mt-0.5 text-[11px] text-[var(--pc-text-muted)]">before we tell customers</p></div>
						</div>
					</Card>
					{#if thread.goal}<Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">What success looks like</p><p class="mt-2 text-sm leading-relaxed text-[var(--pc-text-muted)]">{thread.goal}</p>{#if thread.affectedAudience}<p class="mt-3 text-xs text-[var(--pc-text-muted)] opacity-70">For: {thread.affectedAudience}</p>{/if}</Card>{/if}
					{#if thread.options && thread.options.length > 0}<Card padding="md"><div class="flex items-center justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Choices</p><h2 class="mt-1 text-[15px] font-medium">What we are choosing between</h2></div><span class="text-[10px] text-[var(--pc-text-faint)]">{thread.options.length} options</span></div><div class="mt-4 space-y-2">{#each thread.options as option (option.id)}<div class="rounded-[14px] bg-[var(--pc-surface)] p-3 {option.chosen ? 'ring-1 ring-[var(--pc-accent)]/35' : ''}"><div class="flex flex-wrap items-center gap-2"><p class="text-xs font-medium">{option.label}</p>{#if option.chosen}<Chip size="xs" variant="accent">Current choice</Chip>{/if}</div><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)]">{option.summary}</p><p class="mt-2 text-[11px] leading-relaxed text-[var(--pc-text-muted)] opacity-70">Trade-off: {option.tradeoff}</p><div class="mt-3 flex flex-wrap gap-1.5 text-[10px] text-[var(--pc-text-faint)]"><span class="rounded-full bg-[var(--pc-surface-2)] px-2 py-1">Impact {option.impact}</span><span class="rounded-full bg-[var(--pc-surface-2)] px-2 py-1">Work needed {option.effort}</span><span class="rounded-full bg-[var(--pc-surface-2)] px-2 py-1">Risk {option.risk}</span></div></div>{/each}</div></Card>{/if}
					<Card padding="md"><div class="flex items-center justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Steps so far</p><h2 class="mt-1 text-[15px] font-medium">From feedback to change</h2></div><span class="text-[10px] text-[var(--pc-text-faint)]">4 steps</span></div><div class="mt-5 grid gap-3 sm:grid-cols-4">{#each [{label:'Feedback received', detail:'Original customer message', done:true}, {label:'Problem described', detail:'Need made clear', done:true}, {label:'Choosing', detail:'Options are being compared', done:false}, {label:'Tell people', detail:'Preview before we publish', done:false}] as stage, index}<div class="relative rounded-[14px] bg-[var(--pc-surface)] p-3 {stage.done ? 'ring-1 ring-[var(--pc-accent)]/25' : ''}"><span class="grid size-6 place-items-center rounded-full {stage.done ? 'bg-[var(--pc-accent)] text-white' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-faint)]'} text-[10px] font-medium">{stage.done ? '✓' : index + 1}</span><p class="mt-3 text-xs font-medium">{stage.label}</p><p class="mt-1 text-[11px] leading-relaxed text-[var(--pc-text-muted)] opacity-70">{stage.detail}</p></div>{/each}</div></Card>
				{:else if tab === 'Evidence'}
					<Card padding="lg"><div class="flex items-center justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">What led us here</p><h2 class="mt-1 text-base font-medium">Why this matters</h2></div><Button variant="ghost" size="sm" href="/workspace/inbox">Open inbox <ArrowRight size={13} weight="Outline" aria-hidden="true" /></Button></div><p class="mt-3 max-w-[66ch] text-sm leading-relaxed text-[var(--pc-text-muted)]">This decision keeps feedback, the product, past updates, and help pages together. Read the original feedback before changing how sure we are or what we promise.</p>{#if thread.assumptions && thread.assumptions.length > 0}<div class="mt-6 rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-faint)]">What we are assuming</p><ul class="mt-2 space-y-2 text-xs leading-relaxed text-[var(--pc-text-muted)]">{#each thread.assumptions as assumption}<li class="flex gap-2"><span aria-hidden="true">•</span><span>{assumption}</span></li>{/each}</ul></div>{/if}{#if thread.dissent}<div class="mt-3 rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-text-faint)]">What we might be missing</p><p class="mt-2 text-xs leading-relaxed text-[var(--pc-text-muted)]">{thread.dissent}</p></div>{/if}<div class="mt-6"><RelationList relations={thread.relations} label="Related pages" /></div></Card>
				{:else}
					<Card padding="lg"><div class="flex items-center gap-2"><Clock size={16} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-base font-medium">Activity history</h2></div><div class="mt-5 space-y-5"><div class="flex gap-3"><span class="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--pc-accent)]"></span><div><p class="text-xs font-medium">Product decision updated</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">{thread.updatedAt} · Maya reviewed the customer feedback.</p></div></div><div class="flex gap-3"><span class="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--pc-surface-2)]"></span><div><p class="text-xs font-medium">Roadmap link added</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">The decision now points to the product change and the person responsible.</p></div></div><div class="flex gap-3"><span class="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--pc-surface-2)]"></span><div><p class="text-xs font-medium">Customer preview created</p><p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-70">A preview is ready for review.</p></div></div></div></Card>
				{/if}

			</main>

			<aside class="space-y-4">
				<Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">About this decision</p><div class="mt-4 space-y-4"><div><p class="text-[10px] text-[var(--pc-text-faint)]">Owner</p><p class="mt-1 text-sm font-medium">{thread.owner}</p></div><div><p class="text-[10px] text-[var(--pc-text-faint)]">Product</p><a href={`/workspace/products/${thread.productSlug}`} class="mt-1 inline-flex items-center gap-1 text-sm text-[var(--pc-accent-light)]">{thread.productName} <ArrowRight size={12} weight="Outline" aria-hidden="true" /></a></div><div><p class="text-[10px] text-[var(--pc-text-faint)]">Last updated</p><p class="mt-1 text-sm">{thread.updatedAt}</p></div><div><p class="text-[10px] text-[var(--pc-text-faint)]">Promise to customers</p><p class="mt-1 text-sm">{thread.status === 'In decision' ? 'Not promised yet' : thread.status}</p><p class="mt-1 text-[11px] leading-relaxed text-[var(--pc-text-muted)] opacity-70">A preview shows direction. It is not a promise about when it will ship.</p></div></div></Card>
				<Card padding="md"><div class="flex items-center justify-between gap-3"><h2 class="text-[13px] font-medium">Related pages</h2><span class="text-[10px] tabular-nums text-[var(--pc-text-faint)]">{thread.relations.length}</span></div><div class="mt-3 space-y-2">{#each thread.relations.slice(0, 3) as relation (relation.href)}<a href={relation.href} class="flex items-start gap-2 rounded-[11px] bg-[var(--pc-surface)] p-2.5 transition-colors hover:bg-[var(--pc-surface-2)]"><span class="min-w-0 flex-1"><span class="block truncate text-xs font-medium">{relation.title}</span><span class="mt-0.5 block truncate text-[10px] text-[var(--pc-text-muted)] opacity-70">{relation.kind === 'Doc' ? 'Help' : relation.kind === 'Incident' ? 'Service problem' : relation.kind} · {relation.status}</span></span><ArrowRight size={12} weight="Outline" class="mt-0.5 opacity-45" aria-hidden="true" /></a>{/each}</div><a href={`/workspace/products/${thread.productSlug}`} class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Open product overview <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a></Card>
			</aside>
		</div>
	</div>
{:else}
	<div class="px-4 sm:px-6"><StatePanel size="page" icon={Map} title="Product decision not found" description="We could not find this decision in the workspace." actionLabel="Back to product decisions" actionHref="/workspace/decisions" class="pc-enter" /></div>
{/if}
