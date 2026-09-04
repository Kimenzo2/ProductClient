<script lang="ts">
	import { AlertTriangle, Inbox, Sparkles } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Card, Chip, StatePanel } from '$lib/components/ui';
	import { feedback, incidents } from '$lib/data/workspace';

	let filter = $state<'All' | 'Feedback' | 'Incident'>('All');
	const queue = [
		...feedback.map((item) => ({ kind: 'Feedback' as const, title: item.title, subtitle: `${item.productName} · ${item.type} · ${item.priority} priority`, description: item.body, status: item.status, href: item.workspacePath, meta: `${item.from} · ${item.postedAt}`, order: item.status === 'New' ? 0 : 1 })),
		...incidents.map((item) => ({ kind: 'Incident' as const, title: item.title, subtitle: `${item.productName} · ${item.severity}`, description: item.summary, status: item.status, href: item.workspacePath, meta: `${item.owner} · ${item.startedAt}`, order: item.status === 'Resolved' ? 2 : 0 }))
	];
	let filtered = $derived(queue.filter((item) => filter === 'All' || item.kind === filter).sort((a, b) => a.order - b.order));
</script>

<svelte:head><title>Inbox | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Inbox" description="One list for new customer feedback and service problems that need attention." actionLabel="Add feedback" actionHref="/feedback/new" />
	<div class="flex flex-wrap items-center gap-2 py-5" role="group" aria-label="Inbox filters">
		{#each ['All', 'Feedback', 'Incident'] as item}
			<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition-[background-color,color] duration-150 {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{#if item === 'Feedback'}<Sparkles size={13} weight="Outline" />{:else if item === 'Incident'}<AlertTriangle size={13} weight="Outline" />{:else}<Inbox size={13} weight="Outline" />{/if}{item === 'Incident' ? 'Service problem' : item}</button>
		{/each}
		<span class="ml-auto text-xs text-[var(--pc-text-faint)]">{filtered.length} records</span>
	</div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Inbox records">
			{#each filtered as item (item.kind + item.title)}<EntityRow {...item} />{/each}
			{#if filtered.length === 0}<StatePanel icon={Inbox} title="No records in this view" description="Try another filter." />{/if}
		</section>
		<aside><div class="min-h-[180px] py-4" aria-hidden="true"></div></aside>
	</div>
</div>
