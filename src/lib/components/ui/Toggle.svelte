<script lang="ts">
	import { Toggle } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		pressed = $bindable(false),
		variant = 'default',
		size = 'md',
		class: className = '',
		onPressedChange,
		children,
		...restProps
	}: {
		pressed?: boolean;
		variant?: 'default' | 'outline';
		size?: 'sm' | 'md';
		class?: string;
		onPressedChange?: (pressed: boolean) => void;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-[background-color,color,opacity] duration-150 cursor-pointer focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)]';

	const sizes: Record<string, string> = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-9 px-4 text-[13px]'
	};

	let classes = $derived(
		[base, sizes[size], className].filter(Boolean).join(' ')
	);

	let activeClasses = $derived(
		variant === 'outline'
			? 'bg-transparent text-[var(--pc-text)] border border-[var(--pc-border-strong)] hover:bg-[var(--pc-surface-2)]'
			: 'bg-[var(--pc-text)] text-[var(--pc-bg)] hover:opacity-[0.88]'
	);

	let inactiveClasses = $derived(
		variant === 'outline'
			? 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)] border border-transparent'
			: 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]'
	);
</script>

<Toggle.Root
	bind:pressed
	{onPressedChange}
	class="{classes} {pressed ? inactiveClasses : activeClasses}"
	{...restProps}
>
	{@render children()}
</Toggle.Root>
