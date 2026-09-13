<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, Calendar, CheckCircle, Compass, Copy, Globe, Link, Shield, Upload, User } from 'reicon-svelte';
	import { Button, Input, Textarea } from '$lib/components/ui';
	import { tooltip } from '$lib/components/Tooltip.svelte';
	import { fetchMakerAnalytics, type MakerAnalytics } from '$lib/data/maker-analytics';
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
	let website = $state('');
	let twitter = $state('');
	let github = $state('');
	let slugDraft = $state('');
	let slugError = $state('');
	let avatarUploading = $state(false);
	let makerAnalytics = $state<MakerAnalytics | null>(null);
	let analyticsLoading = $state(true);
	let analyticsError = $state('');
	// DB-tracked (read-only) — mirrors P-Landing /m/[handle] MakerProfile, not editable
	let stats = $state({ followers: 0, following: 0, products: 0, totalViews: '—', joinedAt: '' });

	function formatCount(value: number) {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
		return String(value);
	}

	function formatDate(value: string | null) {
		return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not recorded';
	}

	function formatRemaining(value: string) {
		const minutes = Math.max(0, Math.floor((Date.parse(value) - Date.now()) / 60_000));
		if (minutes < 60) return `${minutes}m remaining`;
		const hours = Math.floor(minutes / 60);
		if (hours < 48) return `${hours}h remaining`;
		return `${Math.floor(hours / 24)}d remaining`;
	}

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
			const [{ data: prof, error: profileError }, t] = await Promise.all([
				supabase.from('profiles').select('id, email, full_name, display_name, avatar_url, created_at, updated_at, gamification_data').eq('id', user.id).maybeSingle(),
				ensureMyTenant()
			]);
			if (profileError) throw profileError;
			if (prof) {
				profile = prof as Profile;
				displayName = (prof as Profile).display_name ?? '';
				fullName = (prof as Profile).full_name ?? '';
				avatarUrl = (prof as Profile).avatar_url ?? '';
				const gd = (prof as { gamification_data?: { bio?: string; website?: string; twitter?: string; github?: string } }).gamification_data;
				bio = gd?.bio ?? '';
				website = gd?.website ?? '';
				twitter = gd?.twitter ?? '';
				github = gd?.github ?? '';
			}
			tenant = t;
			if (t) slugDraft = t.slug;

			try {
				makerAnalytics = await fetchMakerAnalytics(user.id);
				stats = {
					followers: makerAnalytics.metrics.followers,
					following: makerAnalytics.metrics.following,
					products: makerAnalytics.products.length,
					totalViews: formatCount(makerAnalytics.metrics.views),
					joinedAt: prof?.created_at ? new Date(prof.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''
				};
			} catch (analyticsLoadError) {
				analyticsError = analyticsLoadError instanceof Error ? analyticsLoadError.message : 'Could not load product signals';
			} finally {
				analyticsLoading = false;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not load profile';
			analyticsLoading = false;
		} finally {
			loading = false;
		}
	});

	async function handleAvatarUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file || !supabase) return;
		avatarUploading = true;
		try {
			const ext = file.name.split('.').pop() ?? 'jpg';
			const uid = profile?.id ?? (await supabase.auth.getUser()).data.user?.id ?? 'anon';
			const path = `${uid}/avatar-${Date.now()}.${ext}`;
			const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
			if (upErr) throw upErr;
			const { data } = supabase.storage.from('avatars').getPublicUrl(path);
			avatarUrl = data.publicUrl;
			notice = 'Avatar uploaded — save to persist';
			setTimeout(() => (notice = ''), 2000);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Avatar upload failed';
			error = msg.includes('Bucket not found') ? 'Unable to upload image. Please try again.' : msg;
		} finally { avatarUploading = false; }
	}

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
					gamification_data: {
						bio: bio.trim(),
						website: website.trim(),
						twitter: twitter.trim().replace(/^@/, ''),
						github: github.trim()
					},
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

<div class="mx-auto w-full max-w-[880px] px-6 max-sm:px-4 pt-10 pb-16">
	<header class="mb-6">
		<div class="flex items-end justify-between gap-3">
			<div class="min-w-0">
				<h1 class="text-xl font-semibold tracking-tight">{displayName || fullName || 'Your profile'}</h1>
				<p class="mt-1 truncate text-sm text-[var(--pc-text-muted)]">@{tenant?.slug ?? 'handle'} · {profile?.email ?? ''}</p>
			</div>
			<div class="hidden shrink-0 items-center gap-2 sm:flex">
				<a href="/workspace/analytics" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-1.5 text-[13px] hover:bg-[var(--pc-surface-2)] transition-colors">Analytics <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>
				<a href={tenant ? `/m/${tenant.slug}` : '#'} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-1.5 text-[13px] hover:bg-[var(--pc-surface-2)] transition-colors" use:tooltip={{ text: 'Preview public /m/ page', island: true }}>Preview</a>
			</div>
		</div>

		<!-- DB-tracked, read-only — mirrors /m/ stats row, not editable -->
		<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tabular-nums text-[var(--pc-text-muted)]" use:tooltip={{ text: 'Followers, following, products, and views are tracked by DB — not editable', island: true }}>
			<span class="opacity-60">{analyticsLoading || analyticsError ? '—' : stats.followers} followers</span>
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="opacity-60">{analyticsLoading || analyticsError ? '—' : stats.following} following</span>
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="opacity-60">{analyticsLoading || analyticsError ? '—' : stats.products} products</span>
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="inline-flex items-center gap-1 opacity-60"><Calendar size={11} weight="Outline" /> {stats.joinedAt || '—'}</span>
			<span class="text-[var(--pc-text-faint)] opacity-20">·</span>
			<span class="opacity-60">{analyticsLoading || analyticsError ? '—' : stats.totalViews} views</span>
		</div>

		{#if website || twitter || github || true}
			<div class="mt-2.5 flex flex-wrap gap-1.5">
				{#if tenant}<span class="inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface)] px-3 py-1 text-[13px]"><span class="size-2 rounded-full bg-[var(--pc-accent-light)]" aria-hidden="true"></span>{displaySubdomain(tenant.slug)}</span>{/if}
				{#if website}<a href={website} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-[12px] hover:bg-[var(--pc-surface)] transition-colors"><Globe size={11} weight="Outline" class="opacity-50" /> {website.replace('https://','')}</a>{/if}
				{#if twitter}<a href={`https://x.com/${twitter.replace('@','')}`} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-[12px] hover:bg-[var(--pc-surface)] transition-colors">@{twitter.replace('@','')}</a>{/if}
				{#if github}<a href={`https://github.com/${github}`} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 py-1 text-[12px] hover:bg-[var(--pc-surface)] transition-colors">GitHub</a>{/if}
			</div>
		{/if}
	</header>

	{#if loading}
		<div class="grid gap-4">
			<div class="h-56 animate-pulse rounded-[12px] bg-[var(--pc-surface-2)]"></div>
			<div class="h-40 animate-pulse rounded-[12px] bg-[var(--pc-surface-2)]"></div>
		</div>
	{:else if error && !profile}
		<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
			<div class="p-4"><p class="text-sm text-[var(--pc-text-muted)]">{error}</p></div>
			<div class="flex justify-end p-4"><Button href="/auth" size="sm">Sign in</Button></div>
		</section>
	{:else}
		{#if notice}<p class="mb-4 rounded-[12px] bg-[rgba(119,152,18,.12)] px-3 py-2 text-[13px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}
		{#if error}<p class="mb-4 rounded-[12px] bg-[rgba(224,122,122,.12)] px-3 py-2 text-[13px] text-[#f09b9b]" role="alert">{error}</p>{/if}

		{#if analyticsLoading}
			<section class="border-y border-[var(--pc-border-strong)] py-5" aria-live="polite"><p class="text-[13px] text-[var(--pc-text-muted)]">Loading your product signals…</p></section>
		{:else if analyticsError}
			<section class="border-y border-[var(--pc-border-strong)] py-5" role="alert"><h2 class="text-[15px] font-medium">Product signals unavailable</h2><p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Your profile is available, but the latest product data could not be loaded.</p></section>
		{:else if makerAnalytics}
			{#if makerAnalytics.activeBoost}
				<section class="border-b border-[var(--pc-border-strong)] py-5" aria-labelledby="active-boost-title">
					<div class="flex flex-wrap items-end justify-between gap-3"><div><h2 id="active-boost-title" class="text-[15px] font-medium">Active boost</h2><p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">{makerAnalytics.activeBoost.eventTitle}</p></div><span class="text-[12px] tabular-nums text-[var(--pc-accent-light)]">Visibility remaining: {formatRemaining(makerAnalytics.activeBoost.endsAt)}</span></div>
					<p class="mt-3 text-[12px] text-[var(--pc-text-muted)]">Ends {formatDate(makerAnalytics.activeBoost.endsAt)} · Paid ${(makerAnalytics.activeBoost.amountCents / 100).toFixed(2)}</p>
				</section>
			{/if}
		{/if}

		<div class="mt-6 grid gap-5">
			<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
				<div class="flex items-center gap-3 p-4">
					<div class="shrink-0">
						{#if avatarUrl}
							<img src={avatarUrl} alt={displayName || fullName} width="40" height="40" class="size-10 rounded-full object-cover bg-[var(--pc-surface)]" onerror={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; const f=t.nextElementSibling as HTMLElement; if(f) f.style.display='grid'; }} />
							<div class="hidden size-10 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)]" style="display:none"><User size={18} weight="Outline" aria-hidden="true" /></div>
						{:else}
							<div class="grid size-10 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)]"><User size={18} weight="Outline" aria-hidden="true" /></div>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium">Profile photo</div>
						<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Square image — shows on /m/ and the switcher.</p>
					</div>
					<label class="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--pc-surface-2)] px-3 text-[13px] font-medium hover:bg-[var(--pc-border-strong)] transition-[background-color,transform] active:scale-[0.96]" use:tooltip={{ text: 'Upload avatar — square, shows on /m/', island: true }}>
						<Upload size={14} weight="Outline" aria-hidden="true" /> {avatarUploading ? 'Uploading…' : 'Upload'}
						<input type="file" accept="image/*" class="sr-only" onchange={handleAvatarUpload} disabled={avatarUploading} />
					</label>
				</div>

				<div class="flex items-center gap-3 p-4">
					<label for="you-display" class="min-w-0 flex-1 truncate text-sm font-medium">Display name</label>
					<Input id="you-display" bind:value={displayName} placeholder="Amina Yusuf" class="w-52 shrink-0 max-sm:text-base!" />
				</div>

				<div class="flex items-center gap-3 p-4">
					<label for="you-full" class="min-w-0 flex-1 truncate text-sm font-medium">Full name</label>
					<Input id="you-full" bind:value={fullName} placeholder="Amina Yusuf" class="w-52 shrink-0 max-sm:text-base!" />
				</div>

				<div class="p-4">
					<label for="you-bio" class="text-sm font-medium">Bio</label>
					<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Shows on your public /m/ page.</p>
					<Textarea id="you-bio" rows={4} bind:value={bio} placeholder="Indie maker. Building Bento, Driftlog..." class="mt-3 resize-y! max-sm:text-base!" />
				</div>

				<div class="flex items-center gap-3 p-4">
					<label for="you-avatar" class="min-w-0 flex-1 truncate text-sm font-medium">Avatar URL</label>
					<Input id="you-avatar" bind:value={avatarUrl} placeholder="https://..." class="w-64 shrink-0 max-sm:text-base!" />
				</div>

				<div class="flex items-center gap-3 p-4">
					<label for="you-website" class="min-w-0 flex-1 truncate text-sm font-medium">Website</label>
					<Input id="you-website" bind:value={website} placeholder="https://bento.dev" class="w-52 shrink-0 max-sm:text-base!" />
				</div>

				<div class="flex items-center gap-3 p-4">
					<label for="you-twitter" class="min-w-0 flex-1 truncate text-sm font-medium">X (Twitter)</label>
					<Input id="you-twitter" bind:value={twitter} placeholder="@handle" class="w-52 shrink-0 max-sm:text-base!" />
				</div>

				<div class="flex items-center gap-3 p-4">
					<label for="you-github" class="min-w-0 flex-1 truncate text-sm font-medium">GitHub</label>
					<Input id="you-github" bind:value={github} placeholder="handle" class="w-52 shrink-0 max-sm:text-base!" />
				</div>

				<div class="flex items-center gap-3 p-4">
					<div class="min-w-0 flex-1"><div class="truncate text-sm font-medium">Email</div></div>
					<span class="max-w-52 truncate text-[13px]/[18px] text-[var(--pc-text-muted)]">{profile?.email ?? ''}</span>
				</div>

				<div class="flex justify-end p-4">
					<Button size="sm" loading={savingProfile} onclick={saveProfile}><CheckCircle size={14} weight="Outline" aria-hidden="true" /> Save profile</Button>
				</div>
			</section>

			<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
				{#if tenant}
					<div class="p-4">
						<div class="flex items-center gap-3">
							<div class="min-w-0 flex-1">
								<label for="you-slug" class="flex items-center gap-2 text-sm font-medium"><Link size={16} weight="Outline" aria-hidden="true" />Handle</label>
								<p class="mt-0.5 truncate text-[13px]/[18px] text-[var(--pc-text-muted)]">{displaySubdomain(tenant.slug)}</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<Input id="you-slug" bind:value={slugDraft} placeholder="gemma" class="w-48 font-mono max-sm:text-base!" error={slugError} aria-describedby="you-slug-error" />
								<Button size="sm" loading={savingSlug} onclick={saveSlug}>Save</Button>
							</div>
						</div>
						{#if slugError}<p id="you-slug-error" class="mt-2 text-[13px] text-[#f09b9b]">{slugError}</p>{/if}
					</div>

					{#each [{label: 'Docs', href: tenantUrl(tenant.slug, '/'), icon: Globe}, {label: 'Roadmap', href: tenantRoadmapUrl(tenant.slug), icon: Compass}, {label: 'Status', href: tenantStatusUrl(tenant.slug), icon: Shield}] as row}
						{@const Icon = row.icon}
						<div class="flex items-center gap-3 p-4">
							<span class="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium"><Icon size={16} weight="Outline" aria-hidden="true" />{row.label}</span>
							<div class="flex shrink-0 items-center gap-2">
								<a href={row.href} target="_blank" rel="noopener" class="max-w-[28ch] truncate font-mono text-[13px] text-[var(--pc-accent-light)] hover:underline" use:tooltip={{ text: row.href, island: true }}>{row.href}</a>
								<button type="button" class="grid size-8 place-items-center rounded-full bg-[var(--pc-bg)] text-[var(--pc-text-muted)] hover:text-[var(--pc-text)] transition-[color,transform] active:scale-[0.96]" onclick={() => copy(row.href)} aria-label="Copy link" use:tooltip={{ text: 'Copy', island: true }}><Copy size={14} weight="Outline" aria-hidden="true" /></button>
							</div>
						</div>
					{/each}
				{:else}
					<div class="p-4 text-sm text-[var(--pc-text-muted)]">Your workspace will appear after you sign in.</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
