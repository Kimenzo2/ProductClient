<script lang="ts">
	import { Copy, Key, Plug, Share } from 'reicon-svelte';
	import { Button, Card, Input, Label } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let apiKey = 'pk_live_51H...';
	let webhookUrl = '';
</script>

<Card padding="lg">
	<div class="flex items-center gap-2"><Plug size={16} weight="Outline" aria-hidden="true" /><h2 class="text-[16px] font-medium">Integrations</h2></div>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Connect Slack, GitHub, Linear. One place for API and webhooks.</p>
	<div class="mt-5 grid gap-6">
		<div>
			<h3 class="flex items-center gap-2 text-[14px] font-medium"><Key size={14} weight="Outline" aria-hidden="true" /> API keys</h3>
			<div class="mt-3 flex gap-2">
				<Input value={apiKey} disabled class="flex-1 font-mono" />
				<Button size="sm" variant="outline" onclick={() => navigator.clipboard.writeText(apiKey)}><Copy size={14} weight="Outline" aria-hidden="true" /></Button>
			</div>
			<p class="mt-2 text-[13px] text-[var(--pc-text-muted)]">Last used 2 hours ago. <button type="button" class="settings-text-action">Revoke</button></p>
		</div>
		<div class="rounded-[14px] bg-[var(--pc-surface)] p-4">
			<h3 class="flex items-center gap-2 text-[14px] font-medium"><Share size={14} weight="Outline" aria-hidden="true" /> Webhooks</h3>
			<div class="mt-3 flex gap-2">
				<div class="grid flex-1 gap-1.5"><Label for="wh-url">Endpoint URL</Label><Input id="wh-url" bind:value={webhookUrl} placeholder="https://..." /></div>
				<Button size="sm" class="self-end">Add</Button>
			</div>
			<p class="mt-2 text-[13px] text-[var(--pc-text-muted)]">Retries automatically. See audit log for deliveries.</p>
		</div>
		<div class="flex gap-2">
			<Button size="sm" variant="outline" href="/workspace/settings/integrations">Browse integrations</Button>
			<span class="text-[13px] text-[var(--pc-text-faint)]" use:tooltip={{ text: 'Slack, GitHub, Linear, Figma — connect once, use everywhere', island: true }}>Slack · GitHub · Linear</span>
		</div>
	</div>
</Card>