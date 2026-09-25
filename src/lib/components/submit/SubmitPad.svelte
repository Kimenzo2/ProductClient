<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CloseCircle, Add, ImagePlus, Link2, Check, Globe } from 'reicon-svelte';
import { tooltip } from '$lib/components/Tooltip.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
	import { activeProductStore, setActiveProduct } from '$lib/stores/activeProduct.svelte';

	type Tab = 'product' | 'media' | 'launch' | 'review';
	type Pricing = 'free' | 'free_paid' | 'paid' | null;
	type Availability = 'live' | 'coming_soon';

	let activeTab: Tab = $state('product');
	let draftId: string | null = $state(null);
	let savedHint = $state('');
	let saving = $state(false);
	let publishing = $state(false);
	let slugError = $state('');
	let websiteWarn = $state('');
	let mediaError = $state('');
	let nameError = $state('');
	let taglineError = $state('');

	// Exit confirm — small modal, same Pad language, never Pad-sized
	let showExitModal = $state(false);
	let pendingExitHref = $state('/workspace');
	let exitModalSaving = $state(false);
	let exitModalError = $state('');
	let keepEditingBtn: HTMLButtonElement | null = $state(null);
	let reducedMotion = $state(false);
	let exitPanel: HTMLDivElement | null = $state(null);
	let padCloseBtn: HTMLButtonElement | null = $state(null);
	let exitTrigger: HTMLElement | null = $state(null);
	// Move focus to the safe default when the modal opens (no autofocus attr)
	$effect(() => {
		if (showExitModal) keepEditingBtn?.focus();
	});
	// Scroll lock — the pad behind must not move while deciding
	$effect(() => {
		if (!showExitModal) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});
	// Focus trap — Tab cycles inside the modal, never into the pad behind
	function handleExitModalKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab' || !exitPanel) return;
		const focusables = exitPanel.querySelectorAll<HTMLElement>(
			'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
		);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	// Fields
	let website = $state('');
	let name = $state('');
	let slug = $state('');
	let tagline = $state('');
	let description = $state('');
	let categories: string[] = $state([]);
	let pricing: Pricing = $state(null);
	let availability: Availability = $state('live');
	let logoUrl = $state('');
	let logoPreviewUrl = $state('');
	let logoUploading = $state(false);
	let screenshots: string[] = $state([]);
	let videoUrl = $state('');
	let extraLinks: Array<{ label: string; url: string }> = $state([]);
	let extraLabel = $state('');
	let extraUrl = $state('');
	let launchTitle = $state('');
	let launchNote = $state('');
	let youBuiltThis = $state(true);

	// Rich profile — mirrors /p/bento prototype so production never shows "Not listed"
	let capabilities: Array<{ name: string; description: string }> = $state([
		{ name: '', description: '' },
		{ name: '', description: '' },
		{ name: '', description: '' },
		{ name: '', description: '' }
	]);
	let differentiators: Array<{ name: string; description: string }> = $state([
		{ name: '', description: '' },
		{ name: '', description: '' },
		{ name: '', description: '' }
	]);
	let audienceFor: string[] = $state(['', '', '']);
	let howItWorks: string[] = $state(['', '', '']);
	let pricingSummary = $state('');
	let pricingPlans: Array<{ name: string; price: string; detail: string }> = $state([
		{ name: 'Free', price: '$0', detail: 'Core search and 50 AI actions a month.' },
		{ name: 'Pro', price: '$12/mo', detail: 'Unlimited actions, voice, priority local index.' },
		{ name: 'Team', price: '$20/user', detail: 'Shared presets, admin controls, central billing.' }
	]);
	let platforms: string[] = $state([]);
	let faqs: Array<{ question: string; answer: string }> = $state([
		{ question: '', answer: '' },
		{ question: '', answer: '' },
		{ question: '', answer: '' }
	]);

	let taglineCount = $derived(`${tagline.length}/60`);
	let slugTouched = $state(false);

	const taxonomy = ['AI tools', 'Developer tools', 'Design', 'Productivity', 'Marketing', 'Analytics', 'Collaboration', 'Finance', 'Open source'] as const;
	const platformOptions = ['macOS', 'Windows', 'Web', 'iOS', 'Android', 'Linux'] as const;

	function stripUtm(input: string): string {
		try {
			const url = new URL(input.trim());
			['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','fbclid','ref'].forEach((k) => url.searchParams.delete(k));
			// strip vercel/netlify subdomain warning is soft, not block
			return url.toString();
		} catch {
			return input.trim();
		}
	}
	function normalizeSlug(input: string): string {
		return input.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,63).replace(/-+$/g,'');
	}
	// Defense-in-depth: only http(s) websites ever reach the DB or an href —
	// restored drafts and publish-without-blur must not smuggle schemes through
	function safeWebsite(): string | null {
		const trimmed = website.trim();
		if (!trimmed) return null;
		return /^https?:\/\//i.test(trimmed) ? trimmed : null;
	}
	function normalizeWebsiteBlur() {
		if (!website.trim()) { websiteWarn=''; return; }
		const raw = website.trim();
		const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
		const canonical = stripUtm(withProto);
		website = canonical;
		if (/\.(vercel\.app|netlify\.app)(\/|$)/i.test(canonical)) websiteWarn = 'Heads up: app subdomains look temporary — consider a custom domain.';
		else websiteWarn = '';
		// Prefill name/tagline only when empty — soft OG fetch not wired, keep empty
	}
	async function checkSlugBlur() {
		slugError = '';
		if (!slug) return;
		const normalized = normalizeSlug(slug);
		if (normalized !== slug) slug = normalized;
		if (!slug) return;
		if (!supabase) return;
		const { data: session } = await supabase.auth.getSession();
		if (!session.session) return;
		try {
			const { data, error } = await supabase
				.from('products')
				.select('id')
				.eq('slug', slug)
				.neq('id', draftId ?? '00000000-0000-0000-0000-000000000000')
				.maybeSingle();
			if (error) {
				const code = (error as any).code;
				// PGRST116 = no rows, 406 etc are fine
				if (code === 'PGRST116' || code === 'PGRST301') return;
				console.warn('[pad] slug check', error);
				return;
			}
			if (data) slugError = 'That address is taken — try another.';
		} catch (e) {
			console.warn('[pad] slug check threw', e);
		}
	}
	function handleNameInput(value: string) {
		name = value;
		if (!slugTouched && !slug) slug = normalizeSlug(value);
	}
	function toggleCategory(cat: string) {
		if (categories.includes(cat)) categories = categories.filter((c) => c !== cat);
		else if (categories.length < 3) categories = [...categories, cat];
	}
	function togglePlatform(p: string) {
		if (platforms.includes(p)) platforms = platforms.filter((x) => x !== p);
		else platforms = [...platforms, p];
	}
	function addExtraLink() {
		if (!extraUrl.trim()) return;
		const url = /^https?:\/\//i.test(extraUrl.trim()) ? extraUrl.trim() : `https://${extraUrl.trim()}`;
		extraLinks = [...extraLinks, { label: extraLabel.trim() || new URL(url).hostname.replace(/^www\./,''), url }];
		extraLabel = ''; extraUrl = '';
	}
	function removeExtraLink(index: number) {
		extraLinks = extraLinks.filter((_, i) => i !== index);
	}
	function addScreenshotUrl() {
		const url = prompt('Paste image URL');
		if (!url) return;
		const trimmed = url.trim();
		if (!trimmed) return;
		screenshots = [...screenshots, trimmed].slice(0, 6);
	}
	function removeScreenshot(index: number) {
		screenshots = screenshots.filter((_, i) => i !== index);
	}
	function isDurableMediaUrl(value: string): boolean {
		return /^https?:\/\//i.test(value) || value.startsWith('/');
	}

	async function handleLogoChange(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		// Size cap — a 20MB file would decode on the main thread and freeze the tab
		const MAX_LOGO_BYTES = 8 * 1024 * 1024;
		if (file.size > MAX_LOGO_BYTES) {
			mediaError = 'Logo is too large — keep it under 8 MB.';
			return;
		}
		mediaError = '';
		if (!supabase) {
			mediaError = 'Service unavailable — try again.';
			return;
		}
		if (logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl);
		const previewUrl = URL.createObjectURL(file);
		logoPreviewUrl = previewUrl;
		logoUploading = true;
		try {
			const { data: session } = await supabase.auth.getSession();
			const token = session.session?.access_token;
			if (!token) throw new Error('Sign in to upload a logo.');
			const form = new FormData();
			form.set('file', file);
			if (draftId) form.set('product_id', draftId);
			const response = await fetch('/api/products/upload', {
				method: 'POST',
				headers: { authorization: `Bearer ${token}` },
				body: form
			});
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.ok || typeof result.url !== 'string') {
				throw new Error(result?.message ?? 'Could not upload logo.');
			}
			logoUrl = result.url;
			URL.revokeObjectURL(previewUrl);
			logoPreviewUrl = '';
		} catch (error) {
			URL.revokeObjectURL(previewUrl);
			logoPreviewUrl = '';
			mediaError = error instanceof Error ? error.message : 'Could not upload logo.';
		} finally {
			logoUploading = false;
		}
	}

	let isDirty = $derived(
		website.trim().length > 0 ||
		name.trim().length > 0 ||
		tagline.trim().length > 0 ||
		description.trim().length > 0 ||
		screenshots.length > 0 ||
		logoUrl.trim().length > 0 ||
		capabilities.some((c) => c.name.trim() || c.description.trim()) ||
		differentiators.some((d) => d.name.trim() || d.description.trim()) ||
		audienceFor.some((a) => a.trim()) ||
		howItWorks.some((h) => h.trim()) ||
		pricingSummary.trim().length > 0 ||
		pricingPlans.some((p) => p.name.trim() || p.price.trim() || p.detail.trim()) ||
		platforms.length > 0 ||
		faqs.some((f) => f.question.trim() || f.answer.trim())
	);

	// Local-first draft — keystrokes persist to localStorage only. The database is
	// touched solely on explicit "Save draft" / "Publish launch", so an abandoned
	// pad never creates ghost products or burns slugs.
	const LOCAL_DRAFT_KEY = 'submit-pad-local-draft-v1';
	const LOCAL_DRAFT_VERSION = 1;
	const LOCAL_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
	// Namespaced per edited draft — editing ?id=X must never leak into (or read)
	// a new pad's snapshot
	let localDraftKey = LOCAL_DRAFT_KEY;

	function formSnapshot() {
		return { website, name, slug, tagline, description, categories, pricing, availability, logoUrl, screenshots, videoUrl, extraLinks, launchTitle, launchNote, youBuiltThis, capabilities, differentiators, audienceFor, howItWorks, pricingSummary, pricingPlans, platforms, faqs };
	}
	function persistLocalDraft() {
		try {
			if (!isDirty) return;
			localStorage.setItem(
				localDraftKey,
				JSON.stringify({ version: LOCAL_DRAFT_VERSION, savedAt: Date.now(), fields: formSnapshot() })
			);
		} catch { /* private mode / quota — pad still works in memory */ }
	}
	function clearLocalDraft() {
		try { localStorage.removeItem(localDraftKey); } catch { /* noop */ }
	}
	function applyLocalFields(d: any): boolean {
		if (!d || typeof d !== 'object') return false;
		website = d.website ?? ''; name = d.name ?? ''; slug = d.slug ?? '';
		tagline = d.tagline ?? ''; description = d.description ?? '';
		categories = d.categories ?? []; pricing = d.pricing ?? null;
		availability = d.availability ?? 'live'; logoUrl = d.logoUrl ?? '';
		screenshots = d.screenshots ?? []; videoUrl = d.videoUrl ?? '';
		extraLinks = d.extraLinks ?? []; launchTitle = d.launchTitle ?? '';
		launchNote = d.launchNote ?? ''; youBuiltThis = d.youBuiltThis ?? true;
		if (Array.isArray(d.capabilities) && d.capabilities.length) capabilities = d.capabilities;
		if (Array.isArray(d.differentiators) && d.differentiators.length) differentiators = d.differentiators;
		if (Array.isArray(d.audienceFor) && d.audienceFor.length) audienceFor = d.audienceFor;
		if (Array.isArray(d.howItWorks) && d.howItWorks.length) howItWorks = d.howItWorks;
		if (typeof d.pricingSummary === 'string') pricingSummary = d.pricingSummary;
		if (Array.isArray(d.pricingPlans) && d.pricingPlans.length) pricingPlans = d.pricingPlans;
		if (Array.isArray(d.platforms)) platforms = d.platforms;
		if (Array.isArray(d.faqs) && d.faqs.length) faqs = d.faqs;
		// Only claim "address touched" when an address was actually restored —
		// otherwise a restored-then-renamed product loses slug auto-suggest
		if (slug) slugTouched = true;
		return isDirty;
	}
	function restoreLocalDraft(): boolean {
		try {
			const raw = localStorage.getItem(localDraftKey);
			if (!raw) return false;
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== 'object') return false;
			// Versioned envelope — drop stale or foreign-schema drafts silently
			if (parsed.fields && typeof parsed.fields === 'object') {
				if (parsed.version !== LOCAL_DRAFT_VERSION) { clearLocalDraft(); return false; }
				if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > LOCAL_DRAFT_TTL_MS) {
					clearLocalDraft();
					return false;
				}
				return applyLocalFields(parsed.fields);
			}
			// Legacy flat shape (pre-envelope) — restore once, re-persist enveloped
			if ('name' in parsed || 'website' in parsed) return applyLocalFields(parsed);
			return false;
		} catch { return false; }
	}

	// Fingerprint of the last DB-persisted state. The exit modal triggers only
	// when the form differs from it — plain typing never touches the database.
	let savedFingerprint = $state('');
	let currentFingerprint = $derived(JSON.stringify(formSnapshot()));
	let isDbDirty = $derived(currentFingerprint !== savedFingerprint);

	let localPersistTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		void currentFingerprint;
		if (!isDirty) return;
		clearTimeout(localPersistTimer);
		localPersistTimer = setTimeout(persistLocalDraft, 800);
		return () => clearTimeout(localPersistTimer);
	});

	async function saveDraft(showHint = true) {
		if (!supabase) {
			if (showHint) mediaError = 'Service unavailable — try again.';
			return false;
		}
		const { data: session } = await supabase.auth.getSession();
		if (!session.session) {
			if (showHint) {
				mediaError = 'Sign in to save — your draft stays here until you sign in.';
				savedHint = '';
			}
			return false;
		}
		saving = true;
		if (showHint) mediaError = '';
		try {
			const finalSlug = slug || normalizeSlug(name) || `product-${Math.random().toString(36).slice(2, 6)}`;
			if (!slug) slug = finalSlug;
			const fullPayload: any = {
				id: draftId,
				name: name || 'Untitled product',
				slug: finalSlug,
				tagline: tagline || null,
				description: description || null,
				categories,
				pricing,
				availability,
				logo_url: logoUrl || null,
				website: safeWebsite(),
				screenshots,
				video_url: videoUrl || null,
				extra_links: extraLinks,
				launch_title: launchTitle || null,
				launch_note: launchNote || null,
				you_built_this: youBuiltThis,
				draft: true,
				capabilities: capabilities.filter((c) => c.name.trim() || c.description.trim()),
				differentiators: differentiators.filter((d) => d.name.trim() || d.description.trim()),
				audience_for: audienceFor.filter((a) => a.trim()),
				how_it_works: howItWorks.filter((h) => h.trim()),
				pricing_summary: pricingSummary.trim() || null,
				pricing_plans: pricingPlans.filter((p) => p.name.trim() || p.price.trim() || p.detail.trim()),
				platforms,
				faqs: faqs.filter((f) => f.question.trim() || f.answer.trim())
			};
			const { data: rpcData, error: rpcErr } = await supabase.rpc('upsert_product_pad', { p_payload: fullPayload });
			if (rpcErr) throw rpcErr;
			const product = Array.isArray(rpcData) ? (rpcData as any[])[0] : rpcData as any;
			if (!product?.id) throw new Error('Product was not returned by the database.');
			draftId = product.id;
			savedFingerprint = JSON.stringify(formSnapshot());
			clearLocalDraft();
			// A saved slug is owned by definition — drop any stale async-check error
			slugError = '';
			if (showHint) {
				savedHint = 'Draft saved';
				setTimeout(() => (savedHint = ''), 1200);
			}
			return true;
		} catch (e: any) {
			const raw = e?.message ?? e?.details ?? e?.hint ?? String(e);
			const msg = typeof raw === 'string' && raw.trim() ? raw : 'Could not save draft';
			console.warn('[pad] saveDraft', e);
			if (showHint) {
				mediaError = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('slug') ? 'That address is taken — try another.' : msg;
			}
			return false;
		} finally {
			saving = false;
		}
	}

	function publishValidation(): string | null {
		mediaError = ''; nameError = ''; taglineError = '';
		if (!name.trim()) { nameError = 'Add a product name.'; activeTab = 'product'; return nameError; }
		if (!slug.trim()) { slugError = 'Add a product address.'; activeTab = 'product'; return slugError; }
		if (slugError) { activeTab = 'product'; return slugError; }
		if (!tagline.trim()) { taglineError = 'Add a tagline.'; activeTab = 'product'; return taglineError; }
		if (tagline.length > 60) { taglineError = 'Tagline is a bit long — keep it under 60.'; activeTab = 'product'; return taglineError; }
		if (availability === 'live' && screenshots.length === 0 && !videoUrl.trim()) {
			mediaError = 'Add at least one image or a video to publish — draft is still saved.';
			activeTab = 'media';
			return 'Add an image or video to publish.';
		}
		return null;
	}

	async function handlePublish() {
		if (logoUploading) {
			mediaError = 'Wait for the logo upload to finish.';
			activeTab = 'media';
			return;
		}
		const err = publishValidation();
		if (err) {
			return;
		}
		if (!supabase) {
			mediaError = 'Service unavailable — try again.';
			return;
		}
		// Explicit auth check before network to avoid silent no-op
		const { data: preSession } = await supabase.auth.getSession();
		if (!preSession.session) {
			mediaError = 'Sign in to publish — your draft stays here until you sign in.';
			// Send to auth with back redirect; keep draft in state
			await goto(`/auth?next=${encodeURIComponent(page.url.pathname + page.url.search)}`);
			return;
		}
		publishing = true;
		mediaError = '';
		try {
			const saved = await saveDraft(true);
			if (!saved) {
				if (!mediaError) mediaError = 'Could not save draft — check your connection.';
				return;
			}
			if (!draftId) {
				throw new Error('Could not create product — try saving draft first.');
			}
			const publishPayload: any = {
				id: draftId,
				name: name || 'Untitled product',
				slug: slug || normalizeSlug(name),
				tagline: tagline || null,
				description: description || null,
				categories,
				pricing,
				availability,
				logo_url: logoUrl || null,
				website: safeWebsite(),
				screenshots,
				video_url: videoUrl || null,
				extra_links: extraLinks,
				launch_title: launchTitle || null,
				launch_note: launchNote || null,
				you_built_this: youBuiltThis,
				draft: false,
				capabilities: capabilities.filter((c) => c.name.trim() || c.description.trim()),
				differentiators: differentiators.filter((d) => d.name.trim() || d.description.trim()),
				audience_for: audienceFor.filter((a) => a.trim()),
				how_it_works: howItWorks.filter((h) => h.trim()),
				pricing_summary: pricingSummary.trim() || null,
				pricing_plans: pricingPlans.filter((p) => p.name.trim() || p.price.trim() || p.detail.trim()),
				platforms,
				faqs: faqs.filter((f) => f.question.trim() || f.answer.trim())
			};
			const { data: publishedData, error: pubError } = await supabase.rpc('upsert_product_pad', { p_payload: publishPayload });
			if (pubError) throw pubError;
			const publishedProduct = Array.isArray(publishedData) ? (publishedData as any[])[0] : publishedData as any;
			if (!publishedProduct?.id) throw new Error('Published product was not returned by the database.');
			draftId = publishedProduct.id;
			savedFingerprint = JSON.stringify(formSnapshot());
			clearLocalDraft();
			await setActiveProduct(publishedProduct.id);
			const targetSlug = slug || normalizeSlug(name);
			await goto(`/workspace/products/${targetSlug}`);
		} catch (e: any) {
			const raw = e?.message ?? e?.details ?? String(e);
			const msg = typeof raw === 'string' ? raw : 'Could not publish';
			mediaError = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('slug') ? 'That address is taken — try another.' : msg;
		} finally {
			publishing = false;
		}
	}

	function requestExit(href = '/workspace', trigger: HTMLElement | null = null) {
		if (publishing || saving || exitModalSaving) return;
		if (!isDbDirty) {
			void goto(href);
			return;
		}
		pendingExitHref = href;
		exitTrigger = trigger;
		exitModalError = '';
		showExitModal = true;
	}
	function closeExitModal(restoreFocus = true) {
		showExitModal = false;
		if (restoreFocus) (exitTrigger ?? padCloseBtn)?.focus();
	}
	async function confirmSaveDraftAndExit() {
		exitModalSaving = true;
		exitModalError = '';
		try {
			const saved = await saveDraft(true);
			if (!saved) {
				exitModalError = mediaError || 'Could not save draft — check your connection.';
				return;
			}
			// Esc mid-save means "keep editing" — the draft is saved, so just stay
			if (!showExitModal) return;
			showExitModal = false;
			await goto(pendingExitHref);
		} finally {
			exitModalSaving = false;
		}
	}
	function confirmDiscardAndExit() {
		clearLocalDraft();
		showExitModal = false;
		void goto(pendingExitHref);
	}
	function handleBackdropClick(e: MouseEvent) {
		requestExit('/workspace', e.currentTarget as HTMLElement | null);
	}
	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (showExitModal) {
			e.preventDefault();
			closeExitModal();
			return;
		}
		if (isDbDirty) {
			e.preventDefault();
			requestExit('/workspace', document.activeElement instanceof HTMLElement ? document.activeElement : null);
			return;
		}
		void goto('/workspace');
	}
	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Empty-form baseline — anything typed after this counts as unsaved.
		// A restored local draft therefore correctly triggers the exit modal.
		savedFingerprint = JSON.stringify(formSnapshot());
		// hydrate draft if ?id= in query (editing)
		const id = page.url.searchParams.get('id');
		if (id) localDraftKey = `${LOCAL_DRAFT_KEY}:${id}`;
		else if (restoreLocalDraft()) savedHint = 'Unsaved draft restored';
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (JSON.stringify(formSnapshot()) !== savedFingerprint) e.preventDefault();
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		if (id) {
			draftId = id;
			void (async () => {
				if (!supabase) return;
				const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
				if (data) {
					const row = data as any;
					website = row.website ?? '';
					name = row.name ?? '';
					slug = row.slug ?? '';
					tagline = row.tagline ?? '';
					description = row.description ?? '';
					categories = row.categories ?? [];
					pricing = row.pricing ?? null;
					availability = row.availability ?? 'live';
					const persistedLogo = row.logo_url ?? row.avatar ?? '';
					logoUrl = isDurableMediaUrl(persistedLogo) ? persistedLogo : '';
					logoPreviewUrl = '';
					screenshots = Array.isArray(row.screenshots) ? row.screenshots : [];
					videoUrl = row.video_url ?? '';
					extraLinks = Array.isArray(row.extra_links) ? row.extra_links : [];
					launchTitle = row.launch_title ?? '';
					launchNote = row.launch_note ?? '';
					youBuiltThis = row.you_built_this ?? true;
					// Hydrate rich /p fields — freely servable, respect DB length (default 3-4 kept if empty)
					if (Array.isArray(row.capabilities) && row.capabilities.length) capabilities = row.capabilities as any[];
					if (Array.isArray(row.differentiators) && row.differentiators.length) differentiators = row.differentiators as any[];
					if (Array.isArray(row.audience_for) && row.audience_for.length) audienceFor = row.audience_for as string[];
					if (Array.isArray(row.how_it_works) && row.how_it_works.length) howItWorks = row.how_it_works as string[];
					if (typeof row.pricing_summary === 'string') pricingSummary = row.pricing_summary ?? '';
					if (Array.isArray(row.pricing_plans) && row.pricing_plans.length) pricingPlans = row.pricing_plans as any[];
					if (Array.isArray(row.platforms)) platforms = row.platforms as string[];
					if (Array.isArray(row.faqs) && row.faqs.length) faqs = row.faqs as any[];
					slugTouched = true;
					// DB state is the baseline — a same-draft local snapshot overlaid
					// below stays "unsaved", so the exit modal correctly guards it
					savedFingerprint = JSON.stringify(formSnapshot());
					// A same-draft local snapshot (tab closed mid-edit) is strictly
					// newer than the last DB save — saves always clear it
					if (restoreLocalDraft()) savedHint = 'Unsaved draft restored';
				}
			})();
		}
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop: transparent click-catcher, like ProductSwitcher -->
<button type="button" class="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Close" onclick={handleBackdropClick} {...(showExitModal ? { inert: true } : {})}></button>

<!-- Pad — scale 0.98 → 1 + fade per spec -->
<div class="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6" aria-modal="true" role="dialog" aria-label="Add a product" {...(showExitModal ? { inert: true } : {})}>
	<div
		in:scale={{ start: 0.98, duration: 160, easing: cubicOut }}
		class="flex w-full max-w-[820px] max-h-[min(88dvh,860px)] flex-col overflow-hidden rounded-[24px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] sm:max-h-[min(92dvh,860px)] max-sm:inset-0 max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none max-sm:border-0"
		style:background="var(--pc-bg)"
	>
		<!-- Header pinned -->
		<div class="shrink-0 border-b border-[var(--pc-border-strong)]/10 px-6 py-5 sm:px-8">
			<div class="flex items-start justify-between gap-4">
				<div class="min-w-0">
					<h1 class="text-2xl font-medium leading-[1.15] tracking-[-0.015em] text-[var(--pc-text)] text-balance">{name.trim() ? name : 'Add a product'}</h1>
					{#if savedHint}<p class="mt-1 text-sm text-[var(--pc-text-faint)]" role="status">{savedHint}</p>{:else}<p class="mt-1 text-sm text-[var(--pc-text-faint)] opacity-0">Saved</p>{/if}
				</div>
				<button type="button" bind:this={padCloseBtn} onclick={(e) => requestExit('/workspace', e.currentTarget)} aria-label="Close" class="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] transition-[background-color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"><CloseCircle size={18} weight="Outline" aria-hidden="true" /></button>
			</div>
			<div class="mt-5 flex gap-6 border-b border-transparent" role="tablist" aria-label="Add product sections">
				{#each [['product','Product'],['media','Media'],['launch','Launch'],['review','Review']] as [value, label]}
					<button
						type="button"
						role="tab"
						aria-selected={activeTab===value}
						onclick={() => (activeTab = value as Tab)}
						class="pb-3 text-sm font-medium tracking-[-0.01em] transition-[color,border-color] {activeTab===value ? 'border-b-2 border-[var(--pc-text)] text-[var(--pc-text)]' : 'border-b-2 border-transparent text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]'}"
					>{label}</button>
				{/each}
			</div>
		</div>

		<!-- Body scrolls -->
		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7" style="scrollbar-width: thin;">
			{#if mediaError}<p class="mx-auto mb-4 max-w-[560px] rounded-[12px] bg-[#fca5a5]/10 px-3 py-2 text-sm leading-[1.5] text-[#fca5a5]" role="alert">{mediaError} {#if mediaError.includes('Sign in')}<a href={`/auth?next=${encodeURIComponent(page.url.pathname)}`} class="underline hover:no-underline">Sign in</a>{/if}</p>{/if}
			{#if activeTab === 'product'}
				<div class="mx-auto max-w-[560px] space-y-7">
					<div class="space-y-2">
						<label for="pad-website" class="block text-sm font-medium text-[var(--pc-text-muted)]">Website</label>
						<input id="pad-website" bind:value={website} onblur={normalizeWebsiteBlur} placeholder="https://yourproduct.com" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base leading-[1.4] text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
						{#if websiteWarn}<p class="text-sm leading-[1.5] text-[var(--pc-text-muted)]">{websiteWarn}</p>{/if}
					</div>

					<div class="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
						<div class="space-y-2">
							<label for="pad-name" class="block text-sm font-medium text-[var(--pc-text-muted)]">Name</label>
							<input id="pad-name" value={name} oninput={(e) => handleNameInput((e.currentTarget as HTMLInputElement).value)} placeholder="Bento" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base font-medium text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
							{#if nameError}<p class="text-sm leading-[1.5] text-[#fca5a5]">{nameError}</p>{/if}
						</div>
						<div class="space-y-2">
							<label for="pad-slug" class="block text-sm font-medium text-[var(--pc-text-muted)]">Address</label>
							<div class="flex items-center gap-1 rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-0 transition-[background-color] focus-within:bg-[var(--pc-surface-2)]">
								<span class="shrink-0 text-sm text-[var(--pc-text-faint)]">productclient.com/</span>
								<input id="pad-slug" bind:value={slug} onfocus={() => (slugTouched = true)} onblur={checkSlugBlur} placeholder="bento" class="min-w-0 flex-1 cursor-text bg-transparent py-3 text-base text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none" />
							</div>
							{#if slugError}<p class="text-sm text-[#fca5a5]">{slugError}</p>{/if}
						</div>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between"><label for="pad-tagline" class="block text-sm font-medium text-[var(--pc-text-muted)]">Tagline</label><span class="text-sm tabular-nums text-[var(--pc-text-faint)]">{taglineCount}</span></div>
						<input id="pad-tagline" bind:value={tagline} maxlength={60} placeholder="Personal intelligence hub. Not just a launcher." class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
						{#if taglineError}<p class="text-sm leading-[1.5] text-[#fca5a5]">{taglineError}</p>{/if}
					</div>

					<div class="space-y-2">
						<label for="pad-desc" class="block text-sm font-medium text-[var(--pc-text-muted)]">What it does</label>
						<textarea id="pad-desc" bind:value={description} rows={4} maxlength={400} placeholder="One clear paragraph. What problem does it solve, who is it for?" class="w-full cursor-text resize-none rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base leading-[1.6] text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]"></textarea>
					</div>

					<div class="space-y-3">
						<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Categories</p>
						<div class="flex flex-wrap gap-2">
							{#each taxonomy as cat}
								<button type="button" onclick={() => toggleCategory(cat)} aria-pressed={categories.includes(cat)} class="rounded-full border px-3 py-1.5 text-sm font-medium transition-[background-color,color,border-color] {categories.includes(cat) ? 'border-[var(--pc-text)] bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'border-[var(--pc-border-strong)] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'}">{cat}</button>
							{/each}
						</div>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-3">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Pricing</p>
							<div class="grid grid-cols-3 gap-2">
								{#each [['free','Free'],['free_paid','Free + paid'],['paid','Paid']] as [val, label]}
									<button type="button" onclick={() => (pricing = val as Pricing)} aria-pressed={pricing===val} class="rounded-[12px] border px-2 py-3 text-center text-sm font-medium transition-[background-color,color,border-color] {pricing===val ? 'border-[var(--pc-text)] bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'border-[var(--pc-border-strong)] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'}">{label}</button>
								{/each}
							</div>
						</div>
						<div class="space-y-3">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Availability</p>
							<div class="grid grid-cols-2 gap-2">
								{#each [['live','Live now'],['coming_soon','Coming soon']] as [val, label]}
									<button type="button" onclick={() => (availability = val as Availability)} aria-pressed={availability===val} class="rounded-[12px] border px-2 py-3 text-center text-sm font-medium transition-[background-color,color,border-color] {availability===val ? 'border-[var(--pc-text)] bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'border-[var(--pc-border-strong)] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'}">{label}</button>
								{/each}
							</div>
						</div>
					</div>

					<div class="space-y-3">
						<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Platforms</p>
						<div class="flex flex-wrap gap-2">
							{#each platformOptions as plat}
								<button type="button" onclick={() => togglePlatform(plat)} aria-pressed={platforms.includes(plat)} class="rounded-full border px-3 py-1.5 text-sm font-medium transition-[background-color,color,border-color] {platforms.includes(plat) ? 'border-[var(--pc-text)] bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'border-[var(--pc-border-strong)] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)]'}">{plat}</button>
							{/each}
						</div>
					</div>

					<div class="space-y-3">
						<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Pricing summary</p>
						<input bind:value={pricingSummary} placeholder="Free plan · Pro from $12/mo" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-sm text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Pricing plans — {pricingPlans.length} tiers</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{pricingPlans.length} blocks</span>
						</div>
						{#each pricingPlans as plan, i}
							<div class="flex gap-2">
								<div class="grid flex-1 gap-2 rounded-[12px] border border-[var(--pc-border-strong)]/30 bg-[var(--pc-surface)] p-3">
									<input bind:value={plan.name} placeholder="Free" class="w-full cursor-text rounded-[8px] bg-[var(--pc-bg)] px-3 py-2 text-sm font-medium text-[var(--pc-text)] outline-none" />
									<input bind:value={plan.price} placeholder="$0" class="w-full cursor-text rounded-[8px] bg-[var(--pc-bg)] px-3 py-2 text-sm tabular-nums text-[var(--pc-text)] outline-none" />
									<input bind:value={plan.detail} placeholder="Core search and 50 AI actions a month." class="w-full cursor-text rounded-[8px] bg-[var(--pc-bg)] px-3 py-2 text-sm text-[var(--pc-text-muted)] outline-none" />
								</div>
								{#if pricingPlans.length > 1}
									<button type="button" onclick={() => (pricingPlans = pricingPlans.filter((_, idx) => idx !== i))} class="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Remove pricing plan">
										<CloseCircle size={16} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/each}
						<button
							type="button"
							use:tooltip={{ text: 'Add another pricing tier to your recipe', island: true }}
							onclick={() => (pricingPlans = [...pricingPlans, { name: '', price: '', detail: '' }])}
							class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--pc-border-strong)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--pc-text-muted)] transition-[background-color,color,border-color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] hover:border-[var(--pc-text)]/20"
						>
							<Add size={14} weight="Outline" aria-hidden="true" /> Add block
						</button>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">What it does — {capabilities.length} capabilities</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{capabilities.length} blocks</span>
						</div>
						{#each capabilities as cap, i}
							<div class="flex gap-2">
								<div class="grid flex-1 gap-2 sm:grid-cols-[1fr_1.6fr]">
									<input bind:value={cap.name} placeholder="Universal search" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3 py-2.5 text-sm font-medium text-[var(--pc-text)] outline-none focus:bg-[var(--pc-surface-2)]" />
									<input bind:value={cap.description} placeholder="One query across apps, notes, and recent files." class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3 py-2.5 text-sm text-[var(--pc-text-muted)] outline-none focus:bg-[var(--pc-surface-2)]" />
								</div>
								{#if capabilities.length > 1}
									<button type="button" onclick={() => (capabilities = capabilities.filter((_, idx) => idx !== i))} class="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Remove capability">
										<CloseCircle size={16} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/each}
						<button
							type="button"
							use:tooltip={{ text: 'Add another capability to your recipe', island: true }}
							onclick={() => (capabilities = [...capabilities, { name: '', description: '' }])}
							class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--pc-border-strong)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--pc-text-muted)] transition-[background-color,color,border-color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] hover:border-[var(--pc-text)]/20"
						>
							<Add size={14} weight="Outline" aria-hidden="true" /> Add block
						</button>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">What makes it different — {differentiators.length} items</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{differentiators.length} blocks</span>
						</div>
						{#each differentiators as diff, i}
							<div class="flex gap-2">
								<div class="grid flex-1 gap-2 sm:grid-cols-[1fr_1.6fr]">
									<input bind:value={diff.name} placeholder="Hub, not launcher" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3 py-2.5 text-sm font-medium text-[var(--pc-text)] outline-none focus:bg-[var(--pc-surface-2)]" />
									<input bind:value={diff.description} placeholder="Opens tools and also reasons across them." class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3 py-2.5 text-sm text-[var(--pc-text-muted)] outline-none focus:bg-[var(--pc-surface-2)]" />
								</div>
								{#if differentiators.length > 1}
									<button type="button" onclick={() => (differentiators = differentiators.filter((_, idx) => idx !== i))} class="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Remove differentiator">
										<CloseCircle size={16} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/each}
						<p class="text-xs text-[var(--pc-text-faint)]">Rendered as pure long text: <span class="italic">name: description</span> joined with spaces, no bullets or em dashes.</p>
						<button
							type="button"
							use:tooltip={{ text: 'Add another differentiator to your recipe', island: true }}
							onclick={() => (differentiators = [...differentiators, { name: '', description: '' }])}
							class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--pc-border-strong)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--pc-text-muted)] transition-[background-color,color,border-color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] hover:border-[var(--pc-text)]/20"
						>
							<Add size={14} weight="Outline" aria-hidden="true" /> Add block
						</button>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Who it’s for — {audienceFor.length} audience lines</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{audienceFor.length} blocks</span>
						</div>
						{#each audienceFor as _, i}
							<div class="flex gap-2">
								<input bind:value={audienceFor[i]} placeholder={['People who live in keyboard shortcuts','Teams drowning in tab sprawl','Users who want one place to ask and act'][i] ?? 'Add audience'} class="flex-1 cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-2.5 text-sm text-[var(--pc-text)] outline-none focus:bg-[var(--pc-surface-2)]" />
								{#if audienceFor.length > 1}
									<button type="button" onclick={() => (audienceFor = audienceFor.filter((__, idx) => idx !== i))} class="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Remove audience">
										<CloseCircle size={16} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/each}
						<button
							type="button"
							use:tooltip={{ text: 'Add another audience to your recipe', island: true }}
							onclick={() => (audienceFor = [...audienceFor, ''])}
							class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--pc-border-strong)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--pc-text-muted)] transition-[background-color,color,border-color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] hover:border-[var(--pc-text)]/20"
						>
							<Add size={14} weight="Outline" aria-hidden="true" /> Add block
						</button>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">How it works — {howItWorks.length} steps</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{howItWorks.length} blocks</span>
						</div>
						{#each howItWorks as _, i}
							<div class="flex gap-2">
								<input bind:value={howItWorks[i]} placeholder={['Install Bento and point it at the apps you use daily.','Hit the hotkey, then type or speak what you need.','Bento pulls context, runs the action, and stays open for follow-ups.'][i] ?? 'Add a step'} class="flex-1 cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-2.5 text-sm text-[var(--pc-text)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
								{#if howItWorks.length > 1}
									<button type="button" onclick={() => (howItWorks = howItWorks.filter((__, idx) => idx !== i))} class="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Remove step">
										<CloseCircle size={16} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/each}
						<button
							type="button"
							use:tooltip={{ text: 'Add another step to your recipe', island: true }}
							onclick={() => (howItWorks = [...howItWorks, ''])}
							class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--pc-border-strong)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--pc-text-muted)] transition-[background-color,color,border-color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] hover:border-[var(--pc-text)]/20"
						>
							<Add size={14} weight="Outline" aria-hidden="true" /> Add block
						</button>
					</div>

					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="block text-sm font-medium text-[var(--pc-text-muted)]">FAQ — {faqs.length} Q&A</p>
							<span class="text-xs text-[var(--pc-text-faint)]">{faqs.length} blocks</span>
						</div>
						{#each faqs as faq, i}
							<div class="flex gap-2">
								<div class="flex-1 space-y-2 rounded-[12px] border border-[var(--pc-border-strong)]/20 bg-[var(--pc-surface)] p-3">
									<input bind:value={faq.question} placeholder="Does Bento upload my files?" class="w-full cursor-text rounded-[8px] bg-[var(--pc-bg)] px-3 py-2 text-sm font-medium text-[var(--pc-text)] outline-none" />
									<textarea bind:value={faq.answer} rows={2} placeholder="Index and search run locally..." class="w-full cursor-text resize-none rounded-[8px] bg-[var(--pc-bg)] px-3 py-2 text-sm leading-[1.5] text-[var(--pc-text-muted)] outline-none"></textarea>
								</div>
								{#if faqs.length > 1}
									<button type="button" onclick={() => (faqs = faqs.filter((_, idx) => idx !== i))} class="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]" aria-label="Remove FAQ">
										<CloseCircle size={16} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						{/each}
						<button
							type="button"
							use:tooltip={{ text: 'Add another FAQ to your recipe', island: true }}
							onclick={() => (faqs = [...faqs, { question: '', answer: '' }])}
							class="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--pc-border-strong)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--pc-text-muted)] transition-[background-color,color,border-color] hover:bg-[var(--pc-surface)] hover:text-[var(--pc-text)] hover:border-[var(--pc-text)]/20"
						>
							<Add size={14} weight="Outline" aria-hidden="true" /> Add block
						</button>
					</div>
				</div>
			{:else if activeTab === 'media'}
				<div class="mx-auto max-w-[560px] space-y-8">
					<div class="space-y-3">
						<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Logo</p>
						<label class="flex cursor-pointer items-center gap-4 rounded-[16px] border border-dashed border-[var(--pc-border-strong)] bg-[var(--pc-surface)] p-4 transition-[background-color] hover:bg-[var(--pc-surface-2)]">
							<span class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[var(--pc-bg)] outline outline-1 -outline-offset-1 outline-white/10">
								{#if logoPreviewUrl || logoUrl}<img src={logoPreviewUrl || logoUrl} alt="" decoding="async" class="size-20 object-cover" />{:else}<ImagePlus size={22} weight="Outline" class="text-[var(--pc-text-faint)]" aria-hidden="true" />{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block text-sm font-medium text-[var(--pc-text)]">Square logo</span>
								<span class="block text-sm leading-[1.5] text-[var(--pc-text-muted)]">Drop or click to upload.</span>
							</span>
							<span class="hidden sm:inline-flex rounded-full bg-[var(--pc-bg)] px-3 py-1.5 text-sm font-medium text-[var(--pc-text)]">Upload</span>
							<input type="file" accept="image/*" class="sr-only" onchange={handleLogoChange} aria-label="Upload logo" />
						</label>
					</div>

					<div class="space-y-3">
						<p class="block text-sm font-medium text-[var(--pc-text-muted)]">Screenshots</p>
						<div class="flex gap-3 overflow-x-auto pb-2" style="scrollbar-width: thin;">
							{#each screenshots as src, i}
								<div class="relative shrink-0">
									<img src={src} alt="" loading="lazy" decoding="async" class="h-[140px] w-[220px] rounded-[12px] object-cover outline outline-1 -outline-offset-1 outline-white/10" />
									<button type="button" onclick={() => removeScreenshot(i)} class="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur"><CloseCircle size={14} weight="Outline" aria-hidden="true" /></button>
								</div>
							{/each}
							<button type="button" onclick={addScreenshotUrl} class="grid h-[140px] w-[140px] shrink-0 place-items-center rounded-[12px] border border-dashed border-[var(--pc-border-strong)] bg-[var(--pc-surface)] text-[var(--pc-text-muted)] transition-[background-color] hover:bg-[var(--pc-surface-2)]">
								<span class="flex flex-col items-center gap-1"><Add size={18} weight="Outline" aria-hidden="true" /><span class="text-sm">Add</span></span>
							</button>
						</div>
						{#if mediaError}<p class="text-sm leading-[1.5] text-[#fca5a5]" role="alert">{mediaError}</p>{:else}<p class="text-sm leading-[1.5] text-[var(--pc-text-faint)]">Publish needs one image or a video.</p>{/if}
					</div>

					<div class="space-y-2">
						<label for="pad-video" class="block text-sm font-medium text-[var(--pc-text-muted)]">Video</label>
						<input id="pad-video" bind:value={videoUrl} placeholder="https://youtube.com/watch?v=…" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
					</div>

					<div class="space-y-3">
						<p class="block text-sm font-medium text-[var(--pc-text-muted)]">More links</p>
						{#each extraLinks as link, i}
							<div class="flex items-center gap-2 rounded-[12px] bg-[var(--pc-surface)] px-3 py-2 text-sm">
								<span class="min-w-0 flex-1 truncate text-[var(--pc-text)]">{link.label} — {link.url}</span>
								<button type="button" onclick={() => removeExtraLink(i)} class="shrink-0 text-[var(--pc-text-faint)] hover:text-[var(--pc-text)]">Remove</button>
							</div>
						{/each}
						<div class="flex flex-wrap gap-2">
							<input bind:value={extraLabel} placeholder="App Store" class="min-w-[120px] flex-1 cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-2.5 text-sm text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none focus:bg-[var(--pc-surface-2)]" />
							<input bind:value={extraUrl} placeholder="https://…" class="min-w-[180px] flex-[1.6] cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-2.5 text-sm text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none focus:bg-[var(--pc-surface-2)]" />
							<button type="button" onclick={addExtraLink} class="inline-flex h-10 items-center justify-center rounded-full bg-[var(--pc-text)] px-4 text-sm font-medium text-[var(--pc-bg)]">Add</button>
						</div>
					</div>
				</div>
			{:else if activeTab === 'launch'}
				<div class="mx-auto max-w-[560px] space-y-7">
					<div class="space-y-2">
						<label for="pad-launch-title" class="block text-sm font-medium text-[var(--pc-text-muted)]">What’s new</label>
						<input id="pad-launch-title" bind:value={launchTitle} placeholder="Bento 0.4 — voice commands" class="w-full cursor-text rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base font-medium text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]" />
					</div>
					<div class="space-y-2">
						<label for="pad-launch-note" class="block text-sm font-medium text-[var(--pc-text-muted)]">Launch note</label>
						<textarea id="pad-launch-note" bind:value={launchNote} rows={5} placeholder="Short body. Maker voice." class="w-full cursor-text resize-none rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-base leading-[1.6] text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]"></textarea>
					</div>
					<label class="flex cursor-pointer items-center gap-2 text-sm text-[var(--pc-text-muted)]">
						<input type="checkbox" bind:checked={youBuiltThis} class="size-4 rounded border-[var(--pc-border-strong)] bg-[var(--pc-surface)]" />
						<span>You built this</span>
					</label>
				</div>
			{:else}
				<!-- Review — pad becomes preview -->
				<div class="mx-auto max-w-[560px] space-y-6">
					<div class="rounded-[16px] border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] p-5">
						<div class="flex items-start gap-3">
							<span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[var(--pc-bg)] outline outline-1 -outline-offset-1 outline-white/10">
								{#if logoPreviewUrl || logoUrl}<img src={logoPreviewUrl || logoUrl} alt="" class="size-11 object-cover" />{:else}<Globe size={18} weight="Outline" class="text-[var(--pc-text-faint)]" aria-hidden="true" />{/if}
							</span>
							<div class="min-w-0 flex-1">
								<h2 class="truncate text-lg font-medium tracking-[-0.01em] text-[var(--pc-text)]">{name || 'Your product'}</h2>
								<p class="mt-1 line-clamp-2 text-sm leading-[1.5] text-[var(--pc-text-muted)]">{tagline || 'Your tagline — the feed line.'}</p>
							</div>
							{#if website}<a href={website} target="_blank" rel="noopener" class="hidden shrink-0 items-center gap-1 rounded-full bg-[var(--pc-bg)] px-3 py-1.5 text-sm text-[var(--pc-accent-light)] sm:inline-flex">Visit <Link2 size={12} weight="Outline" aria-hidden="true" /></a>{/if}
						</div>
						{#if screenshots[0]}<img src={screenshots[0]} alt="" loading="lazy" decoding="async" class="mt-4 aspect-[16/9] w-full rounded-[12px] object-cover outline outline-1 -outline-offset-1 outline-white/10" />{/if}
						<div class="mt-4 flex flex-wrap gap-2 text-sm">
							{#if pricing}<span class="rounded-full bg-[var(--pc-bg)] px-2.5 py-1 text-[var(--pc-text-muted)] capitalize">{pricing.replace('_',' + ')}</span>{/if}
							{#if categories.length}<span class="rounded-full bg-[var(--pc-bg)] px-2.5 py-1 text-[var(--pc-text-muted)]">{categories[0]}</span>{/if}
							{#if availability}<span class="rounded-full bg-[var(--pc-bg)] px-2.5 py-1 text-[var(--pc-text-muted)]">{availability === 'live' ? 'Live now' : 'Coming soon'}</span>{/if}
						</div>
						{#if website}<a href={website} target="_blank" rel="noopener" class="mt-4 inline-flex text-sm text-[var(--pc-accent-light)] sm:hidden">Visit site</a>{/if}
						{#if description}<p class="mt-4 text-sm leading-[1.6] text-[var(--pc-text-muted)]">{description}</p>{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer pinned -->
		<div class="shrink-0 border-t border-[var(--pc-border-strong)]/10 bg-[var(--pc-bg)] px-6 py-4 sm:px-8">
			<div class="flex items-center justify-between gap-3">
				<div class="flex gap-2">
					{#if activeTab !== 'product'}
						<button type="button" onclick={() => (activeTab = activeTab === 'review' ? 'launch' : activeTab === 'launch' ? 'media' : 'product')} class="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] px-4 text-sm font-medium text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)]">Back</button>
					{:else}
						<button type="button" onclick={() => saveDraft()} disabled={saving} class="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] px-4 text-sm font-medium text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)] disabled:opacity-50">{saving ? 'Saving...' : 'Save draft'}</button>
					{/if}
				</div>
				<div class="flex gap-2">
					{#if activeTab !== 'review'}
						<button type="button" onclick={() => (activeTab = activeTab === 'product' ? 'media' : activeTab === 'media' ? 'launch' : 'review')} class="inline-flex h-10 items-center justify-center rounded-full bg-[var(--pc-text)] px-5 text-sm font-medium text-[var(--pc-bg)] hover:opacity-[0.88] active:scale-[0.98]">Continue</button>
					{:else}
						<button type="button" onclick={handlePublish} disabled={publishing} class="inline-flex h-10 items-center justify-center rounded-full bg-[var(--pc-text)] px-5 text-sm font-medium text-[var(--pc-bg)] hover:opacity-[0.88] active:scale-[0.98] disabled:opacity-50">
							{#if availability === 'live'}Publish launch{:else}Publish coming soon{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

{#if showExitModal}
	<!-- Exit confirm — deliberately small (max-w-[400px]): same Pad border, radius and tokens, not Pad-sized -->
	<div class="fixed inset-0 z-[70] grid place-items-center p-4">
		<button type="button" aria-label="Keep editing" onclick={() => closeExitModal()} class="absolute inset-0 cursor-default bg-black/60"></button>
		<div
			in:scale={{ start: reducedMotion ? 1 : 0.97, duration: reducedMotion ? 0 : 140, easing: cubicOut }}
			role="alertdialog"
			aria-modal="true"
			tabindex={-1}
			aria-labelledby="exit-modal-title"
			aria-describedby="exit-modal-desc"
			bind:this={exitPanel}
			onkeydown={handleExitModalKeydown}
			class="relative w-full max-w-[400px] rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] p-6 shadow-none"
			style:background="var(--pc-bg)"
		>
			<h2 id="exit-modal-title" class="text-lg font-medium tracking-[-0.01em] text-[var(--pc-text)]">{name.trim() ? `Leave "${name.trim()}" without launching?` : 'Leave without launching?'}</h2>
			<p id="exit-modal-desc" class="mt-2 text-sm leading-[1.55] text-[var(--pc-text-muted)]">Nothing is public until you hit Publish.</p>
			{#if exitModalError}<p class="mt-3 rounded-[12px] bg-[#fca5a5]/10 px-3 py-2 text-sm leading-[1.5] text-[#fca5a5]" role="alert">{exitModalError}</p>{/if}
			<div class="mt-5 flex flex-col gap-2">
				<button type="button" bind:this={keepEditingBtn} onclick={() => closeExitModal()} class="inline-flex h-10 items-center justify-center rounded-full bg-[var(--pc-text)] px-5 text-sm font-medium text-[var(--pc-bg)] hover:opacity-[0.88] active:scale-[0.98]">Keep editing</button>
				<button type="button" onclick={confirmSaveDraftAndExit} disabled={exitModalSaving} class="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] px-5 text-sm font-medium text-[var(--pc-text)] hover:bg-[var(--pc-surface-2)] disabled:opacity-50">{exitModalSaving ? 'Saving...' : 'Save as draft'}</button>
				<button type="button" onclick={confirmDiscardAndExit} disabled={exitModalSaving} class="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-[#fca5a5] hover:bg-[var(--pc-surface)] disabled:opacity-50">Discard</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* No focus rings — surface shift only */
	:global(.submit-pad input:focus), :global(.submit-pad textarea:focus), :global(.submit-pad select:focus) {
		outline: none;
		box-shadow: none;
	}
</style>
