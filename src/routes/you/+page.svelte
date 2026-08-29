<script lang="ts">
	import { Button, Card } from '$lib/components/ui';
</script>

<svelte:head><title>You — Product Client</title></svelte:head>
<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Your profile</h1>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">Showcase work, verified experience, and your launched products.</p>
	</header>
	<Card padding="lg" class="py-12 flex flex-col items-center text-center pc-enter">
		<p class="text-sm font-medium">No products launched yet</p>
		<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-65">Launch from Studio — get an SEO-ready page for Google & AI.</p>
		<Button href="/studio" variant="primary" class="mt-4">Go to Studio</Button>
	</Card>
</div>
