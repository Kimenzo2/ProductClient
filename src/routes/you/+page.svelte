<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle, Compass, Copy, Globe, Link, Shield, User } from 'reicon-svelte';
	import { Button, Card, Input, Label, Textarea } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { requireSession } from '$lib/auth/guard';
	import { displaySubdomain, ensureMyTenant, renameMyTenant, slugValidationMessage, tenantRoadmapUrl, tenantStatusUrl, tenantUrl, type Tenant } from '$lib/tenant';

	type Profile = {
		id: string;
		email: string | null;
		full_name: string | null;
		display_name: string | null;
		avatar_url: string | null;
		created_at: string | null;
		updated_at: string | null;
	};

	let profile = $state<Profile | null>(null);
	let tenant = $state<Tenant | null>(null);
	let loading = $state(true);
	let savingProfile = $state(false);
	let savingSlug = $state(false);
	let notice = $state('');
	let error = $state('');

	let displayName = $state('');
	let fullName = $state('');
	let avatarUrl = $state('');
	let bio = $state('');
	let slugDraft = $state('');
	let slugError = $state('');

	onMount(async () => {
		const ok = await requireSession('/you');
		if (!ok) return;
		if (!supabase) {
			error = 'Not configured';
			loading = false;
			return;
		}
		try {
			const { data: sess } = await supabase.auth.getUser();
			const user = sess.user;
			if (!user) {
				loading = false;
				return;
			}
			const [{ data: prof }, t] = await Promise.all([
				supabase.from('profiles').select('id, email, full_name, display_name, avatar_url, created_at, updated_at').eq('id', user.id).maybeSingle(),
				ensureMyTenant()
			]);
			if (prof) {
				profile = prof as Profile;
				displayName = (prof as Profile).display_name ?? '';
				fullName = (prof as Profile).full_name ?? '';
				avatarUrl = (prof as Profile).avatar_url ?? '';
				const { data: full } = await supabase.from('profiles').select('gamification_data').eq('id', user.id).maybeSingle();
				const gd = (full as { gamification_data?: { bio?: string } } | null)?.gamification_data;
				bio = gd?.bio ?? '';
			}
			tenant = t;
			if (t) slugDraft = t.slug;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not load profile';
		} finally {
			loading = false;
		}
	});

	async function saveProfile() {
		if (!supabase || !profile) return;
		savingProfile = true;
		notice = '';
		error = '';
		try {
			const { data: sess } = await supabase.auth.getSession();
			const userId = sess.session?.user?.id ?? (await supabase.auth.getUser()).data.user?.id;
			if (!userId) throw new Error('Not signed in');
			const token = sess.session?.access_token ?? '';
			const { error: pErr } = await supabase
				.from('profiles')
				.update({
					display_name: displayName.trim(),
					full_name: fullName.trim(),
					avatar_url: avatarUrl.trim() || null,
					gamification_data: { bio: bio.trim() },
					updated_at: new Date().toISOString()
				})
				.eq('id', userId);
			if (pErr) throw pErr;
			await supabase.auth.updateUser({ data: { full_name: fullName.trim(), display_name: displayName.trim(), avatar_url: avatarUrl.trim() } });
			if (tenant && displayName.trim() && displayName.trim() !== tenant.name) {
				await supabase.from('tenants').update({ name: displayName.trim() }).eq('id', tenant.id);
				tenant = { ...tenant, name: displayName.trim() };
				await fetch('/api/tenants/sync', {
					method: 'POST',
					headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
					body: JSON.stringify({ id: tenant.id, slug: tenant.slug, displayName: displayName.trim() })
				}).catch(() => {});
			}
			notice = 'Saved';
			setTimeout(() => (notice = ''), 2500);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Save failed';
		} finally {
			savingProfile = false;
		}
	}

	async function saveSlug() {
		if (!tenant) return;
		slugError = '';
		const msg = slugValidationMessage(slugDraft);
		if (msg) {
			slugError = msg;
			return;
		}
		savingSlug = true;
		const { tenant: updated, error: err } = await renameMyTenant(slugDraft.trim().toLowerCase());
		savingSlug = false;
		if (err) {
			slugError = err;
			return;
		}
		if (updated) {
			tenant = updated;
			slugDraft = updated.slug;
			notice = `Updated to ${displaySubdomain(updated.slug)}`;
			try {
				const { data: sess } = await supabase!.auth.getSession();
				await fetch('/api/tenants/sync', {
					method: 'POST',
					headers: { 'content-type': 'application/json', authorization: `Bearer ${sess.session?.access_token ?? ''}` },
					body: JSON.stringify({ id: updated.id, slug: updated.slug, displayName: updated.name })
				});
			} catch {}
			setTimeout(() => (notice = ''), 2500);
		}
	}

	function copy(text: string) {
		navigator.clipboard.writeText(text).catch(() => {});
		notice = 'Copied';
		setTimeout(() => (notice = ''), 1500);
	}
</script>

<svelte:head><title>You · Product Client</title></svelte:head>

<div class="w-full max-w-[880px] mx-auto px-6 max-sm:px-4">
	<header class="pt-10 pb-6 max-sm:pt-8">
		<div class="flex items-start gap-5">
			<div class="relative shrink-0">
				{#if profile?.avatar_url}
					<img src={profile.avatar_url} alt="" width="72" height="72" class="size-[72px] rounded-full object-cover bg-[var(--pc-surface)]" />
				{:else}
					<div class="grid size-[72px] place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><User size={32} weight="Outline" aria-hidden="true" /></div>
				{/if}
				<span class="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-[var(--pc-accent)] text-white"><CheckCircle size={12} weight="Outline" aria-hidden="true" /></span>
			</div>
			<div class="min-w-0 pt-1">
				<h1 class="text-[26px] font-semibold leading-none tracking-[-0.02em]">{displayName || fullName || 'Your profile'}</h1>
				<p class="mt-2 text-[14px] leading-[1.5] text-[var(--pc-text-muted)]">{profile?.email ?? ''}</p>
				{#if tenant}
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<span class="inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface)] px-3 py-1 text-[13px]"><span class="size-2 rounded-full bg-[var(--pc-accent-light)]" aria-hidden="true"></span>{displaySubdomain(tenant.slug)}</span>
						<span class="text-[13px] text-[var(--pc-text-faint)]">·</span>
						<a href={tenantUrl(tenant.slug, '/')} target="_blank" rel="noopener" class="text-[13px] text-[var(--pc-accent-light)] hover:underline" use:tooltip={{ text: 'Open docs', island: true }}>Docs</a>
						<a href={tenantRoadmapUrl(tenant.slug)} target="_blank" rel="noopener" class="text-[13px] text-[var(--pc-accent-light)] hover:underline" use:tooltip={{ text: 'Open roadmap', island: true }}>Roadmap</a>
						<a href={tenantStatusUrl(tenant.slug)} target="_blank" rel="noopener" class="text-[13px] text-[var(--pc-accent-light)] hover:underline" use:tooltip={{ text: 'Open status', island: true }}>Status</a>
					</div>
				{/if}
			</div>
		</div>
	</header>

	{#if loading}
		<div class="grid gap-4 py-6">
			<div class="h-44 animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
			<div class="h-64 animate-pulse rounded-[20px] bg-[var(--pc-surface-2)]"></div>
		</div>
	{:else if error && !profile}
		<Card padding="lg"><p class="text-[14px] text-[var(--pc-text-muted)]">{error}</p><Button href="/auth" size="sm" class="mt-3">Sign in</Button></Card>
	{:else}
		{#if notice}<p class="mb-4 rounded-[12px] bg-[rgba(119,152,18,.12)] px-3 py-2 text-[13px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}
		{#if error}<p class="mb-4 rounded-[12px] bg-[rgba(224,122,122,.12)] px-3 py-2 text-[13px] text-[#f09b9b]" role="alert">{error}</p>{/if}

		<div class="grid gap-6 pb-12">
			<Card padding="lg">
				<h2 class="text-[15px] font-medium">Profile</h2>
				<div class="mt-5 grid gap-5 sm:grid-cols-2">
					<div class="grid gap-2"><Label for="you-display">Display name</Label><Input id="you-display" bind:value={displayName} placeholder="Amina Yusuf" /></div>
					<div class="grid gap-2"><Label for="you-full">Full name</Label><Input id="you-full" bind:value={fullName} placeholder="Amina Yusuf" /></div>
					<div class="grid gap-2"><Label for="you-avatar">Avatar URL</Label><Input id="you-avatar" bind:value={avatarUrl} placeholder="https://..." /></div>
					<div class="grid gap-2"><Label for="you-email">Email</Label><Input id="you-email" value={profile?.email ?? ''} disabled /></div>
					<div class="grid gap-2 sm:col-span-2"><Label for="you-bio">Bio</Label><Textarea id="you-bio" rows={3} bind:value={bio} placeholder="What you build — one line is enough." /></div>
				</div>
				<div class="mt-5">
					<Button size="sm" loading={savingProfile} onclick={saveProfile}><CheckCircle size={14} weight="Outline" aria-hidden="true" /> Save</Button>
				</div>
			</Card>

			<Card padding="lg">
				<h2 class="text-[15px] font-medium">Your site</h2>
				<p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Your address and hosted pages.</p>
				{#if tenant}
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<div class="flex min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2">
							<Link size={14} weight="Outline" class="opacity-60" aria-hidden="true" />
							<Input id="you-slug" bind:value={slugDraft} placeholder="gemma" class="min-w-0 flex-1 font-mono !border-0 !bg-transparent p-0 text-[14px] focus:ring-0" error={slugError} />
							<Button size="sm" loading={savingSlug} onclick={saveSlug}>Save</Button>
						</div>
					</div>
					{#if slugError}<p class="mt-2 text-[13px] text-[#f09b9b]">{slugError}</p>{/if}
					<div class="mt-4 grid gap-2">
						{#each [{label: 'Docs', href: tenantUrl(tenant.slug, '/'), icon: Globe}, {label: 'Roadmap', href: tenantRoadmapUrl(tenant.slug), icon: Compass}, {label: 'Status', href: tenantStatusUrl(tenant.slug), icon: Shield}] as row}
							{@const Icon = row.icon}
							<div class="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--pc-surface)] px-4 py-3">
								<span class="flex items-center gap-2 text-[14px] font-medium"><Icon size={16} weight="Outline" aria-hidden="true" />{row.label}</span>
								<div class="flex items-center gap-2">
									<a href={row.href} target="_blank" rel="noopener" class="max-w-[28ch] truncate font-mono text-[13px] text-[var(--pc-accent-light)] hover:underline" use:tooltip={{ text: row.href, island: true }}>{row.href}</a>
									<button type="button" class="grid size-8 place-items-center rounded-full bg-[var(--pc-bg)] text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]" onclick={() => copy(row.href)} aria-label="Copy link" use:tooltip={{ text: 'Copy', island: true }}><Copy size={14} weight="Outline" aria-hidden="true" /></button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-3 text-[14px] text-[var(--pc-text-muted)]">Your workspace will appear after you sign in.</p>
				{/if}
			</Card>
		</div>
	{/if}
</div>
