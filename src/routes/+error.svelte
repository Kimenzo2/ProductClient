<script lang="ts">
	import { page } from '$app/state';
	import { TriangleWarning } from 'reicon-svelte';
</script>

<svelte:head>
	<title>{page.status} — Product Client</title>
</svelte:head>

<div class="mx-auto max-w-[640px] px-6 py-24 text-center pc-enter">
	<div class="mx-auto size-16 rounded-full bg-[var(--pc-surface-2)] border border-[var(--pc-border)] grid place-items-center text-[var(--pc-text-faint)]">
		<TriangleWarning size={28} weight="Outline" />
	</div>
	<h1 class="mt-6 text-3xl font-700 tracking-tighter">{page.status} — {page.error?.message ?? 'Something went wrong'}</h1>
	<p class="mt-3 text-sm leading-relaxed text-[var(--pc-text-muted)] max-w-[48ch] mx-auto text-pretty">
		This page didn’t ship. The builder may have moved it, or it’s still in draft. Head back to Discover — the feed is where launches live.
	</p>
	<div class="mt-8 flex justify-center gap-3">
		<a href="/" class="pc-btn-primary">Back to Discover <span class="pc-btn-icon">→</span></a>
		<a href="/following" class="pc-btn-ghost">Go to Following</a>
	</div>
	<p class="mt-10 text-xs text-[var(--pc-text-faint)]">Error code {page.status} • If this persists, report via Feedback inbox.</p>
</div>
