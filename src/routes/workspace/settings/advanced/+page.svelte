<script lang="ts">
	import { Warning } from 'reicon-svelte';
	import { Button, Input } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';

	let confirm = $state('');
	let deleting = $state(false);
</script>

<header class="mb-5">
	<h2 class="text-xl font-semibold tracking-tight">Advanced</h2>
	<p class="mt-1 text-sm text-[var(--pc-text-muted)]">Irreversible actions and history. These affect everyone in the workspace.</p>
</header>

<section class="divide-y divide-[rgba(224,122,122,.28)] rounded-[12px] border border-[rgba(224,122,122,.28)]">
	<div class="flex items-center gap-3 p-4">
		<div class="flex min-w-0 flex-1 items-center gap-2 truncate text-sm font-medium text-[#f09b9b]"><Warning size={16} weight="Outline" aria-hidden="true" />Danger zone</div>
	</div>
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Transfer ownership</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Give ownership to another member. You become a member.</p>
		</div>
		<span class="shrink-0"><Button size="sm" variant="outline" disabled>Transfer</Button></span>
	</div>
	<div class="p-4">
		<div class="truncate text-sm font-medium text-[#f09b9b]">Delete workspace</div>
		<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Deletes docs, roadmap and status history. Type the subdomain to confirm.</p>
		<div class="mt-3 flex gap-2">
			<Input bind:value={confirm} placeholder="type subdomain" class="w-64 max-sm:text-base!" />
			<span use:tooltip={{ text: 'This cannot be undone. 30-day grace via support.', island: true }}><Button size="sm" variant="outline" loading={deleting} disabled={confirm.trim().length < 3}>Delete</Button></span>
		</div>
	</div>
</section>

<section class="mt-5 divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Audit log</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Every global change is logged. See who changed what and when.</p>
		</div>
		<span class="shrink-0"><Button size="sm" variant="outline" href="#">View audit log</Button></span>
	</div>
</section>
