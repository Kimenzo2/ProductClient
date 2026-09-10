<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, Calendar, CheckCircle, Compass, Copy, Globe, Link, Shield, Upload, User } from 'reicon-svelte';
	import { Button, Card, Input, Label, Textarea } from '$lib/components/ui';
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
	let bannerUrl = $state('');
	let bio = $state('');
	let website = $state('');
	let twitter = $state('');
	let github = $state('');
	let slugDraft = $state('');
	let slugError = $state('');
	let avatarUploading = $state(false);
	let bannerUploading = $state(false);
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
				const gd = (prof as { gamification_data?: { bio?: string; banner_url?: string; website?: string; twitter?: string; github?: string } }).gamification_data;
				bio = gd?.bio ?? '';
				bannerUrl = gd?.banner_url ?? '';
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
			error = msg.includes('Bucket not found') ? 'Bucket not found — check Supabase storage buckets (avatars must be public)' : msg;
		} finally { avatarUploading = false; }
	}

	async function handleBannerUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file || !supabase) return;
		bannerUploading = true;
		try {
			const ext = file.name.split('.').pop() ?? 'jpg';
			const uid = profile?.id ?? (await supabase.auth.getUser()).data.user?.id ?? 'anon';
			const path = `${uid}/banner-${Date.now()}.${ext}`;
			const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
			if (upErr) throw upErr;
			const { data } = supabase.storage.from('avatars').getPublicUrl(path);
			bannerUrl = data.publicUrl;
			notice = 'Banner uploaded — save to persist';
			setTimeout(() => (notice = ''), 2000);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Banner upload failed';
			error = msg.includes('Bucket not found') ? 'Bucket not found — check Supabase storage buckets (avatars must be public)' : msg;
		} finally { bannerUploading = false; }
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
						banner_url: bannerUrl.trim(),
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

<div class="w-full max-w-[880px] mx-auto px-6 max-sm:px-4">
	<!-- ── Mirrors P-Landing /m/[handle] — preview of public maker page ── -->
	<div class="h-[140px] md:h-[180px] -mx-6 max-sm:-mx-4 rounded-b-[20px] overflow-hidden bg-[var(--pc-surface-2)] relative group/banner border-b border-[var(--pc-border-strong)]">
		{#if bannerUrl}
			<img src={bannerUrl} alt="Banner" class="h-full w-full object-cover" onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
		{:else}
			<div class="h-full w-full bg-[linear-gradient(135deg,var(--pc-surface)_0%,var(--pc-surface-2)_100%)] flex items-center justify-center">
				<span class="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--pc-text-faint)]">No banner</span>
			</div>
		{/if}
		<label class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-bg)]/90 px-3.5 py-2 text-[12px] font-medium text-[var(--pc-text)] shadow-[0_2px_12px_rgba(0,0,0,0.15)] backdrop-blur border border-[var(--pc-border-strong)] cursor-pointer hover:bg-[var(--pc-surface)] transition-colors z-20" use:tooltip={{ text: 'Upload banner — 1920×400, shows on your public /m/ page', island: true }}>
			<Upload size={14} weight="Outline" aria-hidden="true" /> {bannerUploading ? 'Uploading…' : 'Change banner'}
			<input type="file" accept="image/*" class="sr-only" onchange={handleBannerUpload} disabled={bannerUploading} />
		</label>
	</div>

	<header class="flex items-end gap-4 -mt-10 md:-mt-12 relative z-10 pb-5">
		<div class="relative shrink-0 -mt-10 md:-mt-12">
			{#if avatarUrl}
				<img src={avatarUrl} alt={displayName || fullName} width="80" height="80" class="size-[80px] md:size-24 rounded-full object-cover bg-[var(--pc-surface)] ring-4 ring-[var(--pc-bg)] shadow-[0_4px_20px_rgba(0,0,0,0.15)]" onerror={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; const f=t.nextElementSibling as HTMLElement; if(f) f.style.display='grid'; }} />
				<div class="hidden size-[80px] md:size-24 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] ring-4 ring-[var(--pc-bg)] text-[28px] font-medium" style="display:none">{(displayName || fullName || 'U').charAt(0).toUpperCase()}</div>
			{:else}
				<div class="grid size-[80px] md:size-24 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] ring-4 ring-[var(--pc-bg)] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"><User size={36} weight="Outline" aria-hidden="true" /></div>
			{/if}
			<label class="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-[var(--pc-accent)] text-white cursor-pointer hover:opacity-90 transition-opacity shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-2 ring-[var(--pc-bg)]" use:tooltip={{ text: 'Upload avatar — square, shows on /m/', island: true }}>
				<Upload size={14} weight="Outline" aria-hidden="true" />
				<input type="file" accept="image/*" class="sr-only" onchange={handleAvatarUpload} disabled={avatarUploading} />
			</label>
		</div>
		<div class="min-w-0 flex-1 pb-1">
			<div class="flex items-center gap-2">
				<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">{displayName || fullName || 'Your profile'}</h1>
			</div>
			<p class="mt-1 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.009em] text-[var(--pc-text-muted)]">@{tenant?.slug ?? 'handle'} · {profile?.email ?? ''}</p>
		</div>
		<div class="hidden sm:flex items-center gap-2 shrink-0 pb-1">
			<a href="/workspace/analytics" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-1.5 text-[13px] hover:bg-[var(--pc-surface-2)] transition-colors">Analytics <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>
			<a href={tenant ? `/m/${tenant.slug}` : '#'} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-surface)] px-3 py-1.5 text-[13px] hover:bg-[var(--pc-surface-2)] transition-colors" use:tooltip={{ text: 'Preview public /m/ page', island: true }}>Preview</a>
		</div>
	</header>

	{#if bio}<p class="text-[13px] leading-relaxed text-[var(--pc-text-muted)] max-w-[52ch] opacity-80">{bio}</p>{/if}

	<!-- DB-tracked, read-only — mirrors /m/ stats row, not editable -->
	<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--pc-text-muted)]" use:tooltip={{ text: 'Followers, following, products, and views are tracked by DB — not editable', island: true }}>
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

		{#if analyticsLoading}
			<section class="border-y border-[var(--pc-border-strong)] py-5" aria-live="polite"><p class="text-[13px] text-[var(--pc-text-muted)]">Loading your product signals…</p></section>
		{:else if analyticsError}
			<section class="border-y border-[var(--pc-border-strong)] py-5" role="alert"><h2 class="text-[15px] font-medium">Product signals unavailable</h2><p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Your profile is available, but the latest product data could not be loaded.</p></section>
		{:else if makerAnalytics}
			<section class="mt-6 border-y border-[var(--pc-border-strong)]" aria-labelledby="profile-signals-title">
				<div class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--pc-border-strong)] py-4">
					<div><h2 id="profile-signals-title" class="text-[15px] font-medium">Product signals</h2><p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">A current read on how your products are being found and maintained.</p></div>
					<a href="/workspace/analytics" class="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--pc-accent-light)] hover:underline">Open Analytics <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>
				</div>
				<div class="grid grid-cols-2 divide-x divide-y divide-[var(--pc-border-strong)] sm:grid-cols-4 sm:divide-y-0">
					<div class="grid gap-1 px-0 py-4 pr-4"><strong class="text-[22px] font-medium tracking-tight tabular-nums">{stats.followers}</strong><span class="text-[11px] text-[var(--pc-text-muted)]">Followers</span></div>
					<div class="grid gap-1 px-4 py-4"><strong class="text-[22px] font-medium tracking-tight tabular-nums">{formatCount(makerAnalytics.metrics.views)}</strong><span class="text-[11px] text-[var(--pc-text-muted)]">Views</span></div>
					<div class="grid gap-1 px-0 py-4 pr-4 sm:pl-4"><strong class="text-[22px] font-medium tracking-tight tabular-nums">{formatCount(makerAnalytics.metrics.returnVisits)}</strong><span class="text-[11px] text-[var(--pc-text-muted)]">Return visits</span></div>
					<div class="grid gap-1 px-4 py-4"><strong class="text-[22px] font-medium tracking-tight tabular-nums">{formatCount(makerAnalytics.metrics.linkClicks)}</strong><span class="text-[11px] text-[var(--pc-text-muted)]">Link clicks</span></div>
				</div>
			</section>

			<section class="border-b border-[var(--pc-border-strong)] py-5" aria-labelledby="profile-completeness-title">
				<div class="flex flex-wrap items-end justify-between gap-3"><div><h2 id="profile-completeness-title" class="text-[15px] font-medium">Listing completeness</h2><p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">Keep the public path useful with the essentials in place.</p></div><span class="text-[12px] text-[var(--pc-text-muted)]">{makerAnalytics.completeness.total} product{makerAnalytics.completeness.total === 1 ? '' : 's'}</span></div>
				<div class="mt-4 grid gap-2 sm:grid-cols-4">
					<div class="flex items-center justify-between border-t border-[var(--pc-border-strong)] py-2 text-[12px]"><span>Docs</span><span class="text-[var(--pc-text-muted)]">{makerAnalytics.completeness.docs}/{makerAnalytics.completeness.total}</span></div>
					<div class="flex items-center justify-between border-t border-[var(--pc-border-strong)] py-2 text-[12px]"><span>Roadmap or feedback</span><span class="text-[var(--pc-text-muted)]">{makerAnalytics.completeness.roadmap}/{makerAnalytics.completeness.total}</span></div>
					<div class="flex items-center justify-between border-t border-[var(--pc-border-strong)] py-2 text-[12px]"><span>Status</span><span class="text-[var(--pc-text-muted)]">{makerAnalytics.completeness.status}/{makerAnalytics.completeness.total}</span></div>
					<div class="flex items-center justify-between border-t border-[var(--pc-border-strong)] py-2 text-[12px]"><span>Live URL</span><span class="text-[var(--pc-text-muted)]">{makerAnalytics.completeness.liveUrl}/{makerAnalytics.completeness.total}</span></div>
				</div>
			</section>

			{#if makerAnalytics.activeBoost}
				<section class="border-b border-[var(--pc-border-strong)] py-5" aria-labelledby="active-boost-title">
					<div class="flex flex-wrap items-end justify-between gap-3"><div><h2 id="active-boost-title" class="text-[15px] font-medium">Active boost</h2><p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">{makerAnalytics.activeBoost.eventTitle}</p></div><span class="text-[12px] text-[var(--pc-accent-light)]">Visibility remaining: {formatRemaining(makerAnalytics.activeBoost.endsAt)}</span></div>
					<p class="mt-3 text-[12px] text-[var(--pc-text-muted)]">Ends {formatDate(makerAnalytics.activeBoost.endsAt)} · Paid ${(makerAnalytics.activeBoost.amountCents / 100).toFixed(2)}</p>
				</section>
			{/if}
		{/if}

		<div class="grid gap-6 pb-12 mt-6">
			<Card padding="lg">
				<h2 class="text-[15px] font-medium">Profile — mirrors /m/ page</h2>
				<p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">Editable: avatar, banner, bio, links. DB-tracked followers, following, products, and views are read-only.</p>
				<div class="mt-5 grid gap-5 sm:grid-cols-2">
					<div class="grid gap-2"><Label for="you-display">Display name</Label><Input id="you-display" bind:value={displayName} placeholder="Amina Yusuf" /></div>
					<div class="grid gap-2"><Label for="you-full">Full name</Label><Input id="you-full" bind:value={fullName} placeholder="Amina Yusuf" /></div>
					<div class="grid gap-2">
						<Label for="you-avatar">Avatar</Label>
						<div class="flex gap-2">
							<Input id="you-avatar" bind:value={avatarUrl} placeholder="https://..." class="flex-1" />
							<label class="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--pc-surface)] px-3 py-2 text-[12px] font-medium hover:bg-[var(--pc-surface-2)] cursor-pointer" use:tooltip={{ text: 'Upload screen — picks from device', island: true }}><Upload size={14} weight="Outline" aria-hidden="true" /> Upload <input type="file" accept="image/*" class="sr-only" onchange={handleAvatarUpload} /></label>
						</div>
						<span class="text-[11px] text-[var(--pc-text-faint)]">Upload a square screen — shows on /m/ avatar</span>
					</div>
					<div class="grid gap-2">
						<Label for="you-banner">Banner</Label>
						<div class="flex gap-2">
							<Input id="you-banner" bind:value={bannerUrl} placeholder="https://..." class="flex-1" />
							<label class="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--pc-surface)] px-3 py-2 text-[12px] font-medium hover:bg-[var(--pc-surface-2)] cursor-pointer" use:tooltip={{ text: 'Upload banner — 1920×400 shows on /m/', island: true }}><Upload size={14} weight="Outline" aria-hidden="true" /> Upload <input type="file" accept="image/*" class="sr-only" onchange={handleBannerUpload} /></label>
						</div>
						<span class="text-[11px] text-[var(--pc-text-faint)]">Upload wide screen — banner on /m/</span>
					</div>
					<div class="grid gap-2"><Label for="you-website">Website</Label><Input id="you-website" bind:value={website} placeholder="https://bento.dev" /></div>
					<div class="grid gap-2"><Label for="you-twitter">X (Twitter)</Label><Input id="you-twitter" bind:value={twitter} placeholder="@handle" /></div>
					<div class="grid gap-2"><Label for="you-github">GitHub</Label><Input id="you-github" bind:value={github} placeholder="handle" /></div>
					<div class="grid gap-2"><Label for="you-email">Email</Label><Input id="you-email" value={profile?.email ?? ''} disabled /></div>
					<div class="grid gap-2 sm:col-span-2"><Label for="you-bio">Bio</Label><Textarea id="you-bio" rows={3} bind:value={bio} placeholder="Indie maker. Building Bento, Driftlog..." /></div>
				</div>
				<div class="mt-4 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-[11px] leading-[1.5] text-[var(--pc-text-muted)]">
					<span class="font-medium text-[var(--pc-text)]">DB-tracked (not editable):</span> followers · following · products · views · joined date — shown above and loaded from product activity.
				</div>
				<div class="mt-5">
					<Button size="sm" loading={savingProfile} onclick={saveProfile}><CheckCircle size={14} weight="Outline" aria-hidden="true" /> Save profile</Button>
				</div>
			</Card>

			<Card padding="lg">
				<h2 class="text-[15px] font-medium">Your site</h2>
				<p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Your address and hosted pages.</p>
				{#if tenant}
					<div class="mt-4 flex flex-wrap items-center gap-2">
						<div class="flex min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2">
							<Link size={14} weight="Outline" class="opacity-60" aria-hidden="true" />
							<Input id="you-slug" bind:value={slugDraft} placeholder="gemma" class="min-w-0 flex-1 font-mono !border-0 !bg-transparent p-0 text-[14px]" error={slugError} />
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
