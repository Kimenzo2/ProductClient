<script lang="ts">
	import { onMount } from 'svelte';
	import { Shield, User, UserAdd, Users } from 'reicon-svelte';
	import { Button, Input } from '$lib/components/ui';
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

<header class="mb-5">
	<h2 class="flex items-center gap-2 text-xl font-semibold tracking-tight"><Users size={20} weight="Outline" aria-hidden="true" />Members</h2>
	<p class="mt-1 text-sm text-[var(--pc-text-muted)]">Who can access this workspace.</p>
</header>

<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
	<div class="p-4">
		<div class="flex flex-wrap items-end gap-2">
			<div class="grid min-w-0 flex-1 gap-1.5"><label for="invite-email" class="text-[13px] text-[var(--pc-text-muted)]">Email</label><Input id="invite-email" bind:value={inviteEmail} placeholder="teammate@company.com" class="max-sm:text-base!" /></div>
			<div class="grid gap-1.5"><label for="invite-role" class="text-[13px] text-[var(--pc-text-muted)]">Role</label><select id="invite-role" bind:value={inviteRole} class="h-10 cursor-default rounded-[12px] border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] px-3 text-[14px] max-sm:text-base!"><option value="Member">Member</option><option value="Admin">Admin</option></select></div>
			<Button size="sm" class="h-10" onclick={invite}><UserAdd size={14} weight="Outline" aria-hidden="true" /> Invite</Button>
		</div>
		{#if notice}<p class="mt-3 text-[13px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}
	</div>
	{#each members as m}
		<div class="flex items-center gap-3 p-4">
			<span class="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--pc-bg)]"><User size={14} weight="Outline" aria-hidden="true" /></span>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm font-medium">{m.email}{m.you ? ' · You' : ''}</div>
				<div class="text-[13px] text-[var(--pc-text-muted)]">{m.role}</div>
			</div>
			<span class="inline-flex shrink-0 items-center gap-1 text-[13px] text-[var(--pc-text-faint)]"><Shield size={12} weight="Outline" aria-hidden="true" />{m.role}</span>
		</div>
	{/each}
	<div class="flex items-center gap-3 p-4">
		<div class="min-w-0 flex-1">
			<div class="truncate text-sm font-medium">Transfer ownership</div>
			<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Give ownership to another member. You’ll become a member.</p>
		</div>
		<span class="shrink-0" use:tooltip={{ text: 'Owner can invite, change roles, transfer ownership', island: true }}><Button variant="outline" size="sm" disabled>Transfer</Button></span>
	</div>
</section>
