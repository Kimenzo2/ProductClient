<script lang="ts">
	import { AlertTriangle, Box, FileText, Heart, History, Inbox, Map, UserSquare } from 'reicon-svelte';
	import type { SearchKind } from '$lib/search/types';

	let {
		href,
		kind,
		title,
		subtitle,
		description = '',
		status,
		meta,
		avatar
	}: {
		href: string;
		kind: SearchKind;
		title: string;
		subtitle: string;
		description?: string;
		status?: string;
		meta?: string;
		avatar?: string;
	} = $props();

	const icons: Record<SearchKind, typeof Box> = {
		Product: Box,
		Decision: Map,
		Problem: Map,
		Release: History,
		Feedback: Inbox,
		Roadmap: Map,
		Doc: FileText,
		Incident: AlertTriangle,
		Proof: Heart,
		Maker: UserSquare
	};
</script>

{#if kind}
	{@const Icon = icons[kind]}
	<a href={href} class="group flex min-w-0 items-start gap-3 rounded-[16px] bg-[var(--pc-surface-2)] p-3 transition-[background-color,transform] duration-150 hover:bg-[var(--pc-surface)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-accent-light)]">
		{#if avatar}
			<img src={avatar} alt="" class="size-10 shrink-0 rounded-[11px] object-cover" />
		{:else}
			<span class="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><Icon size={17} weight="Outline" /></span>
		{/if}
		<span class="min-w-0 flex-1">
			<span class="flex items-center gap-2">
				<strong class="min-w-0 truncate text-[13px] font-medium group-hover:text-[var(--pc-text)]">{title}</strong>
				{#if status}<span class="hidden shrink-0 rounded-full bg-[var(--pc-surface)] px-2 py-0.5 text-[10px] text-[var(--pc-text-muted)] sm:inline">{status}</span>{/if}
			</span>
			<span class="mt-0.5 block truncate text-xs text-[var(--pc-text-muted)] opacity-70">{subtitle}</span>
			{#if description}<span class="mt-1 block line-clamp-2 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-60">{description}</span>{/if}
			{#if meta}<span class="mt-1.5 block text-[10px] text-[var(--pc-text-faint)]">{meta}</span>{/if}
		</span>
	</a>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
