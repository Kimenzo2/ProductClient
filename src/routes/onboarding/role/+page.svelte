<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, Briefcase, Code, MessageDots, Users } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import OnboardingFrame from '$lib/components/auth/OnboardingFrame.svelte';
	import { requireSession } from '$lib/auth/guard';
	import { readOnboardingDraft, saveOnboardingDraft, type OnboardingRole } from '$lib/auth/onboarding';

	type RoleOption = { value: OnboardingRole; label: string; description: string; icon: typeof Briefcase };

	const roleOptions: RoleOption[] = [
		{ value: 'Product manager', label: 'Product manager', description: 'Decisions, feedback, and progress', icon: Briefcase },
		{ value: 'Developer', label: 'Developer', description: 'Builds and ships product work', icon: Code },
		{ value: 'Customer support', label: 'Customer support', description: 'Requests and service response', icon: MessageDots },
		{ value: 'Team lead', label: 'Team lead', description: 'A clear view across the team', icon: Users }
	];

	let selectedRole = $state<OnboardingRole | ''>('');
	let roleError = $state('');

	onMount(async () => {
		selectedRole = readOnboardingDraft().role;
		await requireSession('/onboarding/role');
	});

	function continueSetup() {
		roleError = selectedRole ? '' : 'Choose the view that fits your work.';
		if (roleError) return;
		saveOnboardingDraft({ role: selectedRole });
		void goto('/onboarding/complete');
	}
</script>

<svelte:head>
	<title>Your starting view | Product Client</title>
	<meta name="description" content="Choose your starting view in Product Client." />
</svelte:head>

<OnboardingFrame current={3} eyebrow="Your starting view" title="What do you work on most?" description="Choose one to set up your first view. You can change it later.">
	<div class="role-options" role="group" aria-label="Choose your role">
		{#each roleOptions as option}
			{@const Icon = option.icon}
			<button type="button" class:selected={selectedRole === option.value} aria-pressed={selectedRole === option.value} onclick={() => { selectedRole = option.value; roleError = ''; }}>
				<span class="role-icon"><Icon size={18} weight="Outline" /></span>
				<span class="role-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
				{#if selectedRole === option.value}<span class="selected-mark" aria-label="Selected"><span></span></span>{/if}
			</button>
		{/each}
	</div>
	{#if roleError}<p class="role-error" role="alert">{roleError}</p>{/if}
	<div class="onboarding-actions"><Button type="button" variant="outline" size="lg" onclick={() => goto('/onboarding/workspace')}><ArrowLeft size={16} weight="Outline" /> Back</Button><Button type="button" size="lg" class="continue-button" onclick={continueSetup}>Continue <ArrowRight size={16} weight="Outline" /></Button></div>
</OnboardingFrame>

<style>
	.role-options { display: grid; gap: 9px; }.role-options button { position: relative; display: grid; grid-template-columns: 40px minmax(0, 1fr) 20px; align-items: center; gap: 11px; width: 100%; min-height: 65px; padding: 11px 13px; border: 1px solid var(--pc-border-strong); border-radius: 14px; color: var(--pc-text-muted); background: rgba(251, 251, 251, .025); text-align: start; cursor: pointer; transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease; }.role-options button:hover { border-color: rgba(251, 251, 251, .18); background: rgba(251, 251, 251, .05); }.role-options button:active { transform: scale(.98); }.role-options button.selected { border-color: rgba(198, 254, 30, .42); color: var(--pc-text); background: rgba(119, 152, 18, .12); }.role-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 11px; color: var(--pc-text-muted); background: rgba(251, 251, 251, .06); }.selected .role-icon { color: var(--pc-accent-light); background: rgba(119, 152, 18, .15); }.role-copy strong { display: block; color: var(--pc-text); font-size: 13px; font-weight: 500; }.role-copy small { display: block; margin-top: 3px; color: var(--pc-text-faint); font-size: 11px; }.selected-mark { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--pc-accent-light); border-radius: 50%; }.selected-mark span { width: 8px; height: 8px; border-radius: 50%; background: var(--pc-accent-light); }.role-error { margin: -8px 0 0; color: #f09b9b; font-size: 12px; }.onboarding-actions { display: grid; grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr); gap: 12px; margin-top: 1px; }@media (prefers-reduced-motion: reduce) { .role-options button { transition: none; }.role-options button:active { transform: none; } }
	:global(.onboarding-actions button) { width: 100%; min-height: 48px; }
	:global(.continue-button) { width: 100%; min-height: 48px; }
</style>
