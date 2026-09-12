<script lang="ts">
	import { ArrowRight, Book, FileText, Lock, Search } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import EntityRow from '$lib/components/workspace/EntityRow.svelte';
	import { Button, Card, Input, Label, Select, StatePanel, Textarea } from '$lib/components/ui';
	import { hostedDocsPage } from '$lib/config/tenant';
	import { docs, searchGaps } from '$lib/data/workspace';
	import { supabase } from '$lib/supabaseClient';
	import { onMount } from 'svelte';
	import { trackAnalyticsEvent } from '$lib/data/analytics';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let query = $state('');
	let filtered = $derived(docs.filter((doc) => `${doc.title} ${doc.description} ${doc.productName} ${doc.section}`.toLowerCase().includes(query.toLowerCase())));
	let unanswered = $derived(searchGaps.filter((gap) => gap.status !== 'Answered'));

	let accessMode = $state<'public' | 'password' | 'private'>('public');
	let password = $state('');
	let agentBlurb = $state('');
	let visibilityBusy = $state(false);
	let visibilityNote = $state('');

	onMount(() => {
		void trackAnalyticsEvent('docs.view', { path: '/workspace/docs' });
		void loadVisibility();
	});
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
	<WorkspaceHeader title="Help docs" description="Give customers and developers one clear place to learn how the product works." actionLabel="Write help content" actionHref="/submit" secondaryActionLabel="Open docs" secondaryActionHref={hostedDocsPage.href} secondaryActionExternal />
	<div class="relative max-w-[620px] py-5"><Search size={16} weight="Outline" class="pointer-events-none absolute left-3 top-8 opacity-55" /><Input bind:value={query} placeholder="Find a help page or product..." aria-label="Search help docs" class="pl-9 text-base sm:text-sm" /></div>
	<div class="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_280px]">
		<section class="space-y-2" aria-label="Documentation pages">
			{#each filtered as doc (doc.productSlug + doc.slug)}<div onclick={() => void trackAnalyticsEvent('docs.search_click', { query, path: doc.publicPath })} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void trackAnalyticsEvent('docs.search_click', { query, path: doc.publicPath }); } }} role="button" tabindex="0"><EntityRow href={doc.publicPath} kind="Doc" title={doc.title} subtitle={`${doc.productName} · ${doc.section}`} description={doc.description} status="Published" meta={`Updated ${doc.updatedAt}`} /></div>{/each}
			{#if filtered.length === 0}<StatePanel icon={FileText} title="No help pages found" description="Try a broader search." />{/if}
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
			{#if unanswered.length > 0}
				<Card padding="lg">
					<h3 class="text-[13px] font-medium">Unanswered searches</h3>
					<p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">Queries with no clear answer.</p>
					<div class="mt-3 space-y-1">
						{#each unanswered.slice(0,3) as gap}
							<div class="rounded-[10px] bg-[var(--pc-surface)] px-3 py-2 text-xs"><span class="font-medium">{gap.query}</span><span class="ml-2 text-[var(--pc-text-faint)]">· {gap.searches}×</span></div>
						{/each}
					</div>
				</Card>
			{/if}
		</aside>
	</div>
</div>