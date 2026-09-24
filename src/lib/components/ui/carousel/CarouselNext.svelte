<script lang="ts">
	import { getCarouselContext } from './context.js';
	import { cn } from '$lib/utils.js';
	import { ChevronRight } from 'reicon-svelte';

	let {
		class: className = '',
		variant: _variant = 'outline',
		size: _size = 'sm',
		ref = $bindable(null),
		...restProps
	}: {
		class?: string;
		variant?: string;
		size?: string;
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	} = $props();

	const ctx = getCarouselContext();
	const canScrollNext = ctx.canScrollNext;
</script>

<button
	bind:this={ref}
	data-slot="carousel-next"
	data-sound="carousel-next"
	class={cn(
		'absolute flex size-8 items-center justify-center rounded-full border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] text-[var(--pc-text)] shadow-sm touch-manipulation hover:bg-[var(--pc-surface)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]',
		ctx.orientation === 'horizontal'
			? 'inset-y-0 -right-12 my-auto'
			: '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
		className
	)}
	disabled={!$canScrollNext}
	onclick={ctx.scrollNext}
	aria-label="Next slide"
	{...restProps}
>
	<ChevronRight size={16} weight="Outline" aria-hidden="true" />
	<span class="sr-only">Next slide</span>
</button>
