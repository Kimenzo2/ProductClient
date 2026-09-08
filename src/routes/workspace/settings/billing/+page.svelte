<script lang="ts">
	import { CreditCard, Share } from 'reicon-svelte';
	import { Button, Card } from '$lib/components/ui';
</script>

<Card padding="lg">
	<div class="flex items-center gap-2"><CreditCard size={16} weight="Outline" aria-hidden="true" /><h2 class="text-[16px] font-medium">Billing</h2></div>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Plan, seats and invoices. Managed by Stripe.</p>
	<div class="mt-5 rounded-[14px] bg-[var(--pc-surface)] p-4">
		<p class="text-[14px] font-medium">Pro · 5 seats</p>
		<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Billed monthly. Next invoice in 12 days.</p>
		<div class="mt-3 flex gap-2">
			<Button size="sm" href="/workspace/settings/billing" target="_blank">Open portal <Share size={14} weight="Outline" aria-hidden="true" /></Button>
			<Button size="sm" variant="outline" href="mailto:billing@productclient.com">Contact billing</Button>
		</div>
	</div>
	<div class="mt-4 flex gap-2 text-[13px]">
		<button type="button" class="text-[var(--pc-accent-light)] hover:underline">View invoices</button>
		<span class="text-[var(--pc-text-faint)]">·</span>
		<button type="button" class="text-[var(--pc-accent-light)] hover:underline">Change plan</button>
	</div>
</Card>
