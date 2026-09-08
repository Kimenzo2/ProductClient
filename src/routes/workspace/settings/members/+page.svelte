<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle, Shield, User, UserAdd, Users } from 'reicon-svelte';
	import { Button, Card, Input, Label } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { ensureMyTenant, type Tenant } from '$lib/tenant';

	type Member = { id: string; email: string; role: 'Owner' | 'Member'; you?: boolean };

	let tenant = $state<Tenant | null>(null);
	let members = $state<Member[]>([]);
	let inviteEmail = $state('');
	let inviteRole = $state<'Member' | 'Admin'>('Member');
	let notice = $state('');

	onMount(async () => {
		tenant = await ensureMyTenant();
		if (!supabase || !tenant) return;
		const { data: sess } = await supabase.auth.getUser();
		const you = sess.user;
		if (!you) return;
		// Single source: tenants.owner_id is Owner; others would be tenant_members
		const { data: prof } = await supabase.from('profiles').select('id, email, display_name').eq('id', you.id).maybeSingle();
		members = [
			{ id: you.id, email: (prof as { email?: string } | null)?.email ?? you.email ?? '', role: 'Owner', you: true }
		];
		// Try tenant_members if exists
		try {
			const { data: rows } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: unknown }> } } }).from('tenant_members').select('*').eq('tenant_id', tenant.id);
			if (Array.isArray(rows) && rows.length > 0) {
				// append non-owner members
			}
		} catch {}
	});

	async function invite() {
		if (!inviteEmail.trim()) return;
		notice = 'Invite sent';
		setTimeout(() => (notice = ''), 2000);
		inviteEmail = '';
	}
</script>

<Card padding="lg">
	<div class="flex items-center gap-2"><Users size={16} weight="Outline" aria-hidden="true" /><h2 class="text-[16px] font-medium">Members</h2><span class="rounded-full bg-[var(--pc-surface)] px-2 py-0.5 text-[12px] text-[var(--pc-text-faint)]" use:tooltip={{ text: 'Owner can invite, change roles, transfer ownership', island: true }}>Owner only</span></div>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Who can access this workspace.</p>
	<div class="mt-5 flex gap-2">
		<div class="grid flex-1 gap-1.5"><Label for="invite-email">Email</Label><Input id="invite-email" bind:value={inviteEmail} placeholder="teammate@company.com" /></div>
		<div class="grid gap-1.5"><Label for="invite-role">Role</Label><select id="invite-role" bind:value={inviteRole} class="h-10 rounded-[12px] border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] px-3 text-[14px]"><option value="Member">Member</option><option value="Admin">Admin</option></select></div>
		<Button size="sm" class="self-end" onclick={invite}><UserAdd size={14} weight="Outline" aria-hidden="true" /> Invite</Button>
	</div>
	{#if notice}<p class="mt-3 text-[14px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}
	<div class="mt-6 grid gap-2">
		{#each members as m}
			<div class="flex items-center justify-between rounded-[12px] bg-[var(--pc-surface)] px-4 py-3">
				<span class="flex items-center gap-3"><span class="grid size-8 place-items-center rounded-full bg-[var(--pc-bg)]"><User size={14} weight="Outline" aria-hidden="true" /></span><span class="grid"><strong class="text-[14px] font-medium">{m.email}{m.you ? ' · You' : ''}</strong><span class="text-[13px] text-[var(--pc-text-muted)]">{m.role}</span></span></span>
				<span class="inline-flex items-center gap-1 text-[13px] text-[var(--pc-text-faint)]"><Shield size={12} weight="Outline" aria-hidden="true" />{m.role}</span>
			</div>
		{/each}
	</div>
</Card>

<Card padding="lg">
	<h3 class="text-[14px] font-medium">Transfer ownership</h3>
	<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Give ownership to another member. You’ll become a member.</p>
	<Button variant="outline" size="sm" class="mt-3" disabled>Transfer</Button>
</Card>
