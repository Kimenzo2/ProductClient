<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		void goto('/onboarding/profile', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Set up your workspace | Product Client</title>
	<meta name="description" content="Set up your Product Client workspace." />
</svelte:head>

<div class="redirect-state" role="status" aria-live="polite">
	<p>Opening setup...</p>
</div>

<style>
	.redirect-state { display: grid; min-height: 60vh; place-items: center; color: var(--pc-text-muted); font-size: 14px; }
	.redirect-state p { margin: 0; }
</style>
