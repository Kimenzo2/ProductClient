<script>
	import { Search } from 'reicon-svelte';
</script>
<svelte:head><title>Search — Product Client</title></svelte:head>
<div class="mx-auto max-w-[720px] px-4 py-12 pc-enter">
	<h1 class="text-2xl font-700 tracking-tighter flex items-center gap-2"><Search size={20} weight="Outline" /> Search</h1>
	<p class="text-sm text-[var(--pc-text-muted)]">Find products, makers, launches — like  Search +  directory.</p>
	<div class="mt-6 flex items-center gap-2 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-3">
		<Search size={16} weight="Outline" />
		<input placeholder="Try ‘AI’, ‘DevTool’, ‘’…" class="flex-1 bg-transparent text-sm outline-none" />
	</div>
</div>
