<script lang="ts">
	import { Button } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		href,
		type = 'button',
		class: className = '',
		onclick,
		children,
		...restProps
	}: {
		variant?: 'primary' | 'ghost' | 'outline' | 'icon';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]';

	const variants: Record<string, string> = {
		primary: 'bg-[var(--pc-text)] text-[var(--pc-bg)] hover:opacity-[0.88] active:scale-[0.96] transition-[background-color,color,opacity,transform] duration-150',
		ghost: 'bg-transparent text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)] active:scale-[0.96] transition-[background-color,color,transform] duration-150',
		outline: 'bg-transparent text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)] active:scale-[0.96] transition-[background-color,color,transform] duration-150',
		icon: 'bg-transparent text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)] active:scale-[0.96] transition-[background-color,color,transform] duration-150'
	};

	const sizes: Record<string, string> = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-9 px-4 text-[13px]',
		lg: 'h-10 px-5 text-sm'
	};

	const iconSizes: Record<string, string> = {
		sm: 'size-8',
		md: 'size-9',
		lg: 'size-10'
	};

	let classes = $derived(
		[base, variant === 'icon' ? iconSizes[size] : sizes[size], variants[variant], disabled || loading ? 'pointer-events-none opacity-50' : '', className].filter(Boolean).join(' ')
	);

	let isExternal = $derived(href?.startsWith('http'));

	function handleAnchorClick(event: MouseEvent) {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		onclick?.(event);
	}
</script>

{#if href}
	<a
		href={href}
		class={classes}
		onclick={handleAnchorClick}
		rel={isExternal ? 'noopener noreferrer' : undefined}
		aria-disabled={disabled || loading}
		{...restProps}
	>
		{#if loading}
			<span class="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
		{/if}
		{@render children()}
	</a>
{:else}
	<Button.Root
		{type}
		disabled={disabled || loading}
		class={classes}
		{onclick}
		aria-disabled={disabled || loading}
		{...restProps}
	>
		{#if loading}
			<span class="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
		{/if}
		{@render children()}
	</Button.Root>
{/if}
