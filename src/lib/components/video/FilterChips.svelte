<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import { stateTypes, type StateType } from '$lib/data/mockStates';

	let { active = 'all', onSelect }: { active: StateType | 'all'; onSelect: (v: StateType | 'all') => void } = $props();

	const chipClass = 'inline-flex items-center justify-center h-9 px-3.5 rounded-full text-[13px] font-medium leading-[1] tracking-[-0.01em] whitespace-nowrap shrink-0 snap-start antialiased transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] data-[state=on]:bg-[var(--tab-active-bg)] data-[state=on]:text-[var(--tab-active-color)] data-[state=on]:shadow-[var(--tab-active-shadow)] data-[state=off]:bg-[var(--tab-bg)] data-[state=off]:text-[var(--tab-color)] data-[state=off]:hover:bg-[var(--tab-hover-bg)] data-[state=off]:hover:text-[var(--tab-hover-color)]';
</script>

<ToggleGroup.Root
	type="single"
	value={active}
	onValueChange={(v) => { if (v) onSelect(v as StateType | 'all'); }}
	aria-label="Filter launches by type"
	class="flex items-center gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-ps-6 scroll-pe-6 scroll-smooth pe-6 [scroll-padding-inline:1.5rem]"
	style="scrollbar-width:none; -webkit-overflow-scrolling:touch;"
>
	{#each stateTypes as t (t.value)}
		<ToggleGroup.Item value={t.value} class={chipClass}>
			{t.label}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>


