<script lang="ts">
	import { Inbox, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Input, StatePanel } from '$lib/components/ui';
	import { loadFeedbackItems, type FeedbackBucket, type FeedbackItemView } from '$lib/data/feedbackInbox';
	import { requireSession } from '$lib/auth/guard';
	import { onMount } from 'svelte';
	import { trackAnalyticsEvent } from '$lib/data/analytics';
	import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';

	let query = $state('');
	let filter = $state<'All' | FeedbackBucket>('All');
	let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
	let activeId = $derived(activeProductStore.activeProduct?.id ?? null);
	let headerTitle = $derived(activeSlug ? `${activeProductStore.activeProduct?.name ?? 'Product'} · Feedback` : 'Feedback');

	let items = $state<FeedbackItemView[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let lastLoadedFor = $state<string | undefined>(undefined);

	async function load(): Promise<void> {
		const allowed = await requireSession('/workspace/feedback');
		if (!allowed) return;
		loading = true;
		loadError = null;
		const result = await loadFeedbackItems(activeId);
		items = result.items;
		loadError = result.error;
		lastLoadedFor = activeId ?? undefined;
		loading = false;
	}

	let filtered = $derived(
		items.filter((item) => {
			const haystack = `${item.title} ${item.body} ${item.productName} ${item.from}`.toLowerCase();
			const matchesProduct = !activeSlug || item.productSlug === activeSlug;
			return matchesProduct && (filter === 'All' || item.status === filter) && haystack.includes(query.trim().toLowerCase());
		})
	);
	onMount(() => {
		void hydrateActiveProduct();
		void trackAnalyticsEvent('feedback.new', { path: '/workspace/feedback', productId: activeProductStore.activeProduct?.id });
	});

	$effect(() => {
		// Reload when the active product changes after hydration (picker switch).
		void activeId;
		if (!activeProductStore.hydrated) return;
		if (lastLoadedFor !== activeId) void load();
	});

	$effect(() => { void filter; void trackAnalyticsEvent('feedback.shipped', { value: filter }); });
</script>

<svelte:head><title>Feedback | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader title={headerTitle} description="Keep the customer's own words while you turn them into a clear problem, a choice, and a follow-up." actionLabel="Add feedback" actionHref="/feedback/new" />

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
			{#if loading}
				{#each Array(4) as _, i (i)}
					<div class="h-[74px] animate-pulse rounded-[16px] bg-[var(--pc-surface-2)]" aria-hidden="true"></div>
				{/each}
			{:else if loadError}
				<StatePanel icon={Inbox} title="Could not load feedback" description={loadError} actionLabel="Retry" onAction={() => void load()} />
			{:else}
				{#each filtered as item (item.id)}
					<EntityRow href={`/workspace/feedback/${item.id}`} kind="Feedback" title={item.title} subtitle={`${item.productName} · ${item.typeLabel}`} description={item.body} status={item.status} meta={`${item.from} · ${item.postedAt}`} />
				{/each}
				{#if filtered.length === 0}
					<StatePanel icon={Inbox} title="No feedback matches" description="Try a product, person, or broader state." actionLabel="Clear filters" onAction={() => { query = ''; filter = 'All'; }} />
				{/if}
			{/if}
		</section>

		<aside class="space-y-4">
			<div class="min-h-[180px] py-4" aria-hidden="true"></div>
			<div class="min-h-[200px] py-4" aria-hidden="true"></div>
		</aside>
	</div>
</div>