<script lang="ts">
	import type { Snippet } from 'svelte';
	import OnboardingProgress from '$lib/components/auth/OnboardingProgress.svelte';

	let {
		current,
		title,
		description,
		children
	}: {
		current: 1 | 2 | 3 | 4;
		title: string;
		description: string;
		children: Snippet;
	} = $props();
</script>

<section class="onboarding-page" aria-labelledby="onboarding-title">
	<OnboardingProgress {current} />
	<div class="onboarding-intro">
		
		<h1 id="onboarding-title" class="text-wrap-balance">{title}</h1>
		<p>{description}</p>
	</div>
	<div class="onboarding-content">
		{@render children()}
	</div>
</section>

<style>
	.onboarding-page { display: grid; gap: 0; }.onboarding-intro { display: grid; gap: 6px; margin-bottom: 18px; }.onboarding-intro h1 { max-width: 13ch; margin: 0; color: var(--pc-text); font-size: clamp(26px, 4vw, 36px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; text-wrap: balance; overflow-wrap: break-word; }.onboarding-intro > p:last-child { max-width: 38ch; margin: 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.5; overflow-wrap: break-word; }.onboarding-content { display: grid; gap: 14px; }
</style>