<script lang="ts">
	import type { MockState } from '$lib/data/mockStates';
	import { Verified, MoreH } from 'reicon-svelte';
	import { Avatar, Badge, Button, Card } from '$lib/components/ui';

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

<div class="group flex flex-col gap-2.5 pc-enter">
	<a href="/update/{item.id}" class="relative aspect-[4/3] overflow-hidden block rounded-[14px]">
		<img
			src={item.thumbnail}
			alt={item.title}
			loading="lazy"
			class="h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-[1.04]"
		/>
		<span
			class="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-medium tracking-wide uppercase text-white shadow"
			style:background={meta.bg}
		>
			{meta.label}
		</span>
		<span
			class="absolute bottom-2 right-2 rounded-[6px] bg-black/80 px-1.5 py-1 text-[11px] font-medium leading-none text-white backdrop-blur"
		>
			{item.readTime}
		</span>
	</a>

	<div class="flex gap-3">
		<Avatar src={item.product.avatar} alt={item.product.name} size="md" />
		<div class="min-w-0 flex-1">
			<a href="/update/{item.id}" class="block">
				<h3 class="line-clamp-2 text-sm font-medium leading-[1.35] group-hover:text-[var(--pc-text)] transition-colors">
					{item.title}
				</h3>
			</a>
			<a
				href="/p/{item.product.slug}"
				class="mt-1 flex items-center gap-1 text-sm text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"
			>
				{item.product.name}
				{#if item.product.verified}
					<Verified size={14} weight="Outline" color="var(--color-blue-600)" />
				{/if}
			</a>
			<a href="/m/{item.maker.handle}" class="text-sm leading-4 text-[var(--pc-text-faint)] hover:text-[var(--pc-text-muted)]">
				by {item.maker.name} • {item.reads} reads • {item.postedAt}
			</a>
		</div>
		<Button variant="icon" size="sm" class="hidden group-hover:grid shrink-0 self-start"
			onclick={(e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
			}}
		>
			<MoreH size={16} weight="Outline" />
		</Button>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
