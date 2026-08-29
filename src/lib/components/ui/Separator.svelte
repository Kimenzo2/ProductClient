<script lang="ts">
	import { Separator } from 'bits-ui';

	let {
		orientation = 'horizontal',
		decorative = true,
		class: className = ''
	}: {
		orientation?: 'horizontal' | 'vertical';
		decorative?: boolean;
		class?: string;
	} = $props();
</script>

<Separator.Root
	{orientation}
	{decorative}
	class={[
		orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
		'bg-[var(--pc-border-strong)] opacity-[0.15]',
		className
	].filter(Boolean).join(' ')}
/>
