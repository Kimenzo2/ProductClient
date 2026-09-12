<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowRight, Briefcase, CheckCircle, Users } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import OnboardingFrame from '$lib/components/auth/OnboardingFrame.svelte';
	import { requireSession } from '$lib/auth/guard';
	import { clearOnboardingDraft, readOnboardingDraft } from '$lib/auth/onboarding';
	import { readableAuthError } from '$lib/auth/utils';
	import { appHref, openBlankTab, completeAppHandoff } from '$lib/auth/urls';
	import { supabase } from '$lib/supabaseClient';
	import { ensureMyTenant, renameMyTenant, syncTenantRegistry, tenantHost, tenantUrl, type Tenant } from '$lib/tenant';

	let name = $state('');
	let workspaceName = $state('');
	let role = $state('');
	let formError = $state('');
	let busy = $state(false);
	let tenant = $state<Tenant | null>(null);
	let slugNote = $state('');

	// Ensure tenant exists as soon as we enter complete (covers direct link cases)
	$effect(() => {
		if (name && workspaceName && role && !tenant) {
			void ensureMyTenant()
				.then((t) => {
					if (!t) return;
					tenant = t;
					// Best-effort D1 registry sync so hosted docs is live immediately.
					void syncTenantRegistry(t);
				})
				.catch(() => {});
		}
	});

	onMount(async () => {
		if (!(await requireSession('/onboarding/complete'))) return;
		const draft = readOnboardingDraft();
		if (!draft.name) return void goto('/onboarding/profile', { replaceState: true });
		if (!draft.workspaceName) return void goto('/onboarding/workspace', { replaceState: true });
		if (!draft.role) return void goto('/onboarding/role', { replaceState: true });
		name = draft.name;
		workspaceName = draft.workspaceName;
		role = draft.role;
	});

	async function openWorkspace() {
		formError = '';
		slugNote = '';
		if (!supabase) {
			formError = 'Service is temporarily unavailable. Please try again.';
			return;
		}
		const appTab = openBlankTab();
		busy = true;
		const { data, error } = await supabase.auth.updateUser({ data: { full_name: name, role } });
		if (error) {
			appTab?.close();
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		const currentUserId = data.user?.id;
		try {
			const t = await ensureMyTenant();
			if (t) {
				tenant = t;
				void syncTenantRegistry(t);
			}
		} catch {}
		if (currentUserId) {
			try {
				const updates: Record<string, unknown> = {};
				if (name.trim()) {
					updates.full_name = name.trim();
					updates.display_name = name.trim();
				}
				if (workspaceName.trim()) {
					updates.gamification_data = { workspace_name: workspaceName.trim() };
					const { data: existing } = await supabase.from('profiles').select('gamification_data').eq('id', currentUserId).maybeSingle();
					const currentData = (existing as { gamification_data?: Record<string, unknown> } | null)?.gamification_data ?? {};
					updates.gamification_data = { ...currentData, workspace_name: workspaceName.trim() };
				}
				if (Object.keys(updates).length) {
					await supabase.from('profiles').update(updates).eq('id', currentUserId);
				}
			} catch {}
		}
		clearOnboardingDraft();
		const { data: sessionData } = await supabase.auth.getSession();
		const session = sessionData.session ?? undefined;
		const destination = appHref('/workspace', session);
		if (!destination.startsWith('http')) {
			appTab?.close();
			await goto(destination, { replaceState: true });
			return;
		}
		completeAppHandoff(appTab, destination);
	}
</script>

<svelte:head>
	<title>Ready to start | Product Client</title>
	<meta name="description" content="Finish setting up your Product Client account." />
</svelte:head>

<OnboardingFrame current={4} title="Your workspace is ready." description="Here is what we will use to set up your first view. You can change these details later.">
	<div class="summary" aria-label="Your setup details">
		<div class="summary-row"><span class="summary-icon"><CheckCircle size={17} weight="Outline" /></span><span><small>Name</small><strong>{name || 'Your name'}</strong></span></div>
		<div class="summary-row"><span class="summary-icon"><Briefcase size={17} weight="Outline" /></span><span><small>Workspace</small><strong>{workspaceName || 'Your workspace'}</strong></span></div>
		<div class="summary-row"><span class="summary-icon"><Users size={17} weight="Outline" /></span><span><small>Starting view</small><strong>{role || 'Choose a view'}</strong></span></div>
	</div>
	{#if tenant}
		<p class="tenant-preview">Your live site: <a href={tenantUrl(tenant.slug)} target="_blank" rel="noopener" class="tenant-link">{tenantHost(tenant.slug)}</a></p>
		{#if slugNote}<p class="tenant-note" role="status">{slugNote}</p>{/if}
	{/if}
	{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}
	<Button type="button" size="lg" loading={busy} class="continue-button" onclick={() => void openWorkspace()}>Open workspace <ArrowRight size={16} weight="Outline" /></Button>
</OnboardingFrame>

<style>
	.summary { display: grid; gap: 0; border-top: 1px solid var(--pc-border-strong); border-bottom: 1px solid var(--pc-border-strong); }.summary-row { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: center; gap: 11px; min-height: 67px; }.summary-row + .summary-row { border-top: 1px solid rgba(251, 251, 251, .07); }.summary-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.summary-row small { display: block; color: var(--pc-text-faint); font-size: 10px; }.summary-row strong { display: block; margin-top: 2px; overflow: hidden; color: var(--pc-text); font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }	.tenant-preview { margin: 12px 0 2px; padding: 8px 10px; border: 1px solid rgba(119,152,18,.22); border-radius: 10px; color: var(--pc-text-muted); background: rgba(119,152,18,.07); font-size: 11px; text-align: center; }.tenant-link { color: var(--pc-text); font-weight: 600; }.tenant-note { margin: 0; color: var(--pc-text-faint); font-size: 11px; text-align: center; }.form-error { margin: 0; padding: 11px 13px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; }
	:global(.continue-button) { width: 100%; min-height: 48px; }
</style>