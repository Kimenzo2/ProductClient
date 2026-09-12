<script lang="ts">
	import { onMount } from 'svelte';
	import { Globe } from 'reicon-svelte';
	import { Button, Card, Input, Label } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';
	import { ensureMyTenant, renameMyTenant, slugValidationMessage, tenantUrl, type Tenant } from '$lib/tenant';
	import { supabase } from '$lib/supabaseClient';

	let tenant = $state<Tenant | null>(null);
	let loading = $state(true);
	let nameDraft = $state('');
	let slugDraft = $state('');
	let slugError = $state('');
	let saving = $state(false);
	let notice = $state('');

	onMount(async () => {
		try {
			tenant = await ensureMyTenant();
			if (tenant) {
				slugDraft = tenant.slug;
				if (supabase) {
					const { data: userData } = await supabase.auth.getUser();
					const uid = userData.user?.id;
					if (uid) {
						const { data: profile } = await supabase.from('profiles').select('gamification_data').eq('id', uid).maybeSingle();
						const ws = (profile as { gamification_data?: Record<string, unknown> } | null)?.gamification_data?.['workspace_name'];
						if (typeof ws === 'string' && ws.trim()) nameDraft = ws;
						else nameDraft = tenant.name;
					} else {
						nameDraft = tenant.name;
					}
				} else {
					nameDraft = tenant.name;
				}
			}
		} finally {
			loading = false;
		}
	});

	async function save() {
		if (!tenant) return;
		slugError = '';
		const v = slugValidationMessage(slugDraft);
		if (v) {
			slugError = v;
			return;
		}
		if (!supabase) return;
		saving = true;
		try {
			const trimmedName = nameDraft.trim();
			const trimmedSlug = slugDraft.trim().toLowerCase();
			if (trimmedName) {
				const { data: userData } = await supabase.auth.getUser();
				const uid = userData.user?.id;
				if (uid) {
					const { data: existing } = await supabase.from('profiles').select('gamification_data').eq('id', uid).maybeSingle();
					const currentData = (existing as { gamification_data?: Record<string, unknown> } | null)?.gamification_data ?? {};
					await supabase.from('profiles').update({ gamification_data: { ...currentData, workspace_name: trimmedName } }).eq('id', uid);
				}
			}
			if (trimmedSlug !== tenant.slug) {
				const { tenant: updated, error } = await renameMyTenant(trimmedSlug);
				if (error) {
					slugError = error;
					return;
				}
				if (updated) {
					tenant = updated;
					slugDraft = updated.slug;
				}
			}
			notice = 'Saved';
			setTimeout(() => (notice = ''), 2000);
		} finally {
			saving = false;
		}
	}
</script>

{#if loading}
	<div class="h-40 animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
{:else if !tenant}
	<Card padding="lg"><p class="text-[14px] text-[var(--pc-text-muted)]">No workspace yet.</p></Card>
{:else}
	{#if notice}<p class="mb-4 rounded-[12px] bg-[rgba(119,152,18,.12)] px-3 py-2 text-[14px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}
	<Card padding="lg">
		<h2 class="text-[16px] font-medium">General</h2>
		<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Workspace identity. This defines every new page you create.</p>
		<div class="mt-6 grid gap-5">
			<div class="grid gap-2">
				<Label for="ws-name">Workspace name</Label>
				<Input id="ws-name" bind:value={nameDraft} placeholder="ProductClient" />
			</div>
			<div class="grid gap-2">
				<div class="flex items-center gap-2">
					<Label for="ws-slug">Subdomain</Label>
					<span use:tooltip={{ text: 'This is your URL. Used for docs, roadmap and status.', island: true }} class="text-[var(--pc-text-faint)]"><Globe size={12} weight="Outline" aria-hidden="true" /></span>
				</div>
				<div class="flex gap-2">
					<Input id="ws-slug" bind:value={slugDraft} placeholder="acme" class="flex-1 font-mono" error={slugError} />
					<Button size="sm" loading={saving} onclick={save}>Save</Button>
				</div>
				{#if slugError}<p class="text-[13px] text-[#f09b9b]">{slugError}</p>{/if}
			</div>
		</div>
		<a href={tenantUrl(tenant.slug, '/')} target="_blank" rel="noopener" class="mt-6 inline-flex items-center gap-2 text-[14px] text-[var(--pc-accent-light)] hover:underline" use:tooltip={{ text: tenantUrl(tenant.slug, '/'), island: true }}><Globe size={14} weight="Outline" aria-hidden="true" /> Live site</a>
	</Card>
{/if}