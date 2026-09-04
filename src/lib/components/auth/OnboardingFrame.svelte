<script lang="ts">
	import type { Snippet } from 'svelte';
	import OnboardingProgress from '$lib/components/auth/OnboardingProgress.svelte';

	let {
		current,
		eyebrow,
		title,
		description,
		children
	}: {
		current: 1 | 2 | 3 | 4;
		eyebrow: string;
		title: string;
		description: string;
		children: Snippet;
	} = $props();
</script>

<section class="onboarding-page" aria-labelledby="onboarding-title">
	<OnboardingProgress {current} />
	<div class="onboarding-intro">
		
		<h1 id="onboarding-title">{title}</h1>
		<p>{description}</p>
	</div>
	<div class="onboarding-content">
		{@render children()}
	</div>
</section>

<style>
	.onboarding-page { display: grid; gap: 0; }.onboarding-intro { display: grid; gap: 9px; margin-bottom: 27px; }.onboarding-intro h1 { max-width: 13ch; margin: 0; color: var(--pc-text); font-size: clamp(29px, 4vw, 43px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; }.onboarding-intro > p:last-child { max-width: 42ch; margin: 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; }.onboarding-content { display: grid; gap: 22px; }
</style>
