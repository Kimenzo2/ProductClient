<script lang="ts">
	import { Copy, Key, Plug, Share } from 'reicon-svelte';
	import { Button, Input } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let apiKey = 'pk_live_51H...';
	let webhookUrl = '';
</script>

<header class="mb-5">
	<h2 class="text-xl font-semibold tracking-tight">Integrations</h2>
	<p class="mt-1 text-sm text-[var(--pc-text-muted)]">Connect Slack, GitHub, Linear. One place for API and webhooks.</p>
</header>

<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
	<div class="p-4">
		<div class="flex items-center gap-2 text-sm font-medium"><Key size={14} weight="Outline" aria-hidden="true" />API key</div>
		<div class="mt-3 flex gap-2">
			<Input value={apiKey} disabled class="flex-1 font-mono" />
			<Button size="sm" variant="outline" onclick={() => navigator.clipboard.writeText(apiKey)} aria-label="Copy API key"><Copy size={14} weight="Outline" aria-hidden="true" /></Button>
		</div>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)]">Last used 2 hours ago. <button type="button" class="settings-text-action">Revoke</button></p>
	</div>
	<div class="p-4">
		<div class="flex items-center gap-2 text-sm font-medium"><Share size={14} weight="Outline" aria-hidden="true" />Webhooks</div>
		<div class="mt-3 flex flex-wrap gap-2">
			<div class="grid min-w-0 flex-1 gap-1.5"><label for="wh-url" class="text-[13px] text-[var(--pc-text-muted)]">Endpoint URL</label><Input id="wh-url" bind:value={webhookUrl} placeholder="https://..." class="max-sm:text-base!" /></div>
			<Button size="sm" class="self-end">Add</Button>
		</div>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)]">Retries automatically. See audit log for deliveries.</p>
	</div>
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1"><div class="truncate text-sm font-medium">Connected apps</div></div>
		<div class="flex shrink-0 items-center gap-2">
			<Button size="sm" variant="outline" href="/workspace/settings/integrations">Browse integrations</Button>
			<span class="text-[13px] text-[var(--pc-text-faint)]" use:tooltip={{ text: 'Slack, GitHub, Linear, Figma — connect once, use everywhere', island: true }}>Slack · GitHub · Linear</span>
		</div>
	</div>
</section>
