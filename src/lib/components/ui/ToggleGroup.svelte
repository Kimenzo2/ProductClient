<script lang="ts">
	import { ToggleGroup } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		value = $bindable(''),
		type = 'single',
		class: className = '',
		onValueChange,
		children,
		...restProps
	}: {
		value?: string | string[];
		type?: 'single' | 'multiple';
		class?: string;
		onValueChange?: (value: string | string[]) => void;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	function handleChange(v: string | string[] | undefined) {
		if (v !== undefined) onValueChange?.(v);
	}

	let baseClass = $derived('flex items-center gap-1.5 overflow-x-auto {className}');
</script>

<!-- @binding-ignore Bits UI ToggleGroup union types -->
{#if type === 'single'}
	<ToggleGroup.Root
		type="single"
		value={value as string}
		onValueChange={handleChange}
		class={baseClass}
		{...restProps}
	>
		{@render children()}
	</ToggleGroup.Root>
{:else}
	<ToggleGroup.Root
		type="multiple"
		value={value as string[]}
		onValueChange={handleChange}
		class={baseClass}
		{...restProps}
	>
		{@render children()}
	</ToggleGroup.Root>
{/if}
