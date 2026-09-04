<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		size = 'sm',
		class: className = '',
		children,
		...restProps
	}: {
		variant?: 'default' | 'accent' | 'ghost';
		size?: 'xs' | 'sm';
		class?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const base = 'inline-flex items-center rounded-full font-normal whitespace-nowrap transition-[background-color,color] duration-150';

	const variants: Record<string, string> = {
		default: 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-border-strong)] border border-transparent',
		accent: 'bg-[var(--pc-accent-soft)] text-[var(--pc-accent-strong)] border border-[var(--pc-accent-ring)]',
		ghost: 'bg-transparent text-[var(--pc-text-faint)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text-muted)]'
	};

	const sizes: Record<string, string> = {
		xs: 'px-2.5 py-1 text-[11px] leading-none tracking-[-0.01em] font-medium',
		sm: 'px-2.5 py-1 text-xs leading-none tracking-[-0.01em] font-medium'
	};

	let classes = $derived([base, variants[variant], sizes[size], className].filter(Boolean).join(' '));
</script>

<span class={classes} {...restProps}>
	{@render children()}
</span>
