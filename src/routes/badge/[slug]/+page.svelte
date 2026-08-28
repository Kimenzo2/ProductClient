<script lang="ts">
	import { page } from '$app/state';
	import { mockStates } from '$lib/data/mockStates';
	import { Rocket, Copy, Check } from 'reicon-svelte';

	let slug = $derived(page.params.slug);
	let states = $derived(mockStates.filter((s) => s.product.slug === slug));
	let product = $derived(states[0]?.product);
	let copied = $state(false);

	let embedCode = $derived(
		`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/badge/${slug}" width="300" height="65" frameborder="0" style="border:none;border-radius:12px;overflow:hidden;"></iframe>`
	);

	function copyEmbed() {
		if (typeof navigator !== 'undefined') {
			navigator.clipboard.writeText(embedCode);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<svelte:head>
	<title>Badge — {product?.name ?? slug}</title>
</svelte:head>

{#if product}
	<div class="max-w-[800px] mx-auto px-4 py-10 pc-enter">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Embeddable Badge</h1>
		<p class="mt-1 text-sm text-[var(--pc-text-muted)]">Add this badge to your website to show your Product Client listing.</p>

		<!-- Preview -->
		<div class="mt-8">
			<p class="text-xs font-medium tracking-wide uppercase text-[var(--pc-text-faint)] mb-3">Preview</p>
			<div class="inline-block rounded-[14px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-1">
				<div class="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[var(--pc-surface-2)]">
					<div class="size-9 rounded-[10px] overflow-hidden bg-[var(--pc-border)]">
						<img src={product.avatar} alt={product.name} class="size-full object-cover" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-[13px] font-medium leading-tight truncate">{product.name}</p>
						<p class="text-xs text-[var(--pc-text-muted)]">Listed on Product Client</p>
					</div>
					<div class="grid size-8 place-items-center rounded-full bg-[var(--pc-accent)] text-white shrink-0">
						<Rocket size={14} weight="Outline" color="white" />
					</div>
				</div>
			</div>
		</div>

		<!-- Embed code -->
		<div class="mt-8">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs font-medium tracking-wide uppercase text-[var(--pc-text-faint)]">Embed code</p>
				<button onclick={copyEmbed} class="inline-flex items-center gap-1.5 text-xs font-600 text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">
					{#if copied}
						<Check size={12} weight="Outline" color="var(--green-6)" /> Copied
					{:else}
						<Copy size={12} weight="Outline" /> Copy
					{/if}
				</button>
			</div>
			<pre class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 text-xs leading-5 text-[var(--pc-text-muted)] overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
		</div>

		<!-- Stats -->
		<div class="mt-8 grid grid-cols-3 gap-3">
			<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 text-center">
				<p class="text-lg font-800">{states.length}</p>
				<p class="text-xs text-[var(--pc-text-muted)]">Updates</p>
			</div>
			<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 text-center">
				<p class="text-lg font-800">{states.reduce((acc, s) => {
					const r = s.reads;
					if (r.includes('M')) return acc + parseFloat(r) * 1_000_000;
					if (r.includes('K')) return acc + parseFloat(r) * 1_000;
					return acc + (parseInt(r) || 0);
				}, 0).toLocaleString()}</p>
				<p class="text-xs text-[var(--pc-text-muted)]">Total reads</p>
			</div>
			<div class="rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4 text-center">
				<p class="text-lg font-800">{states[0]?.postedAt ?? '—'}</p>
				<p class="text-xs text-[var(--pc-text-muted)]">Last update</p>
			</div>
		</div>
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-20 pc-enter">
		<p class="text-lg font-700">Product not found</p>
		<p class="text-sm text-[var(--pc-text-muted)] mt-1">No product with slug "{slug}".</p>
		<a href="/" class="mt-4 rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] px-5 py-2 text-sm font-700">Go home</a>
	</div>
{/if}
