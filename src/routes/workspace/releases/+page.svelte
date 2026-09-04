<script lang="ts">
	import { ArrowRight, History, Rocket } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, Card, Chip, Select } from '$lib/components/ui';
	import { releases, products } from '$lib/data/workspace';

	type InternalStatus = 'Draft' | 'In review' | 'Ready' | 'Published';
	type Visibility = 'Internal' | 'Preview' | 'Public';

	function internalStatusFor(r: (typeof releases)[number], idx: number): InternalStatus {
		if (r.type === 'launch') return idx % 3 === 0 ? 'Ready' : 'Published';
		if (r.type === 'changelog') return idx % 2 === 0 ? 'Draft' : 'In review';
		if (r.type === 'incident') return 'Published';
		return 'Draft';
	}
	function visibilityFor(status: InternalStatus): Visibility {
		return status === 'Published' ? 'Public' : status === 'Ready' ? 'Preview' : 'Internal';
	}

	// Workspace scope: this workspace owns Bento (Lorenze). In production this is workspace_id via RLS.
	let productFilter = $state('bento');
	let productOptions = $derived([
		{ value: 'all', label: 'All workspace products' },
		...products.map((p) => ({ value: p.slug, label: p.name }))
	]);

	let filter = $state<'All' | InternalStatus>('All');
	let internalReleases = $derived(
		releases.map((r, i) => {
			const internalStatus = internalStatusFor(r, i);
			return { ...r, internalStatus, visibility: visibilityFor(internalStatus) };
		})
	);
	let filtered = $derived(
		internalReleases.filter((r) => {
			const byProduct = productFilter === 'all' ? true : r.productSlug === productFilter;
			const byStatus = filter === 'All' ? true : r.internalStatus === filter;
			return byProduct && byStatus;
		})
	);
</script>

<svelte:head><title>Internal releases | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace — Internal" title="Internal releases" description="Drafts, reviews, and ready to publish. Public page appears only after you publish — this timeline is for makers, not customers." actionLabel="Write product update" />
	<div class="flex flex-wrap items-center gap-3 py-5" role="group" aria-label="Internal release filters">
		<div class="flex items-center gap-2">
			<span class="text-xs font-medium text-[var(--pc-text-muted)]">Product:</span>
			<Select id="workspace-product" bind:value={productFilter} options={productOptions} placeholder="Select product" />
		</div>
		<div class="h-5 w-px bg-[var(--pc-border-strong)]/30 hidden sm:block" aria-hidden="true"></div>
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Status filter">
			{#each ['All', 'Draft', 'In review', 'Ready', 'Published'] as item}
				<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex h-9 items-center rounded-full px-3 text-xs transition-[background-color,color] duration-150 {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{item}</button>
			{/each}
		</div>
		<span class="ml-auto text-xs text-[var(--pc-text-faint)] tabular-nums">{filtered.length} internal</span>
	</div>
	<p class=" -mt-2 mb-4 text-xs leading-relaxed text-[var(--pc-text-faint)] max-w-[60ch]">You’re viewing <strong class="text-[var(--pc-text)] font-medium">{productFilter === 'all' ? 'all products in this workspace' : productOptions.find(p=>p.value===productFilter)?.label}</strong> — GPT/Linear live elsewhere. In production this list is scoped by <code class="rounded bg-[var(--pc-surface)] px-1 py-0.5">workspace_id</code> via RLS, not global mock.</p>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Internal release timeline">
			{#each filtered as release (release.id)}
				<EntityRow
					href={release.publicPath}
					kind="Release"
					title={release.title}
					subtitle={`${release.productName} · ${release.internalStatus} · ${release.postedAt}`}
					description={release.description}
					status={release.visibility}
					meta={`by ${release.makerName} · ${release.internalStatus}`}
					avatar={release.productAvatar}
				/>
			{/each}
			{#if filtered.length === 0}<div class="min-h-[180px] py-4" aria-hidden="true"></div>{/if}
		</section>
		<aside class="space-y-4"><div class="min-h-[180px] py-4" aria-hidden="true"></div><div class="min-h-[180px] py-4" aria-hidden="true"></div></aside>
	</div>
</div>
