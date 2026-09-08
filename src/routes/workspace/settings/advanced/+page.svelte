<script lang="ts">
	import { Warning } from 'reicon-svelte';
	import { Button, Card, Input, Label } from '$lib/components/ui';

	let confirm = $state('');
	let deleting = $state(false);
</script>

<Card padding="lg" class="border-[1px] border-[rgba(224,122,122,.28)]">
	<div class="flex items-center gap-2 text-[#f09b9b]"><Warning size={16} weight="Outline" aria-hidden="true" /><h2 class="text-[16px] font-medium">Danger zone</h2></div>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Irreversible. These affect everyone in the workspace.</p>
	<div class="mt-5 grid gap-4">
		<div class="rounded-[12px] bg-[var(--pc-surface)] p-4">
			<p class="text-[14px] font-medium">Transfer ownership</p>
			<p class="text-[13px] text-[var(--pc-text-muted)]">Give ownership to another member. You become a member.</p>
			<Button size="sm" variant="outline" class="mt-3" disabled>Transfer</Button>
		</div>
		<div class="rounded-[12px] bg-[rgba(224,122,122,.08)] p-4">
			<p class="text-[14px] font-medium text-[#f09b9b]">Delete workspace</p>
			<p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Deletes docs, roadmap and status history. Type the subdomain to confirm.</p>
			<div class="mt-3 flex gap-2">
				<Input bind:value={confirm} placeholder="type subdomain" class="flex-1" />
				<span title="This cannot be undone. 30-day grace via support."><Button size="sm" variant="outline" loading={deleting} disabled={confirm.trim().length < 3}>Delete</Button></span>
			</div>
		</div>
	</div>
</Card>

<Card padding="lg">
	<h3 class="text-[14px] font-medium">Audit log</h3>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Every global change is logged. See who changed what and when.</p>
	<Button size="sm" variant="outline" class="mt-3" href="#">View audit log</Button>
</Card>
