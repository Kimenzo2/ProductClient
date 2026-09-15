<script lang="ts">
	import { AlertTriangle, Inbox, Sparkles } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, StatePanel } from '$lib/components/ui';
	import { loadInboxIncidents, loadInboxThreads, type InboxThreadView, type IncidentRowView } from '$lib/data/feedbackInbox';
	import { requireSession } from '$lib/auth/guard';
	import { onMount } from 'svelte';
	import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';

	let filter = $state<'All' | 'Feedback' | 'Incident'>('All');
	let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
	let activeId = $derived(activeProductStore.activeProduct?.id ?? null);
	let headerTitle = $derived(activeSlug ? `${activeProductStore.activeProduct?.name ?? 'Product'} · Inbox` : 'Inbox');

	let threads = $state<InboxThreadView[]>([]);
	let incidentRows = $state<IncidentRowView[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let lastLoadedFor = $state<string | undefined>(undefined);

	async function load(): Promise<void> {
		const allowed = await requireSession('/workspace/inbox');
		if (!allowed) return;
		loading = true;
		loadError = null;
		const [threadResult, incidentResult] = await Promise.all([loadInboxThreads(activeId), loadInboxIncidents()]);
		threads = threadResult.threads;
		incidentRows = incidentResult.rows;
		loadError = threadResult.error ?? incidentResult.error;
		lastLoadedFor = activeId ?? undefined;
		loading = false;
	}

	type QueueItem = {
		id: string;
		kind: 'Feedback' | 'Incident';
		title: string;
		subtitle: string;
		description: string;
		status: string;
		href: string;
		meta: string;
		order: number;
		productSlug: string;
		githubIssueUrl?: string | null;
		githubIssueNumber?: number | null;
	};

	let queue = $derived.by(() => {		const threadItems: QueueItem[] = threads.map((thread) => ({
			id: thread.id,
			kind: 'Feedback',
			title: thread.title,
			subtitle: `${thread.productName} · feedback thread`,
			description: thread.preview,
			status: thread.unread ? 'Needs reply' : thread.status,
			// Only feedback subjects have a workspace detail page today.
			href: thread.href,
			meta: thread.lastMessageAt,
			order: thread.unread ? 0 : 1,
			productSlug: thread.productSlug,
			githubIssueUrl: thread.githubIssueUrl,
			githubIssueNumber: thread.githubIssueNumber
		}));
		const incidentItems: QueueItem[] = incidentRows.map((incident) => ({
			id: incident.id,
			kind: 'Incident',
			title: incident.title,
			subtitle: incident.severity,
			description: incident.summary,
			status: incident.status,
			href: '/workspace/status',
			meta: `${incident.owner} · ${incident.startedAt}`,
			order: incident.status === 'Resolved' ? 2 : 0,
			productSlug: ''
		}));
		// Incidents are tenant-scoped; keep them visible even when an active
		// product filter is on — only feedback threads narrow by product.
		const visibleThreads = activeSlug ? threadItems.filter((t) => t.productSlug === activeSlug) : threadItems;
		return [...visibleThreads, ...incidentItems].sort((a, b) => a.order - b.order);
	});

	let filtered = $derived(queue.filter((item) => filter === 'All' || item.kind === filter));

	$effect(() => {
		void activeId;
		if (!activeProductStore.hydrated) return;
		if (lastLoadedFor !== activeId) void load();
	});

	onMount(() => {
		void hydrateActiveProduct().then(() => {
			if (lastLoadedFor === undefined) void load();
		});
	});
</script>

<svelte:head><title>Inbox | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[960px] px-6 max-sm:px-4">
	<WorkspaceHeader title={headerTitle} description="One list for new customer feedback and service problems that need attention." actionLabel="Add feedback" actionHref="/feedback/new" />
	<div class="flex flex-wrap items-center gap-2 py-5" role="group" aria-label="Inbox filters">
		{#each ['All', 'Feedback', 'Incident'] as item}
			<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition-[background-color,color] duration-150 {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{#if item === 'Feedback'}<Sparkles size={13} weight="Outline" />{:else if item === 'Incident'}<AlertTriangle size={13} weight="Outline" />{:else}<Inbox size={13} weight="Outline" />{/if}{item === 'Incident' ? 'Service problem' : item}</button>
		{/each}
		<span class="ml-auto text-xs text-[var(--pc-text-faint)]">{filtered.length} records</span>
	</div>
	<div class="grid gap-6 pb-10">
		<section class="space-y-2" aria-label="Inbox records">
			{#if loading}
				{#each Array(4) as _, i (i)}
					<div class="h-[74px] animate-pulse rounded-[16px] bg-[var(--pc-surface-2)]" aria-hidden="true"></div>
				{/each}
			{:else if loadError}
				<StatePanel icon={Inbox} title="Could not load inbox" description={loadError} actionLabel="Retry" onAction={() => void load()} />
			{:else}
				{#each filtered as item (item.kind + item.id)}<div><EntityRow href={item.href} kind={item.kind} title={item.title} subtitle={item.subtitle} description={item.description} status={item.status} meta={item.meta} />{#if item.githubIssueUrl}<Button class="ml-14 mt-1" size="sm" variant="ghost" href={item.githubIssueUrl} target="_blank">GitHub issue{#if item.githubIssueNumber} #{item.githubIssueNumber}{/if} <span aria-hidden="true">↗</span></Button>{/if}</div>{/each}
				{#if filtered.length === 0}<StatePanel icon={Inbox} title="No records in this view" description="Try another filter." />{/if}
			{/if}
		</section>
	</div>
</div>
