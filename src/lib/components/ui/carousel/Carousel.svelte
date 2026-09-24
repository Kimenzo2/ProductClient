<script lang="ts">
	import { setCarouselContext, type CarouselOrientation } from './context.js';
	import { writable } from 'svelte/store';
	import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from 'embla-carousel';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		orientation = 'horizontal',
		opts,
		plugins,
		setApi,
		class: className = '',
		children,
		ref = $bindable(null),
		...restProps
	}: {
		orientation?: CarouselOrientation;
		opts?: EmblaOptionsType;
		plugins?: EmblaPluginType[];
		setApi?: (api: EmblaCarouselType) => void;
		class?: string;
		children?: Snippet;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	} = $props();

	const api = writable<EmblaCarouselType | undefined>(undefined);
	const canScrollPrev = writable(false);
	const canScrollNext = writable(false);

	function onInit(newApi: EmblaCarouselType) {
		api.set(newApi);
		setApi?.(newApi);
		const update = () => {
			canScrollPrev.set(newApi.canScrollPrev());
			canScrollNext.set(newApi.canScrollNext());
		};
		update();
		newApi.on('select', update);
		newApi.on('reInit', update);
	}

	function scrollPrev() {
		let current: EmblaCarouselType | undefined;
		const unsub = api.subscribe((v) => (current = v));
		unsub();
		current?.scrollPrev();
	}

	function scrollNext() {
		let current: EmblaCarouselType | undefined;
		const unsub = api.subscribe((v) => (current = v));
		unsub();
		current?.scrollNext();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		const target = event.target as HTMLElement | null;
		if (
			target?.isContentEditable ||
			target?.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')
		) {
			return;
		}
		const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
		const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
		if (event.key === prevKey) {
			event.preventDefault();
			scrollPrev();
		} else if (event.key === nextKey) {
			event.preventDefault();
			scrollNext();
		}
	}

	// svelte-ignore state_referenced_locally -- orientation/opts/plugins intentionally captured for carousel context (static after mount; updates handled via reInit if needed)
	setCarouselContext({
		orientation,
		api,
		canScrollPrev,
		canScrollNext,
		opts,
		plugins,
		scrollPrev,
		scrollNext,
		onInit
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	tabindex="0"
	onkeydown={handleKeyDown}
	class={cn(
		'relative outline-none transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--pc-focus-ring)] focus-visible:ring-offset-2',
		className
	)}
	role="region"
	aria-roledescription="carousel"
	data-slot="carousel"
	{...restProps}
>
	{@render children?.()}
</div>
