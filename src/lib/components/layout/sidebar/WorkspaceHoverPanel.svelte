<script lang="ts">
	import { ArrowRight } from 'reicon-svelte';
	import type { PanelDef } from './types';

	let {
		panel,
		displayHref,
		isActive,
		isPreview,
		onKeepHovered,
		onLeave,
		focusClass
	}: {
		panel: PanelDef;
		displayHref: string | null;
		isActive: (href: string) => boolean;
		isPreview: boolean;
		onKeepHovered: () => void;
		onLeave: () => void;
		focusClass: string;
	} = $props();

	const PanelIcon = $derived(panel.icon);
</script>

<div class="flex h-full flex-col overflow-hidden">
	<div class="shrink-0 border-b px-4 pb-4 pt-5" style:border-color="var(--pc-border-strong)">
		<div class="flex items-center gap-2.5">
			<span class="grid size-8 place-items-center rounded-[10px] bg-[var(--pc-surface-2)] text-[var(--pc-text)]"><PanelIcon size={16} weight="Outline" aria-hidden="true" /></span>
			<h2 class="text-[14px] font-semibold tracking-[-0.01em] text-[var(--pc-text)]">{panel.label}</h2>
			{#if isPreview}<span class="ml-auto rounded-full bg-[var(--pc-surface-2)] px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] text-[var(--pc-text-muted)]">Preview</span>{/if}
		</div>
		<p class="mt-2 text-[12px] leading-[1.5] text-[var(--pc-text-muted)]">{panel.description}</p>
	</div>

	<div class="flex-1 overflow-y-auto px-3 py-4" style="scrollbar-width: thin;">
		<nav class="space-y-1" aria-label={`${panel.label} quick links`}>
			{#each panel.links as link (link.href + link.label)}
				<a
					href={link.href}
					target={link.external ? '_blank' : undefined}
					rel={link.external ? 'noopener noreferrer' : undefined}
					class="flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] transition-[background-color,color] duration-100 {isActive(link.href) && displayHref === link.href
						? 'bg-[var(--pc-text)] text-[var(--pc-bg)]'
						: 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'} {focusClass}"
					aria-current={isActive(link.href) && displayHref === link.href ? 'page' : undefined}
				>
					<span class="flex items-center gap-2"><span class="size-1 rounded-full bg-[var(--pc-text-faint)]" aria-hidden="true"></span>{link.label}</span>
					{#if link.badge !== undefined}<span class="grid min-w-5 place-items-center rounded-full bg-[var(--pc-surface-2)] px-1.5 py-0.5 text-[11px] font-medium leading-none text-[var(--pc-text-muted)]">{link.badge}</span>{/if}
				</a>
			{/each}
		</nav>

		{#if panel.recent.length > 0}
			<div class="mt-6">
				<p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] leading-[1.1] text-[var(--pc-text-faint)] antialiased">Recent</p>
				<div class="space-y-1">
					{#each panel.recent as item (item.href + item.label)}
						<a href={item.href} class="group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-[background-color] duration-100 hover:bg-[var(--pc-surface-2)] {focusClass}">
							<span class="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--pc-surface-2)] text-[var(--pc-text-faint)] group-hover:bg-[var(--pc-text)] group-hover:text-[var(--pc-bg)] transition-colors"><PanelIcon size={12} weight="Outline" aria-hidden="true" /></span>
							<span class="min-w-0 flex-1"><span class="block truncate text-[12px] font-medium leading-[1.3] text-[var(--pc-text)]">{item.label}</span>{#if item.subtitle}<span class="block truncate text-[11px] leading-[1.3] text-[var(--pc-text-muted)]">{item.subtitle}</span>{/if}</span>
							<ArrowRight size={12} weight="Outline" class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--pc-text-faint)]" aria-hidden="true" />
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>

</div>
