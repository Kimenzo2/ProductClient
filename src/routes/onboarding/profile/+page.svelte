<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowRight, User } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import OnboardingFrame from '$lib/components/auth/OnboardingFrame.svelte';
	import { requireSession } from '$lib/auth/guard';
	import { readOnboardingDraft, saveOnboardingDraft } from '$lib/auth/onboarding';

	let name = $state('');
	let nameError = $state('');
	let formEl = $state<HTMLFormElement | undefined>(undefined);

	onMount(async () => {
		name = readOnboardingDraft().name;
		await requireSession('/onboarding/profile');
	});

	function continueSetup() {
		nameError = name.trim() ? '' : 'Enter your name.';
		if (nameError) {
			formEl?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		saveOnboardingDraft({ name: name.trim() });
		void goto('/onboarding/workspace');
	}
</script>

<svelte:head>
	<title>Your profile | Product Client</title>
	<meta name="description" content="Set up your Product Client profile." />
</svelte:head>

<OnboardingFrame current={1} eyebrow="Your profile" title="What should we call you?" description="Your name helps teammates know who is collecting feedback and making decisions.">
	<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); continueSetup(); }} novalidate>
		<AuthInput id="onboarding-name" label="Your name" name="name" autocomplete="name" placeholder="For example, Amina Yusuf" bind:value={name} error={nameError} required />
		<div class="onboarding-actions single"><Button type="submit" size="lg" class="continue-button">Continue <ArrowRight size={16} weight="Outline" /></Button></div>
	</form>
	<p class="field-note"><User size={14} weight="Outline" /> You can change this later in your profile.</p>
</OnboardingFrame>

<style>
	:global(.onboarding-content form) { display: grid; gap: 22px; }.onboarding-actions { display: grid; grid-template-columns: 1fr minmax(0, 1fr); gap: 12px; }.onboarding-actions.single { grid-template-columns: 1fr; }.field-note { display: inline-flex; align-items: center; justify-content: center; gap: 7px; margin: 0; color: var(--pc-text-faint); font-size: 12px; }
	:global(.continue-button) { width: 100%; min-height: 48px; }
</style>
