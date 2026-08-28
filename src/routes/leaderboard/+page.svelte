<script lang="ts">
	import { mockStates } from '$lib/data/mockStates';
	import { Verified } from 'reicon-svelte';

	type Period = 'day' | 'week' | 'month' | 'year';
	let period = $state<Period>('week');

	const periodMultiplier: Record<Period, number> = { day: 0.1, week: 0.5, month: 0.8, year: 1 };

	let rankedProducts = $derived(
		[...new Map(mockStates.map((s) => [s.product.slug, { ...s.product, reads: s.reads }])).values()]
			.map((p) => {
				const multiplier = periodMultiplier[period];
				const baseReads = p.reads.includes('M')
					? parseFloat(p.reads) * 1_000_000
					: p.reads.includes('K')
						? parseFloat(p.reads) * 1_000
						: parseInt(p.reads) || 0;
				return { ...p, score: Math.round(baseReads * multiplier) };
			})
			.sort((a, b) => b.score - a.score)
	);

	function formatScore(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return String(n);
	}

	const podiumEmoji = ['', '🥇', '🥈', '🥉'];
	const podiumLabel = ['', 'Gold', 'Silver', 'Bronze'];
</script>

<svelte:head>
	<title>Leaderboard — Product Client</title>
</svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Leaderboard</h1>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-40">Rolling rankings — votes count at any time.</p>
	</header>

	<!-- Period tabs -->
	<div class="flex items-center gap-1 pb-4">
		{#each (['day', 'week', 'month', 'year'] as Period[]) as p}
			<button
				onclick={() => (period = p)}
				class={[
					'h-8 px-3 rounded-lg text-[13px] font-normal transition-[background-color,color] duration-150',
					period === p
						? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-color)] shadow-[var(--tab-active-shadow)]'
						: 'bg-[var(--tab-bg)] text-[var(--tab-color)] hover:bg-[var(--tab-hover-bg)] hover:text-[var(--tab-hover-color)]'
				].join(' ')}
			>
				{p.charAt(0).toUpperCase() + p.slice(1)}
			</button>
		{/each}
	</div>

	<!-- Leaderboard list -->
	<div class="space-y-2">
		{#each rankedProducts as product, i}
			{@const rank = i + 1}
			<a
				href="/p/{product.slug}"
				class="flex items-center gap-3 p-3 rounded-[14px] bg-[var(--pc-surface-2)] transition-[background-color] group"
			>
				<!-- Rank / podium -->
				<div class="hidden sm:flex flex-col items-center justify-center min-w-[36px] text-center">
					{#if rank <= 3}
						<span class="text-[18px]" title="{podiumLabel[rank]}">{podiumEmoji[rank]}</span>
						<span class="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--pc-text-faint)] opacity-40">{podiumLabel[rank]}</span>
					{:else}
						<span class="text-[11px] font-medium text-[var(--pc-text-faint)] opacity-30">#{rank}</span>
					{/if}
				</div>

				<!-- Product logo -->
				<img
					src={product.avatar}
					alt={product.name}
					loading="lazy"
					class="size-11 rounded-[12px] object-cover"
				/>

				<!-- Info -->
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1.5">
						<h3 class="text-[13px] font-medium leading-tight group-hover:text-[var(--pc-text)] transition-colors">{product.name}</h3>
						{#if product.verified}
							<Verified size={12} weight="Outline" color="var(--color-blue-600)" />
						{/if}
					</div>
					<p class="text-[11px] text-[var(--pc-text-muted)] opacity-40 mt-0.5 truncate">{product.category}</p>
				</div>

				<!-- Score -->
				<div class="text-right shrink-0">
					<p class="text-[13px] font-medium">{formatScore(product.score)}</p>
					<p class="text-[10px] text-[var(--pc-text-faint)] opacity-30">
						{period === 'day' ? 'today' : period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year'}
					</p>
				</div>
			</a>
		{/each}
	</div>

	<!-- Footer -->
	<p class="mt-6 text-center text-[11px] text-[var(--pc-text-faint)] opacity-30">
		Rankings update continuously as votes come in.
	</p>
</div>
