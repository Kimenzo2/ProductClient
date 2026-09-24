<script lang="ts">
	import { getCarouselContext } from './context.js';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		class: className = '',
		children,
		ref = $bindable(null),
		...restProps
	}: {
		class?: string;
		children?: Snippet;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	} = $props();

	const ctx = getCarouselContext();
</script>

<div
	bind:this={ref}
	role="group"
	aria-roledescription="slide"
	data-slot="carousel-item"
	class={cn(
		'min-w-0 shrink-0 grow-0 basis-full',
		ctx.orientation === 'horizontal' ? 'pl-4' : 'pt-4',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
