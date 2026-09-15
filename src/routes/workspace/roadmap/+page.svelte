<script lang="ts">
import { onMount } from 'svelte';
import { CheckCircle, Globe, Link2, Map, Plus } from 'reicon-svelte';
import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
import { Button, Card, Chip, Input } from '$lib/components/ui';
import { roadmapItems } from '$lib/data/workspace';
import { supabase } from '$lib/supabaseClient';
import { ensureMyTenant, tenantUrl, type Tenant } from '$lib/tenant';
import type { RoadmapDoc } from '$lib/data/roadmapEditor';
import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';
import { browser } from '$app/environment';

const lanes = ['Now', 'Next', 'Later', 'Shipped'] as const;
let tenant = $state<Tenant | null>(null);
let roadmapDoc = $state<RoadmapDoc | null>(null);
let isPreview = $state(false);
onMount(() => {
	isPreview = browser && import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');
});
let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
let headerTitle = $derived(activeSlug ? `${activeProductStore.activeProduct?.name ?? 'Product'} · Roadmap` : 'Roadmap');
let scopedItems = $derived(isPreview ? (activeSlug ? roadmapItems.filter((i) => i.productSlug === activeSlug) : roadmapItems) : []);
	let laneCounts = $derived(
		Object.fromEntries(lanes.map((l) => [l, scopedItems.filter((i) => i.status === l).length])) as Record<(typeof lanes)[number], number>
	);
	let githubLinks = $state<Record<string, { url: string; number: number; title: string | null; state: string | null }>>({});
	let githubItemEditing = $state<string | null>(null);
	let githubReference = $state('');
	let githubBusy = $state(false);
	let githubMessage = $state('');
	let activeId = $derived(activeProductStore.activeProduct?.id ?? null);
	async function loadGithubLinks() {
		if (!activeId || !supabase) return;
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) return;
			const res = await fetch(`/api/github/roadmap?product_id=${encodeURIComponent(activeId)}`, { headers: { authorization: `Bearer ${token}` } });
			const result = await res.json().catch(() => null);
			if (!result?.ok) return;
			githubLinks = Object.fromEntries((result.links ?? []).map((link: { item_key: string; url: string; number: number; title: string | null; state: string | null }) => [link.item_key, link]));
		} catch {}
	}
	async function saveGithubLink(itemKey: string) {
		if (!activeId || !githubReference.trim() || !supabase) return;
		githubBusy = true;
		githubMessage = '';
		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) throw new Error('Sign in again to link a GitHub issue.');
			const res = await fetch('/api/github/roadmap', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: activeId, item_key: itemKey, reference: githubReference }) });
			const result = await res.json().catch(() => null);
			if (!res.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not link GitHub issue.');
			githubReference = '';
			githubItemEditing = null;
			githubMessage = 'GitHub issue linked.';
			await loadGithubLinks();
		} catch (error) { githubMessage = error instanceof Error ? error.message : String(error); } finally { githubBusy = false; }
	}
	async function removeGithubLink(itemKey: string) {
		if (!activeId || !supabase) return;
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return;
		await fetch(`/api/github/roadmap?product_id=${encodeURIComponent(activeId)}&item_key=${encodeURIComponent(itemKey)}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
		await loadGithubLinks();
	}
	onMount(async () => {
		await hydrateActiveProduct();
		await loadGithubLinks();
		try {
			tenant = await ensureMyTenant();
			if (!tenant || !supabase) return;
			const { data: sess } = await supabase.auth.getSession();
			const token = sess.session?.access_token;
			if (!token) return;
			const res = await fetch('/api/roadmap/publish', { headers: { authorization: `Bearer ${token}` } });
			const j = (await res.json().catch(() => null)) as { ok?: boolean; doc?: RoadmapDoc } | null;
			if (j?.ok && j.doc) roadmapDoc = j.doc as RoadmapDoc;
		} catch {}
	});
	$effect(() => { if (activeProductStore.hydrated && activeId) void loadGithubLinks(); });
</script>

<svelte:head><title>Roadmap | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
	<WorkspaceHeader title={headerTitle} description="Keep upcoming work connected to the feedback and product updates that explain it." actionLabel="Edit roadmap" actionHref="/workspace/roadmap/editor" />
	{#if tenant}
		<a href={`https://roadmap.productclient.com/${tenant.slug}`} target="_blank" rel="noopener" class="mt-4 inline-flex items-center gap-1.5 text-[14px] text-[var(--pc-accent-light)] hover:underline"><Globe size={14} weight="Outline" aria-hidden="true" /> Live site</a>
	{/if}
	<div class="grid gap-3 py-6 md:grid-cols-2 xl:grid-cols-4">
		{#each lanes as lane}
			<section class="min-w-0" aria-labelledby={`lane-${lane}`}>
				<div class="mb-2 flex items-center justify-between px-1"><h2 id={`lane-${lane}`} class="text-[13px] font-medium">{lane}</h2><span class="text-[10px] text-[var(--pc-text-faint)]">{scopedItems.filter((item) => item.status === lane).length}</span></div>
				<div class="space-y-2">
					{#each scopedItems.filter((item) => item.status === lane) as item (item.id)}
						<Card padding="md" class="group" id={item.id}>
							<div class="flex items-start gap-2"><span class="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]">{#if lane === 'Shipped'}<CheckCircle size={14} weight="Outline" />{:else}<Map size={14} weight="Outline" />{/if}</span><div class="min-w-0"><h3 class="text-[13px] font-medium leading-snug">{item.title}</h3><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">{item.description}</p></div></div>
							<div class="mt-4 flex items-center gap-2"><Chip size="xs" variant="accent">{item.productName}</Chip></div>
							{#if githubLinks[item.id]}<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pc-border)]/60 pt-3"><Button size="sm" variant="ghost" href={githubLinks[item.id].url} target="_blank"><Link2 size={12} weight="Outline" />Issue #{githubLinks[item.id].number}</Button><Button size="sm" variant="ghost" onclick={() => void removeGithubLink(item.id)}>Unlink</Button></div>
							{:else if githubItemEditing === item.id}<div class="mt-3 flex flex-wrap gap-2 border-t border-[var(--pc-border)]/60 pt-3"><Input class="min-w-0 flex-1" bind:value={githubReference} placeholder="owner/repo#123" aria-label={`GitHub issue for ${item.title}`} /><Button size="sm" loading={githubBusy} onclick={() => void saveGithubLink(item.id)}>Link</Button><Button size="sm" variant="outline" onclick={() => (githubItemEditing = null)}>Cancel</Button></div>
							{:else}<div class="mt-3 border-t border-[var(--pc-border)]/60 pt-3"><Button size="sm" variant="ghost" onclick={() => (githubItemEditing = item.id)}><Link2 size={12} weight="Outline" />Link GitHub issue</Button></div>{/if}
						</Card>
					{/each}
					{#if scopedItems.filter((item) => item.status === lane).length === 0}<div class="rounded-[16px] bg-[var(--pc-surface)] px-3 py-8 text-center text-xs text-[var(--pc-text-faint)]">Nothing here yet</div>{/if}
				</div>
			</section>
		{/each}
	</div>
	{#if githubMessage}<p class="pb-8 text-xs text-[var(--pc-text-muted)]" role="status">{githubMessage}</p>{/if}
</div>
