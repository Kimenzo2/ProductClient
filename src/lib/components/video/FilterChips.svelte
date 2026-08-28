<script lang="ts">
	import { stateTypes, type StateType } from '$lib/data/mockStates';

	let { active = 'all', onSelect }: { active: StateType | 'all'; onSelect: (v: StateType | 'all') => void } = $props();
</script>

<div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-2">
	{#each stateTypes as t}
		<button
			data-active={active === t.value}
			onclick={() => onSelect(t.value as StateType | 'all')}
			class="pc-chip whitespace-nowrap shrink-0"
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
