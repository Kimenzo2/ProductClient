<script lang="ts">
	import { Label } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		for: forAttr,
		required = false,
		class: className = '',
		children,
		...restProps
	}: {
		for?: string;
		required?: boolean;
		class?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<Label.Root
	for={forAttr}
	class="block text-[13px] font-medium text-[var(--pc-text)] {className}"
	{...restProps}
>
	{@render children()}
	{#if required}
		<span class="text-[var(--red-6)] ml-0.5">*</span>
	{/if}
</Label.Root>
