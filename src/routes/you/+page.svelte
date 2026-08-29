<script lang="ts">
	import { StatePanel } from '$lib/components/ui';
	import { Rocket } from 'reicon-svelte';
</script>

<svelte:head><title>You — Product Client</title></svelte:head>
<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Your profile</h1>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">Showcase work, verified experience, and your launched products.</p>
	</header>
	<StatePanel icon={Rocket} title="You have not launched a product yet" description="When you are ready, create a product page and share it with the people who need to see it." actionLabel="Create a product page" actionHref="/studio" class="pc-enter" />
</div>
