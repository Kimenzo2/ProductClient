<script lang="ts">
	import { Inbox } from 'reicon-svelte';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	type StateVariant = 'empty' | 'success';
	type StateSize = 'page' | 'section';

	let {
		variant = 'empty',
		size = 'section',
		icon = Inbox,
		title,
		description,
		actionLabel,
		actionHref,
		onAction,
		secondaryLabel,
		secondaryHref,
		class: className = '',
		children
	}: {
		variant?: StateVariant;
		size?: StateSize;
		icon?: typeof Inbox;
		title: string;
		description: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: (event: MouseEvent) => void;
		secondaryLabel?: string;
		secondaryHref?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	let Icon = $derived(icon);
	let isSuccess = $derived(variant === 'success');
	let iconClasses = $derived(isSuccess ? 'bg-[var(--pc-accent)]/18 text-[var(--pc-accent-light)]' : 'bg-[var(--pc-surface)] text-[var(--pc-text-muted)]');
	let panelClasses = $derived([
		'flex w-full flex-col items-center justify-center text-center',
		size === 'page' ? 'mx-auto min-h-[300px] max-w-[680px] rounded-[24px] px-6 py-12 sm:min-h-[340px] sm:px-12' : 'min-h-[240px] rounded-[20px] px-5 py-12',
		'bg-[var(--pc-surface-2)]',
		className
	].filter(Boolean).join(' '));
</script>

<section class={panelClasses} aria-live={isSuccess ? 'polite' : undefined}>
	<div class="grid size-12 place-items-center rounded-full {iconClasses}"><Icon size={21} weight="Outline" aria-hidden="true" /></div>
	<h2 class="mt-4 max-w-[28ch] text-base font-medium leading-snug">{title}</h2>
	<p class="mt-2 max-w-[48ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-75">{description}</p>
	{#if actionLabel || secondaryLabel}
		<div class="mt-6 flex flex-wrap items-center justify-center gap-2">
			{#if actionLabel}
				{#if actionHref}<Button href={actionHref} variant={isSuccess ? 'primary' : 'outline'} size="sm">{actionLabel}</Button>{:else}<Button variant={isSuccess ? 'primary' : 'outline'} size="sm" onclick={onAction}>{actionLabel}</Button>{/if}
			{/if}
			{#if secondaryLabel && secondaryHref}<Button href={secondaryHref} variant="ghost" size="sm">{secondaryLabel}</Button>{/if}
		</div>
	{/if}
	{#if children}{@render children()}{/if}
</section>
