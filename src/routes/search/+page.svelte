<script>
	import { Search } from 'reicon-svelte';
</script>

<svelte:head><title>Search — Product Client</title></svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Search</h1>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-40">Find products, makers, launches.</p>
	</header>

	<!-- Search input — large, centered, pill -->
	<div class="max-w-[520px] mx-auto py-8">
		<div class="flex items-center gap-3 rounded-full bg-[var(--pc-surface-2)] px-5 py-3.5 transition-colors focus-within:bg-[var(--pc-surface)]">
			<Search size={18} weight="Outline" class="opacity-30" />
			<input placeholder="Try 'AI', 'DevTool', 'Figma'..." class="flex-1 bg-transparent text-base outline-none placeholder:text-[var(--pc-text-faint)]" />
		</div>
	</div>
</div>
