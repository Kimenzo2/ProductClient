<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Session } from '@supabase/supabase-js';
	import { ArrowRight } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import ProductClientLogo from '$lib/components/brand/ProductClientLogo.svelte';
	import googleLogo from '$lib/assets/google-logo.svg';
	import { authCallbackUrl, readableAuthError, safeNextPath } from '$lib/auth/utils';
	import { authHref, appHref, openBlankTab, completeAppHandoff } from '$lib/auth/urls';
	import { supabase } from '$lib/supabaseClient';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let formError = $state('');
	let busy = $state(false);
	let formEl = $state<HTMLFormElement | undefined>(undefined);
	let next = $derived(safeNextPath(page.url.searchParams.get('next'), '/workspace'));

	function continueToApp(path: string, session?: Session | null, appTab: Window | null = null): void {
		const destination = appHref(path, session ?? undefined);
		if (!destination.startsWith('http')) {
			appTab?.close();
			void goto(destination, { replaceState: true });
			return;
		}
		// Cross-origin handoff: the app dashboard opens in the tab captured
		// during the click, so this page stays open. Same-tab fallback when
		// popups are blocked (e.g. background auto-continue with no gesture).
		completeAppHandoff(appTab, destination);
	}

	onMount(() => {
		if (!supabase) {
			formError = 'Service is temporarily unavailable. Please try again.';
			return;
		}
		void supabase.auth.getSession().then(({ data }) => {
			if (data.session) continueToApp(next, data.session);
		});
	});

	function validate(): boolean {
		emailError = email.trim() ? '' : 'Enter your email address.';
		passwordError = password ? '' : 'Enter your password.';
		if (emailError || passwordError) {
			formEl?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
			return false;
		}
		return true;
	}

	async function signIn() {
		formError = '';
		if (!validate() || !supabase) return;
		// Capture the tab inside the submit gesture — anything opened after
		// the await below gets eaten by the popup blocker.
		const appTab = openBlankTab();
		busy = true;
		const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
		if (error) {
			appTab?.close();
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		continueToApp(next, data.session, appTab);
	}

	async function signInWithGoogle() {
		formError = '';
		if (!supabase) {
			formError = 'Service is temporarily unavailable. Please try again.';
			return;
		}
		busy = true;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: authCallbackUrl(next) }
		});
		if (error) {
			formError = readableAuthError(error);
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in | Product Client</title>
	<meta name="description" content="Sign in to your Product Client workspace." />
</svelte:head>

<section class="auth-page" aria-labelledby="sign-in-title">
	<div class="auth-intro">
		<div class="auth-icon"><ProductClientLogo size={32} alt="ProductClient" /></div>
		<h1 id="sign-in-title" class="text-wrap-balance">Welcome back</h1>
		<p>Sign in to continue.</p>
	</div>

	{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}

	<Button type="button" variant="outline" size="lg" class="google-button" onclick={() => void signInWithGoogle()} disabled={busy}>
		<img src={googleLogo} alt="" width="18" height="18" class="block shrink-0" aria-hidden="true" />
		Continue with Google
	</Button>

	<div class="auth-divider" aria-hidden="true"><span></span><em>or</em><span></span></div>

	<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); void signIn(); }} novalidate>
		<AuthInput id="sign-in-email" label="Email address" name="email" type="email" autocomplete="username" placeholder="you@company.com" bind:value={email} error={emailError} required disabled={busy} />
		<AuthInput id="sign-in-password" label="Password" name="password" type="password" autocomplete="current-password" placeholder="Your password" bind:value={password} error={passwordError} required disabled={busy} />
		<Button type="submit" size="lg" loading={busy} class="auth-primary">Sign in <ArrowRight size={16} weight="Outline" /></Button>
	</form>

	<div class="auth-links">
		<a href={authHref('forgot-password')}>Forgot your password?</a>
		<p>New to Product Client? <a href={authHref('sign-up')}>Create an account</a></p>
	</div>
</section>

<style>
	.auth-page { display: grid; gap: 14px; }.auth-intro { display: grid; gap: 6px; }.auth-icon { display: grid; place-items: center; width: 32px; height: 32px; margin-bottom: 2px; border-radius: 9px; overflow: hidden; background: transparent; }.auth-intro h1 { margin: 0; font-size: clamp(26px, 4vw, 36px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; text-wrap: balance; }.auth-intro > p:last-child { margin: 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.5; max-width: 32ch; overflow-wrap: break-word; }.form-error { margin: 0; padding: 10px 12px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; overflow-wrap: break-word; }.auth-page form { display: grid; gap: 12px; }.auth-divider { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; color: var(--pc-text-faint); }.auth-divider span { height: 1px; background: var(--pc-border-strong); }.auth-divider em { font-size: 11px; font-style: normal; }.auth-links { display: grid; gap: 10px; margin-top: 1px; text-align: center; }.auth-links a { color: var(--pc-text-muted); font-size: 12px; overflow-wrap: break-word; }.auth-links a:hover { color: var(--pc-text); }.auth-links p { margin: 0; color: var(--pc-text-faint); font-size: 12px; overflow-wrap: break-word; }.auth-links p a { color: var(--pc-text); font-weight: 500; }
	:global(.auth-primary), :global(.google-button) { width: 100%; min-height: 44px; gap: 8px; }
	:global(.google-button) { border: 1px solid rgba(251, 251, 251, .18); }
</style>