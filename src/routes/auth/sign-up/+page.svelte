<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowRight, Rocket } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import { authCallbackUrl, passwordError, readableAuthError } from '$lib/auth/utils';
	import { supabase } from '$lib/supabaseClient';

	let email = $state('');
	let password = $state('');
	let confirmation = $state('');
	let emailError = $state('');
	let passwordFieldError = $state('');
	let confirmationError = $state('');
	let formError = $state('');
	let confirmationSent = $state(false);
	let busy = $state(false);
	let formEl = $state<HTMLFormElement | undefined>(undefined);

	onMount(() => {
		if (!supabase) formError = 'Supabase is not configured for this app.';
	});

	function validate(): boolean {
		emailError = email.trim() ? '' : 'Enter your email address.';
		const passwordMessage = passwordError(password);
		passwordFieldError = passwordMessage && !passwordMessage.includes('match') ? passwordMessage : '';
		confirmationError = passwordMessage.includes('match') ? passwordMessage : '';
		if (emailError || passwordFieldError || confirmationError) {
			formEl?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
			return false;
		}
		return true;
	}

	async function createAccount() {
		formError = '';
		if (!validate() || !supabase) return;
		busy = true;
		const { data, error } = await supabase.auth.signUp({
			email: email.trim(),
			password,
			options: { emailRedirectTo: authCallbackUrl('/onboarding/profile') }
		});
		if (error) {
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		if (data.session) {
			await goto('/onboarding/profile', { replaceState: true });
			return;
		}
		confirmationSent = true;
		busy = false;
	}

	async function createAccountWithGoogle() {
		formError = '';
		if (!supabase) {
			formError = 'Supabase is not configured for this app.';
			return;
		}
		busy = true;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: authCallbackUrl('/onboarding/profile') }
		});
		if (error) {
			formError = readableAuthError(error);
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Create an account | Product Client</title>
	<meta name="description" content="Create your Product Client account." />
</svelte:head>

{#if confirmationSent}
	<section class="auth-page confirmation" aria-labelledby="confirmation-title">
		<div class="auth-icon"><Rocket size={18} weight="Outline" /></div>
		<p class="auth-eyebrow">Check your inbox</p>
		<h1 id="confirmation-title">Confirm your email</h1>
		<p>We sent a confirmation link to <strong>{email}</strong>. Open it to continue setting up your workspace.</p>
		<Button href="/auth" size="lg" class="auth-primary">Back to sign in <ArrowRight size={16} weight="Outline" /></Button>
		<p class="small-note">The link may take a minute to arrive. Check your spam folder if you do not see it.</p>
	</section>
{:else}
	<section class="auth-page" aria-labelledby="sign-up-title">
		<div class="auth-intro">
			<div class="auth-icon"><Rocket size={18} weight="Outline" /></div>
			<p class="auth-eyebrow">Product Client</p>
			<h1 id="sign-up-title">Create your account</h1>
			<p>Set up one place for your product work.</p>
		</div>

		{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}

		<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); void createAccount(); }} novalidate>
			<AuthInput id="sign-up-email" label="Email address" name="email" type="email" autocomplete="email" placeholder="you@company.com" bind:value={email} error={emailError} required disabled={busy} />
			<AuthInput id="sign-up-password" label="Password" name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" bind:value={password} error={passwordFieldError} hint="Use 8 or more characters." required disabled={busy} />
			<AuthInput id="sign-up-confirmation" label="Confirm password" name="password-confirmation" type="password" autocomplete="new-password" placeholder="Enter it again" bind:value={confirmation} error={confirmationError} required disabled={busy} />
			<Button type="submit" size="lg" loading={busy} class="auth-primary">Create account <ArrowRight size={16} weight="Outline" /></Button>
		</form>

		<div class="auth-divider" aria-hidden="true"><span></span><em>or</em><span></span></div>

		<Button type="button" variant="outline" size="lg" class="google-button" onclick={() => void createAccountWithGoogle()} disabled={busy}>
			<span class="google-mark" aria-hidden="true">G</span>
			Continue with Google
		</Button>

		<div class="auth-links"><p>Already have an account? <a href="/auth">Sign in</a></p></div>
	</section>
{/if}

<style>
	.auth-page { display: grid; gap: 22px; }.auth-intro { display: grid; gap: 9px; }.auth-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 9px; border-radius: 13px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.auth-eyebrow { margin: 0; color: var(--pc-accent-light); font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }.auth-intro h1, .confirmation h1 { margin: 0; font-size: clamp(30px, 4vw, 43px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; }.auth-intro > p:last-child, .confirmation > p:not(.auth-eyebrow):not(.small-note) { margin: 0; color: var(--pc-text-muted); font-size: 14px; }.form-error { margin: 0; padding: 11px 13px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; }.auth-page form { display: grid; gap: 16px; }.auth-divider { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; color: var(--pc-text-faint); }.auth-divider span { height: 1px; background: var(--pc-border-strong); }.auth-divider em { font-size: 11px; font-style: normal; }.google-mark { display: grid; place-items: center; width: 20px; height: 20px; color: #f4c542; font-size: 16px; font-weight: 700; line-height: 1; }.auth-links { display: grid; gap: 15px; margin-top: 1px; text-align: center; }.auth-links a { color: var(--pc-text); font-size: 12px; font-weight: 500; }.auth-links a:hover { color: var(--pc-accent-light); }.auth-links p { margin: 0; color: var(--pc-text-faint); font-size: 12px; }.confirmation { text-align: center; }.confirmation .auth-icon { margin-inline: auto; }.confirmation h1 { margin: 0; }.confirmation strong { color: var(--pc-text); font-weight: 500; }.small-note { max-width: 38ch; margin: 0 auto; color: var(--pc-text-faint); font-size: 12px; line-height: 1.5; }
	:global(.auth-primary), :global(.google-button) { width: 100%; min-height: 48px; }
	:global(.google-button) { border: 1px solid rgba(251, 251, 251, .18); }
	:global(.confirmation .auth-primary) { margin-top: 4px; }
</style>
