<script lang="ts">
	import { Share } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
</script>

<header class="mb-5">
	<h2 class="text-xl font-semibold tracking-tight">Billing</h2>
	<p class="mt-1 text-sm text-[var(--pc-text-muted)]">Plan, seats and invoices. Managed by Stripe.</p>
</header>

<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
	<div class="flex flex-wrap items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Pro · 5 seats</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Billed monthly. Next invoice in 12 days.</p>
		</div>
		<div class="flex shrink-0 flex-wrap items-center gap-2">
			<Button size="sm" href="/workspace/settings/billing" target="_blank">Open portal <Share size={14} weight="Outline" aria-hidden="true" /></Button>
			<Button size="sm" variant="outline" href="mailto:billing@productclient.com">Contact billing</Button>
		</div>
	</div>
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1"><div class="truncate text-sm font-medium">Invoices</div></div>
		<div class="flex shrink-0 items-center gap-2 text-[13px]">
			<button type="button" class="settings-text-action">View invoices</button>
			<span class="text-[var(--pc-text-faint)]">·</span>
			<button type="button" class="settings-text-action">Change plan</button>
		</div>
	</div>
</section>
