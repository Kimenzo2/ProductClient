<script lang="ts">
	import ProductClientLogo from './ProductClientLogo.svelte';

	type Props = {
		src?: string | null;
		alt?: string;
		size?: number;
		shape?: 'circle' | 'square';
		class?: string;
	};

	let {
		src = null,
		alt = '',
		size = 40,
		shape = 'square',
		class: className = ''
	}: Props = $props();

	let imageFailed = $state(false);

	function usableImageSource(value: string | null | undefined): string | null {
		const candidate = value?.trim();
		if (!candidate) return null;
		if (/^(?:https?:\/\/|\/|data:image\/|blob:)/i.test(candidate)) return candidate;
		return null;
	}

	let imageSource = $derived(usableImageSource(src));
	let radiusClass = $derived(shape === 'circle' ? 'rounded-full' : 'rounded-[13px]');

	$effect(() => {
		void src;
		imageFailed = false;
	});

	function handleImageError() {
		imageFailed = true;
	}
</script>

<span
	class="grid shrink-0 place-items-center overflow-hidden bg-[var(--pc-surface-2)] {radiusClass} {className}"
	style:width={`${size}px`}
	style:height={`${size}px`}
	>
	{#if imageSource && !imageFailed}
		<img
			src={imageSource}
			alt={alt}
			width={size}
			height={size}
			class="size-full object-cover"
			loading="lazy"
			decoding="async"
			onerror={handleImageError}
		/>
	{:else}
		<ProductClientLogo size={size} alt={alt} class="size-full" />
	{/if}
</span>
