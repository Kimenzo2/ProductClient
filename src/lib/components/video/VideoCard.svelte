<script lang="ts">
	import type { MockState } from '$lib/data/mockStates';
	import { Play, Verified, MoreH } from 'reicon-svelte';

	let { item }: { item: MockState } = $props();

	const typeMeta: Record<string, { label: string; color: string; bg: string }> = {
		launch: { label: 'Launch', color: 'white', bg: 'var(--red-6)' },
		changelog: { label: 'Changelog', color: 'white', bg: 'var(--blue-6)' },
		incident: { label: 'Incident', color: 'white', bg: 'var(--yellow-7)' },
		fix: { label: 'Fix', color: 'white', bg: 'var(--green-7)' },
		event: { label: 'Event', color: 'white', bg: 'var(--violet-6)' }
	};

	let meta = $derived(typeMeta[item.type] ?? typeMeta.launch);
</script>

<div class="group flex flex-col gap-3">
	<a href="/watch/{item.id}" class="relative aspect-video overflow-hidden rounded-[12px] bg-[var(--pc-surface-2)] shadow-[var(--pc-shadow-card)] border border-[var(--pc-border)] block">
		<img
			src={item.thumbnail}
			alt={item.title}
			loading="lazy"
			class="h-full w-full object-cover transition-[transform,filter] duration-300 group-hover:scale-[1.03] group-hover:brightness-[1.02]"
		/>
		<span
			class="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-700 tracking-wide uppercase text-white shadow"
			style:background={meta.bg}
		>
			{meta.label}
		</span>
		<span
			class="absolute bottom-2 right-2 rounded-[6px] bg-black/80 px-1.5 py-1 text-[11px] font-600 leading-none text-white backdrop-blur"
		>
			{item.duration}
		</span>
		<!-- play hover -->
		<span
			class="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10"
		>
			<span class="grid size-12 place-items-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur">
				<Play size={20} weight="Outline" color="black" />
			</span>
		</span>
	</a>

	<div class="flex gap-3">
		<a href="/p/{item.product.slug}" class="shrink-0">
			<img src={item.product.avatar} alt={item.product.name} class="size-9 rounded-full object-cover mt-0.5 ring-1 ring-[var(--pc-border)]" />
		</a>
		<div class="min-w-0 flex-1">
			<a href="/watch/{item.id}" class="block">
				<h3 class="line-clamp-2 text-[15px] font-600 leading-[1.35] group-hover:text-[var(--blue-7)] transition-colors">
					{item.title}
				</h3>
			</a>
			<a
				href="/p/{item.product.slug}"
				class="mt-1 flex items-center gap-1 text-sm text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"
			>
				{item.product.name}
				{#if item.product.verified}
					<Verified size={14} weight="Outline" color="var(--blue-6)" />
				{/if}
			</a>
			<p class="text-[13px] leading-4 text-[var(--pc-text-faint)]">
				{item.views} views • {item.postedAt}
			</p>
		</div>
		<button
			aria-label="More"
			class="hidden group-hover:grid size-8 place-items-center rounded-full hover:bg-[var(--pc-surface-2)] shrink-0 self-start"
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			<MoreH size={16} weight="Outline" />
		</button>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
