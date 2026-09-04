<script lang="ts">
	import { Avatar } from 'bits-ui';

	let {
		src = '',
		alt = '',
		fallback = '',
		size = 'md',
		shape = 'circle',
		class: className = ''
	}: {
		src?: string;
		alt?: string;
		fallback?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		shape?: 'circle' | 'square';
		class?: string;
	} = $props();

	const sizes: Record<string, string> = {
		xs: 'size-5',
		sm: 'size-7',
		md: 'size-9',
		lg: 'size-12',
		xl: 'size-20'
	};

	const radiuses: Record<string, string> = {
		circle: 'rounded-full',
		square: 'rounded-[8px]'
	};

	let sizeClass = $derived(sizes[size] || sizes.md);
	let radiusClass = $derived(radiuses[shape] || radiuses.circle);

	// Generate initials from alt text
	let initials = $derived(
		fallback || (alt ? alt.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?')
	);
</script>

<Avatar.Root class="{sizeClass} {radiusClass} overflow-hidden bg-[var(--pc-surface-2)] ring-1 ring-[var(--pc-image-ring)] {className}">
	<Avatar.Image {src} {alt} class="w-full h-full object-cover" loading="lazy" decoding="async" />
	<Avatar.Fallback class="w-full h-full grid place-items-center text-[var(--pc-text-muted)] text-xs font-medium select-none">
		{initials}
	</Avatar.Fallback>
</Avatar.Root>
