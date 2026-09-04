<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		padding = 'md',
		href,
		class: className = '',
		children,
		...restProps
	}: {
		variant?: 'default' | 'surface' | 'interactive';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		href?: string;
		class?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const base = 'rounded-[24px]';

	const variants: Record<string, string> = {
		default: 'bg-[var(--pc-surface-2)]',
		surface: 'bg-[var(--pc-surface)]',
		interactive: 'bg-[var(--pc-surface-2)] transition-[background-color,border-color] duration-200 hover:bg-[var(--pc-surface)] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]'
	};

	const paddings: Record<string, string> = {
		none: '',
		sm: 'p-3',
		md: 'p-4',
		lg: 'p-5'
	};

	let classes = $derived([base, variants[variant], paddings[padding], className].filter(Boolean).join(' '));
	let isExternal = $derived(href?.startsWith('http'));
</script>

{#if href}
	<a
		href={href}
		class="{classes} block"
		rel={isExternal ? 'noopener noreferrer' : undefined}
		{...restProps}
	>
		{@render children()}
	</a>
{:else}
	<div class={classes} {...restProps}>
		{@render children()}
	</div>
{/if}
