<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowRight, Briefcase, CheckCircle, Users } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import OnboardingFrame from '$lib/components/auth/OnboardingFrame.svelte';
	import { requireSession } from '$lib/auth/guard';
	import { clearOnboardingDraft, readOnboardingDraft } from '$lib/auth/onboarding';
	import { readableAuthError } from '$lib/auth/utils';
	import { supabase } from '$lib/supabaseClient';

	let name = $state('');
	let workspaceName = $state('');
	let role = $state('');
	let formError = $state('');
	let busy = $state(false);

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
		if (!supabase) {
			formError = 'Supabase is not configured for this app.';
			return;
		}
		busy = true;
		const { error } = await supabase.auth.updateUser({ data: { full_name: name, workspace_name: workspaceName, role } });
		if (error) {
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		clearOnboardingDraft();
		await goto('/workspace', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Ready to start | Product Client</title>
	<meta name="description" content="Finish setting up your Product Client account." />
</svelte:head>

<OnboardingFrame current={4} eyebrow="Ready to start" title="Your workspace is ready." description="Here is what we will use to set up your first view. You can change these details later.">
	<div class="summary" aria-label="Your setup details">
		<div class="summary-row"><span class="summary-icon"><CheckCircle size={17} weight="Outline" /></span><span><small>Name</small><strong>{name || 'Your name'}</strong></span></div>
		<div class="summary-row"><span class="summary-icon"><Briefcase size={17} weight="Outline" /></span><span><small>Workspace</small><strong>{workspaceName || 'Your workspace'}</strong></span></div>
		<div class="summary-row"><span class="summary-icon"><Users size={17} weight="Outline" /></span><span><small>Starting view</small><strong>{role || 'Choose a view'}</strong></span></div>
	</div>
	{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}
	<Button type="button" size="lg" loading={busy} class="continue-button" onclick={() => void openWorkspace()}>Open workspace <ArrowRight size={16} weight="Outline" /></Button>
	<p class="complete-note">This saves your profile details to your Supabase account.</p>
</OnboardingFrame>

<style>
	.summary { display: grid; gap: 0; border-top: 1px solid var(--pc-border-strong); border-bottom: 1px solid var(--pc-border-strong); }.summary-row { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: center; gap: 11px; min-height: 67px; }.summary-row + .summary-row { border-top: 1px solid rgba(251, 251, 251, .07); }.summary-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.summary-row small { display: block; color: var(--pc-text-faint); font-size: 10px; }.summary-row strong { display: block; margin-top: 2px; overflow: hidden; color: var(--pc-text); font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }.form-error { margin: 0; padding: 11px 13px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; }.complete-note { margin: 0; color: var(--pc-text-faint); font-size: 12px; text-align: center; }
	:global(.continue-button) { width: 100%; min-height: 48px; }
</style>
