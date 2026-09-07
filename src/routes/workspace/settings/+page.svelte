<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, CheckCircle, Link, Refresh, Settings, Share } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Button, Card } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import { ensureMyTenant, renameMyTenant, slugValidationMessage, tenantHost, tenantRoadmapUrl, tenantStatusUrl, tenantUrl, type Tenant } from '$lib/tenant';

	let releaseNotifications = $state(true);
	let incidentNotifications = $state(true);
	let weeklyDigest = $state(false);

	let tenant = $state<Tenant | null>(null);
	let loadingTenant = $state(true);
	let slugDraft = $state('');
	let slugError = $state('');
	let slugSuccess = $state('');
	let savingSlug = $state(false);

	onMount(async () => {
		try {
			tenant = await ensureMyTenant();
			if (tenant) slugDraft = tenant.slug;
		} catch {
			// keep empty, user will be prompted via error
		} finally {
			loadingTenant = false;
		}
	});

	async function saveSlug() {
		slugError = '';
		slugSuccess = '';
		const v = slugValidationMessage(slugDraft);
		if (v) {
			slugError = v;
			return;
		}
		savingSlug = true;
		const { tenant: updated, error } = await renameMyTenant(slugDraft);
		savingSlug = false;
		if (error) {
			slugError = error;
			return;
		}
		if (updated) {
			tenant = updated;
			slugDraft = updated.slug;
			slugSuccess = `Saved — your site is now ${tenantHost(updated.slug)}`;
			// Map to the shared Cloudflare tenant registry keyed by the stable
			// tenant id so the rename updates the single record in place.
			try {
				await fetch('/api/tenants/sync', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ id: updated.id, slug: updated.slug, displayName: updated.name })
				});
			} catch {}
		}
	}
</script>

<svelte:head><title>Settings | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
	<WorkspaceHeader title="Settings" description="Choose what you are told about and how the workspace works." />
	<div class="grid gap-4 py-6">
		<Card padding="lg">
			<div class="flex items-center gap-2"><Link size={16} weight="Outline" class="opacity-55" /><h2 class="text-base font-medium">Your subdomain</h2></div>
			{#if loadingTenant}
				<p class="mt-3 text-xs text-[var(--pc-text-muted)]">Loading your hosted address…</p>
			{:else if tenant}
				<p class="mt-2 text-[11px] leading-relaxed text-[var(--pc-text-muted)]">This slug is the source of truth for your hosted address <span class="font-mono text-[11px]">{tenantHost(tenant.slug)}</span>. Change it anytime — we validate uniqueness server-side and block reserved words.</p>
				<div class="mt-3 flex items-center gap-2 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-xs">
					<span class="h-2 w-2 rounded-full bg-[var(--pc-accent-light)] shadow-[0_0_0_4px_rgba(119,152,18,.18)]" aria-hidden="true"></span>
					<a href={tenantUrl(tenant.slug, '/')} target="_blank" rel="noopener" class="inline-flex items-center gap-1 font-medium text-[var(--pc-text)] hover:text-[var(--pc-accent-light)]">{tenantHost(tenant.slug)} <Share size={12} weight="Outline" /></a>
				</div>
				<div class="mt-4 grid gap-3">
					<AuthInput id="tenant-slug" label="Subdomain (slug)" name="slug" placeholder="e.g. gemma" bind:value={slugDraft} error={slugError} hint="3-63 chars, lowercase letters, numbers, hyphens. No -- and not reserved (api, admin, docs.)." required disabled={savingSlug} />
					{#if slugSuccess}<p class="rounded-[10px] bg-[rgba(119,152,18,.12)] px-3 py-2 text-xs text-[var(--pc-accent-light)]" role="status"><CheckCircle size={13} weight="Outline" class="inline -mt-[2px] mr-1" />{slugSuccess}</p>{/if}
					<div class="flex gap-2"><Button size="lg" loading={savingSlug} onclick={() => void saveSlug()}><Refresh size={14} weight="Outline" /> Save subdomain</Button><Button variant="outline" size="lg" href={tenantUrl(tenant.slug, '/')} target="_blank" rel="noopener">Open site <Share size={13} weight="Outline" /></Button></div>
					<p class="text-[10px] leading-relaxed text-[var(--pc-text-faint)]">Your docs live at <span class="font-mono">{tenant.slug}.productclient.com</span>, your status page at <a href={tenantStatusUrl(tenant.slug)} target="_blank" rel="noopener" class="underline decoration-dotted">status.productclient.com/{tenant.slug}</a>, and your roadmap at <a href={tenantRoadmapUrl(tenant.slug)} target="_blank" rel="noopener" class="underline decoration-dotted">roadmap.productclient.com/{tenant.slug}</a>.</p>
				</div>
			{:else}
				<p class="mt-3 text-xs text-[var(--pc-text-muted)]">We couldn’t load your tenant yet. Refresh or sign in again — the server will create it on demand.</p>
			{/if}
		</Card>
		<Card padding="lg"><div class="flex items-center gap-2"><Settings size={16} weight="Outline" class="opacity-55" /><h2 class="text-base font-medium">Workspace rules</h2></div><div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Product page links</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">/p/product-slug</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">When updates become public</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">After someone publishes them</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Service problem stages</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">Draft → Looking into it → Watching → Fixed</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Who can search</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">Only people with access</p></div></div></Card>
		<Card padding="lg">
			<div class="flex items-center gap-2"><Bell size={16} weight="Outline" class="opacity-55" /><h2 class="text-base font-medium">Notifications</h2></div>
			<div class="mt-4 grid gap-3">
				<label class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2"><span class="text-xs">Release notifications</span><input type="checkbox" bind:checked={releaseNotifications} class="h-4 w-8 accent-[var(--pc-accent)]" /></label>
				<label class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2"><span class="text-xs">Incident notifications</span><input type="checkbox" bind:checked={incidentNotifications} class="h-4 w-8 accent-[var(--pc-accent)]" /></label>
				<label class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-3 py-2"><span class="text-xs">Weekly digest</span><input type="checkbox" bind:checked={weeklyDigest} class="h-4 w-8 accent-[var(--pc-accent)]" /></label>
			</div>
		</Card>
		<div class="flex items-center gap-2 rounded-[14px] bg-[var(--pc-surface)] px-4 py-3 text-xs text-[var(--pc-text-muted)]"><CheckCircle size={15} weight="Outline" class="text-[var(--pc-accent-light)]" />Subdomain changes are validated server-side for uniqueness and reserved words; your hosted pages (docs, status, roadmap) are synced to Cloudflare and update instantly.</div>
	</div>
</div>
