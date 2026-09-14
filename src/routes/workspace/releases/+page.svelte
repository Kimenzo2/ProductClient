<script lang="ts">
	import { ArrowRight, History, InfoCircle, Rocket } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, Card, Chip, Select } from '$lib/components/ui';
import { onMount } from 'svelte';
import { tooltip } from '$lib/components/Tooltip.svelte';
import { releases, products } from '$lib/data/workspace';
import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';
import { supabase } from '$lib/supabaseClient';

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

	// Workspace scope: this workspace owns all 12 products (Lorenze). In production this is workspace_id via RLS.
	// Product switcher: when a product is selected, default filter to that product; still allow “All” for overview.
	let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
	let activeId = $derived(activeProductStore.activeProduct?.id ?? null);
	let headerTitle = $derived(activeSlug ? `${activeProductStore.activeProduct?.name ?? 'Product'} · Releases` : 'Internal releases');
	let productFilter = $state('all');
	// Keep filter in sync with active product when it changes (unless user explicitly chose another product)
	$effect(() => {
		if (activeSlug) productFilter = activeSlug;
	});
	let productOptions = $derived([
		{ value: 'all', label: 'All workspace products' },
		...products.map((p) => ({ value: p.slug, label: p.name }))
	]);

	type GithubReleaseView = { id: string; title: string; version: string | null; status: string; github_release_url: string; github_repo_full_name: string | null; created_at: string };
	let githubReleases = $state<GithubReleaseView[]>([]);
	let githubReleaseError = $state('');
	let githubReleaseLoadedFor = $state<string | null>(null);
	let confirmingRelease = $state<string | null>(null);
	async function loadGithubReleases() {
		if (!activeId || !supabase) return;
		githubReleaseLoadedFor = activeId;
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) return;
			const response = await fetch(`/api/github/releases?product_id=${encodeURIComponent(activeId)}`, { headers: { authorization: `Bearer ${token}` } });
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not load GitHub releases.');
			githubReleases = result.releases ?? [];
		} catch (error) { githubReleaseError = error instanceof Error ? error.message : String(error); }
	}
	async function confirmGithubRelease(releaseId: string) {
		if (!activeId || !supabase) return;
		confirmingRelease = releaseId;
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) throw new Error('Sign in again to confirm this release.');
			const response = await fetch('/api/github/releases', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: activeId, release_id: releaseId }) });
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not confirm release.');
			await loadGithubReleases();
		} catch (error) { githubReleaseError = error instanceof Error ? error.message : String(error); } finally { confirmingRelease = null; }
	}
	onMount(async () => { await hydrateActiveProduct(); await loadGithubReleases(); });
	$effect(() => { if (activeProductStore.hydrated && githubReleaseLoadedFor !== activeId) void loadGithubReleases(); });

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
	<WorkspaceHeader title={headerTitle} description="Drafts, reviews, and ready to publish. Public page appears only after you publish — this timeline is for makers, not customers." actionLabel="Write product update" />
	<div class="flex flex-wrap items-center gap-3 py-5" role="group" aria-label="Internal release filters">
		<div class="flex items-center gap-2">
			<span class="text-xs font-medium text-[var(--pc-text-muted)]">Product:</span>
			<Select id="workspace-product" bind:value={productFilter} options={productOptions} placeholder="Select product" />
			<span
				class="inline-flex cursor-help"
				use:tooltip={{
					text: 'You’re viewing all products in this workspace. In production this list is scoped by workspace_id via RLS, not global mock.',
					typeX: 'center',
					typeY: 'bottom',
					island: true
				}}
				aria-label="Workspace scope info"
			><InfoCircle size={14} weight="Outline" class="opacity-50 hover:opacity-100 transition-opacity" aria-hidden="true" /></span>
		</div>
		<div class="h-5 w-px bg-[var(--pc-border-strong)]/30 hidden sm:block" aria-hidden="true"></div>
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Status filter">
			{#each ['All', 'Draft', 'In review', 'Ready', 'Published'] as item}
				<button type="button" onclick={() => (filter = item as typeof filter)} aria-pressed={filter === item} class="inline-flex h-9 items-center rounded-full px-3 text-xs transition-[background-color,color] duration-150 {filter === item ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{item}</button>
			{/each}
		</div>
		<span class="ml-auto text-xs text-[var(--pc-text-faint)] tabular-nums">{filtered.length} internal</span>
	</div>
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
	{#if activeId}
		<Card padding="md" class="mb-10">
			<div class="flex items-center justify-between gap-3"><div><h2 class="text-[14px] font-medium">GitHub releases</h2><p class="mt-1 text-xs text-[var(--pc-text-muted)]">GitHub releases enter as drafts here until you confirm them for ProductClient.</p></div><span class="text-xs text-[var(--pc-text-faint)]">{githubReleases.length}</span></div>
			{#if githubReleaseError}<p class="mt-3 text-xs text-[var(--pc-danger)]" role="alert">{githubReleaseError}</p>{:else if githubReleases.length === 0}<p class="mt-4 text-xs text-[var(--pc-text-faint)]">No GitHub releases have been ingested for this product.</p>{:else}<div class="mt-4 divide-y divide-[var(--pc-border)]/60">{#each githubReleases as release (release.id)}<div class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div class="min-w-0"><p class="truncate text-sm font-medium">{release.title}</p><p class="mt-1 text-xs text-[var(--pc-text-muted)]">{release.version ?? 'Unversioned'} · {release.status === 'published' ? 'Published in ProductClient' : 'Awaiting maker confirmation'}</p></div><div class="flex shrink-0 items-center gap-3"><a class="inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)] hover:underline" href={release.github_release_url} target="_blank" rel="noreferrer">Open GitHub release <ArrowRight size={12} weight="Outline" /></a>{#if release.status !== 'published'}<Button size="sm" loading={confirmingRelease === release.id} onclick={() => void confirmGithubRelease(release.id)}>Confirm</Button>{/if}</div></div>{/each}</div>{/if}
		</Card>
	{/if}
</div>
