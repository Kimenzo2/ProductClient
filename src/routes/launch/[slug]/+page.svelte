<script lang="ts">
	import { page } from '$app/state';
	import { preLaunchProducts } from '$lib/data/mockStates';
	import { Rocket, Clock, Users, CheckCircle, Envelope } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';

	let slug = $derived(page.params.slug);
	let product = $derived(preLaunchProducts.find((p) => p.slug === slug));

	let email = $state('');
	let joined = $state(false);

	function joinWaitlist() {
		if (email && email.includes('@')) {
			joined = true;
		}
	}

	// Countdown
	let now = $state(Date.now());
	let launchMs = $derived(product ? new Date(product.launchDate).getTime() : 0);
	let diff = $derived(Math.max(0, launchMs - now));
	let days = $derived(Math.floor(diff / (1000 * 60 * 60 * 24)));
	let hours = $derived(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
	let mins = $derived(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
	let secs = $derived(Math.floor((diff % (1000 * 60)) / 1000));

	import { onMount } from 'svelte';
	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		interval = setInterval(() => { now = Date.now(); }, 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>{product?.name ?? slug} — Launching Soon on Product Client</title>
</svelte:head>

{#if product}
	<div class="w-full">
		<!-- Banner -->
		<div class="relative h-[200px] md:h-[280px] w-full overflow-hidden bg-[var(--pc-surface-2)]">
			<div class="absolute inset-0 bg-gradient-to-b from-[var(--pc-bg)]/0 to-[var(--pc-bg)]/80 z-10"></div>
			<div class="absolute inset-0 flex items-center justify-center opacity-20">
				<Rocket size={120} weight="Outline" color="var(--pc-accent)" />
			</div>
		</div>

		<div class="max-w-[640px] mx-auto px-4 -mt-16 relative z-20 pb-12">
			<!-- Product card -->
			<div class="rounded-[20px] bg-[var(--pc-surface-2)] p-6 text-center">
				<img src={product.avatar} alt={product.name} class="size-20 rounded-[18px] object-cover mx-auto ring-4 ring-[var(--pc-surface)]" />
				<h1 class="mt-4 text-[22px] md:text-[26px] font-medium leading-none tracking-tight">{product.name}</h1>
				<p class="mt-2 text-sm text-[var(--pc-text-muted)]">{product.tagline}</p>

				<!-- Countdown -->
				<div class="mt-6 grid grid-cols-4 gap-2">
					<div class="rounded-[10px] bg-[var(--pc-surface)] p-3 text-center">
						<p class="text-[22px] font-medium tabular-nums">{String(days).padStart(2, '0')}</p>
						<p class="text-[10px] font-medium uppercase tracking-wide text-[var(--pc-text-faint)]">Days</p>
					</div>
					<div class="rounded-[10px] bg-[var(--pc-surface)] p-3 text-center">
						<p class="text-[22px] font-medium tabular-nums">{String(hours).padStart(2, '0')}</p>
						<p class="text-[10px] font-medium uppercase tracking-wide text-[var(--pc-text-faint)]">Hours</p>
					</div>
					<div class="rounded-[10px] bg-[var(--pc-surface)] p-3 text-center">
						<p class="text-[22px] font-medium tabular-nums">{String(mins).padStart(2, '0')}</p>
						<p class="text-[10px] font-medium uppercase tracking-wide text-[var(--pc-text-faint)]">Mins</p>
					</div>
					<div class="rounded-[10px] bg-[var(--pc-surface)] p-3 text-center">
						<p class="text-[22px] font-medium tabular-nums">{String(secs).padStart(2, '0')}</p>
						<p class="text-[10px] font-medium uppercase tracking-wide text-[var(--pc-text-faint)]">Secs</p>
					</div>
				</div>

				<!-- Waitlist form -->
				{#if !joined}
					<div class="mt-6">
						<div class="flex gap-2">
					<input
						type="email"
						placeholder="you@email.com"
						bind:value={email}
						class="flex-1 rounded-full bg-[var(--pc-surface)] px-4 py-2.5 text-sm outline-none placeholder:text-[var(--pc-text-faint)]"
					/>
					<Button variant="primary" onclick={joinWaitlist} class="shrink-0">
						<Envelope size={14} weight="Outline" /> Join waitlist
					</Button>
						</div>
						<p class="mt-2 text-xs text-[var(--pc-text-faint)] opacity-55">
							<Users size={10} weight="Outline" class="inline" /> {product.waitlistCount.toLocaleString()} people waiting
						</p>
					</div>
				{:else}
					<div class="mt-6 p-4 rounded-[12px]" style:background="rgba(119, 152, 18, 0.1)">
						<p class="text-sm font-medium flex items-center justify-center gap-2" style:color="rgb(119, 152, 18)">
							<CheckCircle size={16} weight="Outline" /> You're on the list!
						</p>
						<p class="mt-1 text-xs text-[var(--pc-text-muted)]">We'll notify you when {product.name} launches.</p>
					</div>
				{/if}

				<!-- Meta -->
				<div class="mt-6 pt-4 flex items-center justify-center gap-4 text-xs text-[var(--pc-text-faint)]">
					<span>{product.category}</span>
					<span class="opacity-30">·</span>
					<a href="/m/{product.makerHandle}" class="hover:text-[var(--pc-text-muted)]">by {product.makerName}</a>
					<span class="opacity-30">·</span>
					<span>Launches {new Date(product.launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
				</div>
			</div>
		</div>
	</div>
{:else}
	<StatePanel size="page" icon={Rocket} title="Pre-launch product not found" description={`There is no pre-launch product with the name “${slug}”.`} actionLabel="Go home" actionHref="/" class="pc-enter" />
{/if}
