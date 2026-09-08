<script lang="ts">
	import { Lock, Shield } from 'reicon-svelte';
	import { Button, Card } from '$lib/components/ui';
</script>

<Card padding="lg">
	<div class="flex items-center gap-2"><Shield size={16} weight="Outline" aria-hidden="true" /><h2 class="text-[16px] font-medium">Security</h2></div>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Control access to this workspace.</p>
	<div class="mt-5 grid gap-3">
		<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-4 py-3">
			<div><p class="text-[14px] font-medium">Single sign-on</p><p class="text-[13px] text-[var(--pc-text-muted)]">SAML / OIDC via Okta, Entra. Enforce for all members.</p></div>
			<span title="Enterprise only"><Button size="sm" variant="outline" disabled>Enable</Button></span>
		</div>
		<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-4 py-3">
			<div><p class="text-[14px] font-medium">Require 2FA</p><p class="text-[13px] text-[var(--pc-text-muted)]">Every member must have two-factor auth.</p></div>
			<Button size="sm" variant="outline" disabled>Require</Button>
		</div>
		<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-4 py-3">
			<div><p class="text-[14px] font-medium">Domain verification</p><p class="text-[13px] text-[var(--pc-text-muted)]">Prove you own productclient.com to auto-provision members.</p></div>
			<Button size="sm" variant="outline">Verify</Button>
		</div>
	</div>
</Card>

<Card padding="lg">
	<div class="flex items-center gap-2"><Lock size={14} weight="Outline" aria-hidden="true" /><h3 class="text-[14px] font-medium">Sessions</h3></div>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Revoke all other sessions if you lost a device.</p>
	<Button size="sm" variant="outline" class="mt-3">Sign out other sessions</Button>
</Card>
