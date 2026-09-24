<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { ChevronLeft, ChevronRight, MapPoint } from 'reicon-svelte';

	export type ProductFanItem = {
		id: string;
		name: string;
		subtitle?: string;
		category?: string;
		tagline?: string;
		image: string;
		href?: string;
	};

	let {
		items = [],
		class: className = '',
		onExplore
	}: {
		items: ProductFanItem[];
		class?: string;
		onExplore?: (item: ProductFanItem) => void;
	} = $props();

	let active = $state(0);

	// keep active in bounds if items change
	$effect(() => {
		if (active >= items.length) active = 0;
	});

	function prev() {
		active = (active - 1 + items.length) % items.length;
	}
	function next() {
		active = (active + 1) % items.length;
	}

	function handleExplore() {
		const item = items[active];
		if (!item) return;
		if (onExplore) onExplore(item);
		else if (item.href) window.location.href = item.href;
	}

	function circularOffset(index: number, activeIndex: number, total: number): number {
		let offset = index - activeIndex;
		// choose shortest circular distance
		if (Math.abs(offset) > total / 2) {
			offset = offset > 0 ? offset - total : offset + total;
		}
		return offset;
	}

	const visibleRange = 2; // show 5 at a time (active ±2)

	let activeItem = $derived(items[active]);
</script>

<div
	class={cn(
		'flex flex-col items-center bg-[#0a0a0a] px-4 py-10 text-white sm:px-6 sm:py-14',
		className
	)}
>
	<!-- Fan -->
	<div class="relative flex h-[220px] w-full max-w-[560px] items-end justify-center overflow-visible sm:h-[300px]">
		{#each items as item, i (item.id)}
			{@const offset = circularOffset(i, active, items.length)}
			{@const abs = Math.abs(offset)}
			{@const isVisible = abs <= visibleRange}
			{@const rotate = offset * 14}
			{@const x = offset * 78}
			{@const y = abs * 10}
			{@const scale = abs === 0 ? 1 : abs === 1 ? 0.92 : 0.82}
			{@const z = 10 - abs}
			<button
				type="button"
				tabindex={isVisible ? 0 : -1}
				aria-label="Show {item.name}"
				aria-current={i === active ? 'true' : undefined}
				onclick={() => (active = i)}
				class="absolute bottom-6 left-1/2 h-[180px] w-[128px] origin-bottom overflow-hidden rounded-[18px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform sm:h-[220px] sm:w-[152px]"
				style:transform="translateX(calc(-50% + {x}px)) translateY({y}px) rotate({rotate}deg) scale({scale})"
				style:z-index={z}
				style:opacity={isVisible ? '1' : '0'}
				style:pointer-events={isVisible ? 'auto' : 'none'}
				style:filter={abs > 2 ? 'blur(2px)' : 'blur(0px)'}
			>
				<img
					src={item.image}
					alt={item.name}
					loading="lazy"
					class="h-full w-full object-cover"
					draggable="false"
				/>
				<div class="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-white/10 ring-inset"></div>
			</button>
		{/each}
	</div>

	<!-- Header + controls — matches Pacakhe demo but for products -->
	<div class="flex w-full max-w-96 items-center gap-1">
		<button
			type="button"
			tabindex={-1}
			aria-label="Previous product"
			onclick={prev}
			class="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/15 hover:text-white active:scale-[0.92] motion-reduce:transition-none motion-reduce:active:scale-100"
		>
			<ChevronLeft size={20} weight="Outline" aria-hidden="true" />
		</button>

		<div class="flex min-w-0 flex-1 flex-col items-center gap-1 px-2">
			{#key active}
				<h3
					class="w-full truncate text-center text-2xl font-semibold tracking-[-0.02em] text-white"
					style="opacity:1;filter:blur(0px);transform:none"
				>
					{activeItem?.name ?? ''}
				</h3>
				<p
					class="flex w-full items-center justify-center gap-1.5 truncate text-sm text-white/60"
					style="opacity:1;filter:blur(0px);transform:none"
				>
					<MapPoint size={14} weight="Outline" class="size-3.5 shrink-0" aria-hidden="true" />
					<span class="truncate">
						{#if activeItem?.subtitle}
							{activeItem.subtitle}
						{:else if activeItem?.category && activeItem?.tagline}
							{activeItem.category} · {activeItem.tagline}
						{:else}
							{activeItem?.category ?? activeItem?.tagline ?? ''}
						{/if}
					</span>
				</p>
			{/key}
		</div>

		<button
			type="button"
			tabindex={-1}
			aria-label="Next product"
			onclick={next}
			class="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/15 hover:text-white active:scale-[0.92] motion-reduce:transition-none motion-reduce:active:scale-100"
		>
			<ChevronRight size={20} weight="Outline" aria-hidden="true" />
		</button>
	</div>

	<button
		type="button"
		onclick={handleExplore}
		class="mt-5 inline-flex h-9 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black transition-[background-color,scale] duration-150 ease-out hover:bg-white/90 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
	>
		Explore
	</button>
</div>
