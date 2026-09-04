<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowRight, Lock } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import { authCallbackUrl, readableAuthError, safeNextPath } from '$lib/auth/utils';
	import { authHref, appHref } from '$lib/auth/urls';
	import { supabase } from '$lib/supabaseClient';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let formError = $state('');
	let busy = $state(false);
	let formEl = $state<HTMLFormElement | undefined>(undefined);
	let next = $derived(safeNextPath(page.url.searchParams.get('next'), '/workspace'));

	function continueToApp(path: string): void {
		const destination = appHref(path);
		if (destination.startsWith('http')) {
			window.location.assign(destination);
			return;
		}
		void goto(destination, { replaceState: true });
	}

	onMount(() => {
		if (!supabase) {
			formError = 'Supabase is not configured for this app.';
			return;
		}
		void supabase.auth.getSession().then(({ data }) => {
			if (data.session) continueToApp(next);
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
		busy = true;
		const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
		if (error) {
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		continueToApp(next);
	}

	async function signInWithGoogle() {
		formError = '';
		if (!supabase) {
			formError = 'Supabase is not configured for this app.';
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
		<div class="auth-icon"><Lock size={18} weight="Outline" /></div>
		
		<h1 id="sign-in-title">Welcome back</h1>
		<p>Sign in to your product workspace.</p>
	</div>

	{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}

	<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); void signIn(); }} novalidate>
		<AuthInput id="sign-in-email" label="Email address" name="email" type="email" autocomplete="username" placeholder="you@company.com" bind:value={email} error={emailError} required disabled={busy} />
		<AuthInput id="sign-in-password" label="Password" name="password" type="password" autocomplete="current-password" placeholder="Your password" bind:value={password} error={passwordError} required disabled={busy} />
		<Button type="submit" size="lg" loading={busy} class="auth-primary">Sign in <ArrowRight size={16} weight="Outline" /></Button>
	</form>

	<div class="auth-divider" aria-hidden="true"><span></span><em>or</em><span></span></div>

	<Button type="button" variant="outline" size="lg" class="google-button" onclick={() => void signInWithGoogle()} disabled={busy}>
		<span class="google-mark" aria-hidden="true">G</span>
		Continue with Google
	</Button>

	<div class="auth-links">
		<a href={authHref('forgot-password')}>Forgot your password?</a>
		<p>New to Product Client? <a href={authHref('sign-up')}>Create an account</a></p>
	</div>
</section>

<style>
	.auth-page { display: grid; gap: 22px; }.auth-intro { display: grid; gap: 9px; }.auth-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 9px; border-radius: 13px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.auth-intro h1 { margin: 0; font-size: clamp(30px, 4vw, 43px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; }.auth-intro > p:last-child { margin: 0; color: var(--pc-text-muted); font-size: 14px; }.form-error { margin: 0; padding: 11px 13px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; }.auth-page form { display: grid; gap: 16px; }.auth-divider { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; color: var(--pc-text-faint); }.auth-divider span { height: 1px; background: var(--pc-border-strong); }.auth-divider em { font-size: 11px; font-style: normal; }.google-mark { display: grid; place-items: center; width: 20px; height: 20px; color: #f4c542; font-size: 16px; font-weight: 700; line-height: 1; }.auth-links { display: grid; gap: 15px; margin-top: 1px; text-align: center; }.auth-links a { color: var(--pc-text-muted); font-size: 12px; }.auth-links a:hover { color: var(--pc-text); }.auth-links p { margin: 0; color: var(--pc-text-faint); font-size: 12px; }.auth-links p a { color: var(--pc-text); font-weight: 500; }
	:global(.auth-primary), :global(.google-button) { width: 100%; min-height: 48px; }
	:global(.google-button) { border: 1px solid rgba(251, 251, 251, .18); }
</style>
