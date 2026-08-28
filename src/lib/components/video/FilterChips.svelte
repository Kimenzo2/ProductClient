<script lang="ts">
	import { stateTypes, type StateType } from '$lib/data/mockStates';

	let { active = 'all', onSelect }: { active: StateType | 'all'; onSelect: (v: StateType | 'all') => void } = $props();
</script>

<div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
	{#each stateTypes as t}
		<button
			data-active={active === t.value}
			onclick={() => onSelect(t.value as StateType | 'all')}
			class={[
				'inline-flex items-center justify-center h-9 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150',
				active === t.value
					? 'bg-[var(--pc-surface-2)] text-[var(--pc-text)] shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
					: 'bg-transparent text-[var(--pc-text-faint)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text-muted)]'
			].join(' ')}
		>
			{t.label}
		</button>
	{/each}
</div>

<style>
	.scrollbar-none {
		scrollbar-width: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
