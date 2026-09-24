<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
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

	const emblaOptions = ctx.opts
		? { ...ctx.opts, axis: ctx.orientation === 'horizontal' ? 'x' : 'y' }
		: ({ axis: ctx.orientation === 'horizontal' ? 'x' : 'y' } as const);

	function handleInit(event: CustomEvent) {
		ctx.onInit(event.detail);
	}
</script>

<div
	bind:this={ref}
	use:emblaCarouselSvelte={{ options: emblaOptions as never, plugins: ctx.plugins ?? [] }}
	onemblaInit={handleInit}
	class="overflow-hidden"
	data-slot="carousel-content"
>
	<div class={cn('flex', ctx.orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)} {...restProps}>
		{@render children?.()}
	</div>
</div>
