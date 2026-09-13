<script lang="ts">
	import { Lock, Shield } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';
</script>

<header class="mb-5">
	<h2 class="text-xl font-semibold tracking-tight">Security</h2>
	<p class="mt-1 text-sm text-[var(--pc-text-muted)]">Control access to this workspace.</p>
</header>

<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Single sign-on</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">SAML / OIDC via Okta, Entra. Enforce for all members.</p>
		</div>
		<span class="shrink-0" use:tooltip={{ text: 'Enterprise only', island: true }}><Button size="sm" variant="outline" disabled>Enable</Button></span>
	</div>
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Require 2FA</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Every member must have two-factor auth.</p>
		</div>
		<span class="shrink-0"><Button size="sm" variant="outline" disabled>Require</Button></span>
	</div>
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Domain verification</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Prove you own productclient.com to auto-provision members.</p>
		</div>
		<span class="shrink-0"><Button size="sm" variant="outline">Verify</Button></span>
	</div>
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2 truncate text-sm font-medium"><Lock size={14} weight="Outline" aria-hidden="true" />Sessions</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Revoke all other sessions if you lost a device.</p>
		</div>
		<span class="shrink-0"><Button size="sm" variant="outline">Sign out other sessions</Button></span>
	</div>
</section>
