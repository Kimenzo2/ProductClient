<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'reicon-svelte';

	let { screenshots = [], name = '' }: { screenshots: string[]; name?: string } = $props();

	let scrollEl = $state<HTMLDivElement | null>(null);
	let activeIndex = $state(0);

	function scroll(dir: number) {
		if (!scrollEl) return;
		const child = scrollEl.children[activeIndex + dir] as HTMLElement;
		if (child) {
			child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
			activeIndex = Math.max(0, Math.min(screenshots.length - 1, activeIndex + dir));
		}
	}

	function onScroll() {
		if (!scrollEl) return;
		const scrollLeft = scrollEl.scrollLeft;
		const childWidth = scrollEl.children[0] as HTMLElement | undefined;
		if (childWidth) {
			activeIndex = Math.round(scrollLeft / childWidth.offsetWidth);
		}
	}
</script>

{#if screenshots.length > 0}
	<div class="relative group/gal">
		<!-- Scrollable strip -->
		<div
			bind:this={scrollEl}
			onscroll={onScroll}
			class="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-2"
		>
			{#each screenshots as src, i}
				<div class="snap-center shrink-0 w-full sm:w-[85%] md:w-[75%] lg:w-[70%]">				<div class="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[var(--pc-surface-2)]">
				<img
					{src}
					alt="{name} screenshot {i + 1}"
					loading="lazy"
					class="h-full w-full object-cover"
				/>
						<!-- Index badge -->
						<span class="absolute bottom-2 right-2 rounded-[6px] bg-black/70 px-1.5 py-1 text-[10px] font-600 text-white backdrop-blur">
							{i + 1} / {screenshots.length}
						</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Nav arrows -->
		{#if screenshots.length > 1}
			<button
				onclick={() => scroll(-1)}
				disabled={activeIndex === 0}
				class="absolute left-2 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/70 text-white backdrop-blur opacity-0 group-hover/gal:opacity-100 transition-opacity disabled:opacity-30 active:scale-95"
				aria-label="Previous screenshot"
			>
				<ChevronLeft size={18} weight="Outline" />
			</button>
			<button
				onclick={() => scroll(1)}
				disabled={activeIndex === screenshots.length - 1}
				class="absolute right-2 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/70 text-white backdrop-blur opacity-0 group-hover/gal:opacity-100 transition-opacity disabled:opacity-30 active:scale-95"
				aria-label="Next screenshot"
			>
				<ChevronRight size={18} weight="Outline" />
			</button>
		{/if}

		<!-- Dot indicators -->
		{#if screenshots.length > 1}
			<div class="flex justify-center gap-1.5 mt-3">
				{#each screenshots as _, i}
				<button
					onclick={() => {
						if (!scrollEl) return;
						const child = scrollEl.children[i] as HTMLElement;
						child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
						activeIndex = i;
					}}
					class="size-2 min-w-[24px] min-h-[24px] rounded-full transition-[background-color] duration-200"
					class:bg-[var(--pc-text)]={activeIndex === i}
					class:bg-[var(--pc-surface-2)]={activeIndex !== i}
					aria-label="Go to screenshot {i + 1}"
				></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
