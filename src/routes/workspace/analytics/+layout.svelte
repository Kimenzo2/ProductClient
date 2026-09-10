<script lang="ts">
	import { page } from '$app/state';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { analyticsRange, type AnalyticsRange, rangeLabel } from '$lib/data/analytics-range.svelte';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let { children } = $props();

	let range = $derived(analyticsRange.value);
	function setRange(v: AnalyticsRange) { analyticsRange.value = v; }
</script>

<div class="mx-auto w-full max-w-[1180px] px-6 max-sm:px-4">
	<div class="flex flex-wrap items-center gap-2 py-4 border-b border-[var(--pc-border-strong)]">
		<div class="flex items-center gap-1.5">
			{#each [{value:'7d', label:'Last 7 days'}, {value:'30d', label:'Last 30 days'}, {value:'90d', label:'Last 90 days'}] as opt}
				<button onclick={() => setRange(opt.value as AnalyticsRange)} class="inline-flex items-center h-7 rounded-full px-3 text-xs font-medium transition-colors {range===opt.value ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]'}">{opt.label}</button>
			{/each}
		</div>
		<button class="ml-auto hidden sm:inline-flex items-center gap-1.5 h-7 rounded-[10px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] px-2.5 text-xs font-medium text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface)]" use:tooltip={{ text: 'Export to CSV', island: true }}>Export to CSV</button>
		<span class="hidden sm:inline text-xs text-[var(--pc-text-faint)]">{rangeLabel(range)}</span>
	</div>

	{@render children()}
</div>
