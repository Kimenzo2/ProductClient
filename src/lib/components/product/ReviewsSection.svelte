<script lang="ts">
	import type { Review } from '$lib/data/mockStates';
	import { Star, Verified, MessageDots } from 'reicon-svelte';

	let { reviews = [], productSlug = '' }: { reviews: Review[]; productSlug?: string } = $props();

	let productReviews = $derived(reviews.filter((r) => r.productSlug === productSlug));

	let avgStars = $derived(
		productReviews.length > 0
			? productReviews.reduce((sum, r) => sum + r.stars, 0) / productReviews.length
			: 0
	);

	function starsArray(n: number): number[] {
		return Array.from({ length: 5 }, (_, i) => (i < Math.round(n) ? 1 : 0));
	}
</script>

{#if productReviews.length > 0}
	<div class="space-y-4">
		<!-- Summary -->
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-1">
				{#each starsArray(avgStars) as filled}
					<Star size={16} weight={filled ? 'Filled' : 'Outline'} color={filled ? 'var(--yellow-7)' : 'var(--pc-text-faint)'} />
				{/each}
				<span class="ml-1.5 text-sm font-medium">{avgStars.toFixed(1)}</span>
			</div>
			<span class="text-xs text-[var(--pc-text-muted)]">{productReviews.length} review{productReviews.length !== 1 ? 's' : ''}</span>
		</div>

		<!-- Reviews list -->
		<div class="space-y-3">
			{#each productReviews as review (review.id)}
				<div class="p-3 rounded-[10px] bg-[var(--pc-surface-2)]">
					<div class="flex items-start gap-3">
						<img src={review.avatar} alt={review.user} class="size-8 rounded-full object-cover shrink-0" />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium">{review.user}</span>
								{#if review.verified}
									<Verified size={12} weight="Outline" color="var(--blue-6)" />
								{/if}
								<span class="text-xs text-[var(--pc-text-faint)]">• {review.postedAt}</span>
							</div>
							<div class="flex items-center gap-0.5 mt-0.5">
								{#each starsArray(review.stars) as filled}
									<Star size={12} weight={filled ? 'Filled' : 'Outline'} color={filled ? 'var(--yellow-7)' : 'var(--pc-text-faint)'} />
								{/each}
							</div>
							<p class="mt-1.5 text-sm text-[var(--pc-text-muted)] leading-relaxed">{review.text}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="p-6 rounded-[10px] bg-[var(--pc-surface-2)] flex flex-col items-center text-center">
		<MessageDots size={24} weight="Outline" class="mx-auto text-[var(--pc-text-faint)]" />
		<p class="mt-3 text-sm font-600 text-[var(--pc-text-muted)]">No reviews yet</p>
		<p class="mt-1 text-xs text-[var(--pc-text-faint)]">Try this product and share what you think.</p>
	</div>
{/if}
