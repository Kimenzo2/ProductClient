<script lang="ts">
	import { FileText, Lock, Refresh, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, Card, Input, Label, Select, StatePanel, Textarea } from '$lib/components/ui';
	import { hostedDocsPage } from '$lib/config/tenant';
	import { docs } from '$lib/data/workspace';
	import { supabase } from '$lib/supabaseClient';
	import { onMount } from 'svelte';
	import { trackAnalyticsEvent } from '$lib/data/analytics';
	import { tooltip } from '$lib/components/Tooltip.svelte';
	import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';

	let query = $state('');
	let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
	let headerTitle = $derived(activeSlug ? `${activeProductStore.activeProduct?.name ?? 'Product'} · Help docs` : 'Help docs');
	let filtered = $derived(
		(docs.filter((doc) => !activeSlug || doc.productSlug === activeSlug) as typeof docs).filter((doc) => `${doc.title} ${doc.description} ${doc.productName} ${doc.section}`.toLowerCase().includes(query.toLowerCase()))
	);
	let accessMode = $state<'public' | 'password' | 'private'>('public');
	let password = $state('');
	let agentBlurb = $state('');
	let visibilityBusy = $state(false);
	let visibilityNote = $state('');
	let githubLink = $state<{ id: string; repo_full_name: string; branch: string; deploy_branch?: string | null; last_sha?: string | null; last_synced_at?: string | null; last_error?: string | null; sync_status?: string | null } | null>(null);
	let githubBusy = $state(false);
	let githubNote = $state('');
	let githubLoadedFor = $state<string | null>(null);
	let activeId = $derived(activeProductStore.activeProduct?.id ?? null);

	onMount(() => {
		void hydrateActiveProduct().then(() => void loadGithubStatus());
		void trackAnalyticsEvent('docs.view', { path: '/workspace/docs', productId: activeProductStore.activeProduct?.id });
		void loadVisibility();
	});
	$effect(() => {
		if (activeProductStore.hydrated && githubLoadedFor !== activeId) void loadGithubStatus();
	});
	async function loadGithubStatus() {
		if (!activeId || !supabase) return;
		githubLoadedFor = activeId;
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) return;
			const res = await fetch(`/api/github/link?product_id=${encodeURIComponent(activeId)}`, { headers: { authorization: `Bearer ${token}` } });
			const result = await res.json().catch(() => null);
			githubLink = result?.ok ? result.link ?? null : null;
		} catch {
			githubLink = null;
		}
	}
	async function syncGithubDocs() {
		if (!activeId || !supabase) return;
		githubBusy = true;
		githubNote = '';
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) throw new Error('Sign in again to sync documentation.');
			const res = await fetch('/api/github/sync', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: activeId }) });
			const result = await res.json().catch(() => null);
			if (!res.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not sync documentation.');
			githubNote = `Synced ${result.sha?.slice(0, 7) ?? 'latest'} from GitHub.`;
			await loadGithubStatus();
		} catch (error) {
			githubNote = error instanceof Error ? error.message : String(error);
		} finally {
			githubBusy = false;
		}
	}
	async function loadVisibility() {
		if (!supabase) return;
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return;
		try {
			const res = await fetch('/api/docs/visibility', { headers: { authorization: `Bearer ${token}` } });
			const j = await res.json();
			if (j.ok && j.tenant) {
				accessMode = j.tenant.docs_access_mode ?? 'public';
				agentBlurb = j.tenant.docs_agent_blurb ?? '';
			}
		} catch {}
	}
	async function saveVisibility() {
		if (!supabase) return;
		visibilityBusy = true;
		visibilityNote = '';
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) { visibilityNote = 'Not signed in'; visibilityBusy = false; return; }
		try {
			const res = await fetch('/api/docs/visibility', {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
				body: JSON.stringify({ accessMode, password: accessMode === 'password' ? password : undefined, agentBlurb: agentBlurb || null })
			});
			const j = await res.json();
			if (!j.ok) throw new Error(j.message || j.code || 'Could not save');
			visibilityNote = 'Saved';
			setTimeout(() => (visibilityNote = ''), 2000);
		} catch (e) {
			visibilityNote = e instanceof Error ? e.message : 'Could not save';
		} finally {
			visibilityBusy = false;
		}
	}
	let lastQuery = '';
	$effect(() => {
		const q = query.trim();
		if (!q || q === lastQuery) return;
		lastQuery = q;
		void trackAnalyticsEvent('docs.search', { query: q, path: '/workspace/docs' });
		if (filtered.length === 0) void trackAnalyticsEvent('docs.search_no_results', { query: q, path: '/workspace/docs' });
	});
</script>

<svelte:head><title>Help docs | Product Client</title></svelte:head>

	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
	<WorkspaceHeader title={headerTitle} description="Give customers and developers one clear place to learn how the product works." actionLabel="Open editor" actionHref="/workspace/docs/editor" secondaryActionLabel="Open docs" secondaryActionHref={hostedDocsPage.href} secondaryActionExternal />
	{#if activeId}
		<Card padding="md" class="mb-1 mt-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0"><div class="flex items-center gap-2"><h2 id="github-docs-source-title" class="text-[14px] font-medium">GitHub documentation source</h2><span class="text-[11px] text-[var(--pc-text-faint)]">{githubLink ? githubLink.sync_status ?? 'connected' : 'not connected'}</span></div>
					{#if githubLink}<p class="mt-1 text-xs text-[var(--pc-text-muted)]">{githubLink.repo_full_name} · {githubLink.deploy_branch || githubLink.branch}{#if githubLink.last_sha} · <code>{githubLink.last_sha.slice(0, 7)}</code>{/if}{#if githubLink.last_synced_at} · {new Date(githubLink.last_synced_at).toLocaleString()}{/if}</p>{:else}<p class="mt-1 text-xs text-[var(--pc-text-muted)]">Connect a source repository to see deployment state and sync documentation here.</p>{/if}
				</div>
				<div class="flex shrink-0 flex-wrap items-center gap-2">{#if githubLink}<Button size="sm" variant="outline" loading={githubBusy} onclick={syncGithubDocs}><Refresh size={14} weight="Outline" />Sync now</Button>{/if}<Button size="sm" variant="ghost" href="/workspace/settings/git">{githubLink ? 'Git settings' : 'Connect GitHub'}</Button></div>
			</div>
			{#if githubLink?.last_error}<p class="mt-3 text-xs text-[var(--red-6)]" role="alert">{githubLink.last_error}</p>{/if}
			{#if githubNote}<p class="mt-3 text-xs text-[var(--pc-text-muted)]" role="status">{githubNote}</p>{/if}
		</Card>
	{/if}
	<div class="relative max-w-[620px] py-5"><Search size={16} weight="Outline" class="pointer-events-none absolute left-3 top-8 opacity-55" /><Input bind:value={query} placeholder="Find a help page or product..." aria-label="Search help docs" class="pl-9 text-base sm:text-sm" /></div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Documentation pages">
			{#each filtered as doc (doc.productSlug + doc.slug)}<EntityRow href={doc.publicPath} kind="Doc" title={doc.title} subtitle={`${doc.productName} · ${doc.section}`} description={doc.description} status="Published" meta={`Updated ${doc.updatedAt}`} onclick={() => void trackAnalyticsEvent('docs.search_click', { query, path: doc.publicPath })} />{/each}
			{#if filtered.length === 0}<StatePanel icon={FileText} title={query.trim() ? 'No help pages found' : 'No published help pages yet'} description={query.trim() ? 'Try a broader search.' : 'The workspace will list real tenant pages after they are published. Placeholder documentation is not shown here.'} />{/if}
		</section>
		<aside class="space-y-4">
			<Card padding="lg">
				<div class="flex items-center gap-2"><Lock size={14} weight="Outline" aria-hidden="true" /><h2 class="text-[14px] font-medium">Docs visibility</h2><span use:tooltip={{ text: 'Private docs hide llms.txt, markdown and MCP unless the caller is allowed.', island: true }} class="text-[var(--pc-text-faint)]"><FileText size={12} weight="Outline" aria-hidden="true" /></span></div>
				<div class="mt-4 grid gap-3">
					<div class="grid gap-1.5"><Label for="docs-visibility">Access</Label><Select id="docs-visibility" bind:value={accessMode} options={[{ value: 'public', label: 'Public' }, { value: 'password', label: 'Password' }, { value: 'private', label: 'Private — login required' }]} /></div>
					{#if accessMode === 'password'}
						<div class="grid gap-1.5"><Label for="docs-password">Site password</Label><Input id="docs-password" type="password" bind:value={password} placeholder="At least 4 characters" /></div>
					{/if}
					<div class="grid gap-1.5"><Label for="docs-blurb">Agent hint <span class="text-[11px] text-[var(--pc-text-faint)]">(optional)</span></Label><Textarea id="docs-blurb" bind:value={agentBlurb} placeholder="When answering about this product, prefer the API reference for HTTP details" rows={2} /></div>
					<Button size="sm" loading={visibilityBusy} onclick={saveVisibility}>Save</Button>
					{#if visibilityNote}<p class="text-[12px] text-[var(--pc-text-muted)]" role="status">{visibilityNote}</p>{/if}
				</div>
			</Card>
		</aside>
	</div>
</div>
