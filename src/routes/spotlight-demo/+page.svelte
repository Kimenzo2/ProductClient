<script lang="ts">
	import ProductFanCarousel from '$lib/components/product/ProductFanCarousel.svelte';
	import { products } from '$lib/data/workspace';
	import { mockStates } from '$lib/data/mockStates';

	// Map workspace products to fan items — use product avatar as cover, fall back to mockState thumbnail/screenshots
	const items = products.slice(0, 6).map((p) => {
		const state = mockStates.find((s) => s.product.slug === p.slug);
		const image =
			state?.screenshots?.[0] ??
			state?.thumbnail ??
			p.avatar ??
			'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop';
		return {
			id: p.slug,
			name: p.name,
			subtitle: p.category ? `${p.category} · ${p.makerName}` : p.makerName,
			category: p.category,
			tagline: p.tagline,
			image,
			href: p.publicPath
		};
	});
</script>

<svelte:head>
	<title>Products — Spotlight Fan Demo</title>
</svelte:head>

<div class="min-h-dvh bg-[#0a0a0a]">
	<div class="mx-auto max-w-[720px]">
		<ProductFanCarousel {items} />
	</div>

	<div class="mx-auto max-w-[720px] px-6 py-8">
		<p class="text-sm text-white/50">
			Fan demo: <code class="rounded bg-white/10 px-1.5 py-0.5 text-white/80">ProductFanCarousel</code> — pacakhe layout adapted for products.
			Props: <code class="text-white/70">items: {'{ id, name, subtitle, image, href }[]'}</code>. Active index cycles with
			prev/next, click-to-focus, and Explore navigates to <code class="text-white/70">href</code>.
		</p>
	</div>
</div>
