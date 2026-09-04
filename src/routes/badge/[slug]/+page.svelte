<script lang="ts">
	import { page } from '$app/state';
	import { mockStates } from '$lib/data/mockStates';
	import { Rocket, Copy, Check } from 'reicon-svelte';
	import { Avatar, Button, Card, StatePanel } from '$lib/components/ui';

	let slug = $derived(page.params.slug);
	let states = $derived(mockStates.filter((s) => s.product.slug === slug));
	let product = $derived(states[0]?.product);
	let copied = $state(false);

	let embedCode = $derived(
		`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/badge/${slug}" width="300" height="65" frameborder="0" sandbox="allow-scripts" style="border:none;border-radius:12px;overflow:hidden;"></iframe>`
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
	<div class="max-w-[883px] mx-auto px-6 max-sm:px-4 py-10 pc-enter">
		<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Embeddable Badge</h1>
		<p class="mt-2 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)] text-pretty antialiased">Add this badge to your website to show your Product Client listing.</p>

		<!-- Preview -->
		<div class="mt-8">
			<p class="text-xs font-medium tracking-wide uppercase text-[var(--pc-text-faint)] mb-3">Preview</p>
			<div class="inline-block rounded-[14px] bg-[var(--pc-surface)] p-1">
				<div class="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[var(--pc-surface-2)]">
					<Avatar src={product.avatar} alt={product.name} size="md" shape="square" class="!ring-0 ring-0 border-0" />
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
				<button onclick={copyEmbed} class="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">
																
					{#if copied}
						<Check size={12} weight="Outline" color="var(--color-green-600)" /> Copied
					{:else}
						<Copy size={12} weight="Outline" /> Copy
					{/if}
				</button>
			</div>
			<pre class="rounded-[12px] bg-[var(--pc-surface)] p-4 text-xs leading-5 text-[var(--pc-text-muted)] overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
		</div>

		<!-- Stats -->
		<div class="mt-8 grid grid-cols-3 gap-3">
			<Card padding="md" class="text-center">
				<p class="text-lg font-medium">{states.length}</p>
				<p class="text-xs text-[var(--pc-text-muted)]">Updates</p>
			</Card>
			<Card padding="md" class="text-center">
				<p class="text-lg font-medium">{states.reduce((acc, s) => {
					const r = s.reads;
					if (r.includes('M')) return acc + parseFloat(r) * 1_000_000;
					if (r.includes('K')) return acc + parseFloat(r) * 1_000;
					return acc + (parseInt(r) || 0);
				}, 0).toLocaleString()}</p>
				<p class="text-xs text-[var(--pc-text-muted)]">Total reads</p>
			</Card>
			<Card padding="md" class="text-center">
				<p class="text-lg font-medium">{states[0]?.postedAt ?? '—'}</p>
				<p class="text-xs text-[var(--pc-text-muted)]">Last update</p>
			</Card>
		</div>
	</div>
{:else}
	<StatePanel size="page" icon={Rocket} title="Product not found" description={`There is no product with the name “${slug}”.`} actionLabel="Go home" actionHref="/" class="pc-enter" />
{/if}
