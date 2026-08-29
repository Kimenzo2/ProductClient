<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, Building } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import OnboardingFrame from '$lib/components/auth/OnboardingFrame.svelte';
	import { requireSession } from '$lib/auth/guard';
	import { readOnboardingDraft, saveOnboardingDraft } from '$lib/auth/onboarding';

	let workspaceName = $state('');
	let workspaceError = $state('');
	let formEl = $state<HTMLFormElement | undefined>(undefined);

	onMount(async () => {
		workspaceName = readOnboardingDraft().workspaceName;
		await requireSession('/onboarding/workspace');
	});

	function continueSetup() {
		workspaceError = workspaceName.trim() ? '' : 'Enter a workspace name.';
		if (workspaceError) {
			formEl?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		saveOnboardingDraft({ workspaceName: workspaceName.trim() });
		void goto('/onboarding/role');
	}
</script>

<svelte:head>
	<title>Your workspace | Product Client</title>
	<meta name="description" content="Name your Product Client workspace." />
</svelte:head>

<OnboardingFrame current={2} eyebrow="Your workspace" title="What is your workspace called?" description="This is where your team will organize customer feedback, product decisions, updates, and service work.">
	<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); continueSetup(); }} novalidate>
		<AuthInput id="onboarding-workspace" label="Workspace name" name="workspace-name" placeholder="For example, Kora product team" bind:value={workspaceName} error={workspaceError} required />
		<div class="onboarding-actions"><Button type="button" variant="outline" size="lg" onclick={() => goto('/onboarding/profile')}><ArrowLeft size={16} weight="Outline" /> Back</Button><Button type="submit" size="lg" class="continue-button">Continue <ArrowRight size={16} weight="Outline" /></Button></div>
	</form>
	<p class="field-note"><Building size={14} weight="Outline" /> Use the name your team already uses.</p>
</OnboardingFrame>

<style>
	:global(.onboarding-content form) { display: grid; gap: 22px; }.onboarding-actions { display: grid; grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr); gap: 12px; }.field-note { display: inline-flex; align-items: center; justify-content: center; gap: 7px; margin: 0; color: var(--pc-text-faint); font-size: 12px; }
	:global(.onboarding-actions button) { width: 100%; min-height: 48px; }
</style>
