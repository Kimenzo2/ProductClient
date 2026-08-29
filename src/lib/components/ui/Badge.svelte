<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		size = 'sm',
		class: className = '',
		children,
		...restProps
	}: {
		variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
		size?: 'xs' | 'sm' | 'md';
		class?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const base = 'inline-flex items-center justify-center rounded-full font-medium';

	const variants: Record<string, string> = {
		default: 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]',
		accent: 'bg-[var(--pc-accent)] text-white',
		success: 'bg-[var(--pc-accent)] text-white',
		warning: 'bg-[var(--yellow-7)] text-[var(--pc-bg)]',
		danger: 'bg-[var(--red-6)] text-white'
	};

	const sizes: Record<string, string> = {
		xs: 'size-4 text-[9px]',
		sm: 'size-5 text-[10px]',
		md: 'size-6 text-[11px]'
	};
</script>

<span
	class="{base} {sizes[size]} {variants[variant]} {className}"
	{...restProps}
>
	{@render children()}
</span>
