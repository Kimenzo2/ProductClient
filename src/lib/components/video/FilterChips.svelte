<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import { stateTypes, type StateType } from '$lib/data/mockStates';

	let { active = 'all', onSelect }: { active: StateType | 'all'; onSelect: (v: StateType | 'all') => void } = $props();

	const chipClass = 'inline-flex items-center justify-center h-9 px-3 rounded-lg text-[13px] font-normal whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)] data-[state=on]:bg-[var(--tab-active-bg)] data-[state=on]:text-[var(--tab-active-color)] data-[state=on]:shadow-[var(--tab-active-shadow)] data-[state=off]:bg-[var(--tab-bg)] data-[state=off]:text-[var(--tab-color)] data-[state=off]:hover:bg-[var(--tab-hover-bg)] data-[state=off]:hover:text-[var(--tab-hover-color)]';
</script>

<ToggleGroup.Root
	type="single"
	value={active}
	onValueChange={(v) => { if (v) onSelect(v as StateType | 'all'); }}
	class="flex items-center gap-1.5 overflow-x-auto scrollbar-none"
>
	{#each stateTypes as t (t.value)}
		<ToggleGroup.Item value={t.value} class={chipClass}>
			{t.label}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>

<style>
	.scrollbar-none {
		scrollbar-width: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
