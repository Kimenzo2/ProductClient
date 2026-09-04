<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, ArrowRight, Mailbox } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import { readableAuthError } from '$lib/auth/utils';
	import { authHref } from '$lib/auth/urls';
	import { supabase } from '$lib/supabaseClient';

	let email = $state('');
	let emailError = $state('');
	let formError = $state('');
	let sent = $state(false);
	let busy = $state(false);
	let formEl = $state<HTMLFormElement | undefined>(undefined);

	onMount(() => {
		if (!supabase) formError = 'Supabase is not configured for this app.';
	});

	async function sendResetLink() {
		formError = '';
		emailError = email.trim() ? '' : 'Enter your email address.';
		if (emailError) {
			formEl?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
			return;
		}
		if (!supabase) return;
		busy = true;
		const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
			redirectTo: authHref('reset-password')
		});
		if (error) {
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		sent = true;
		busy = false;
	}
</script>

<svelte:head>
	<title>Reset your password | Product Client</title>
	<meta name="description" content="Reset your Product Client password." />
</svelte:head>

{#if sent}
	<section class="auth-page confirmation" aria-labelledby="reset-sent-title">
		<div class="auth-icon"><Mailbox size={19} weight="Outline" /></div>
		
		<h1 id="reset-sent-title">Your reset link is on its way</h1>
		<p>If an account uses <strong>{email}</strong>, we sent instructions to reset its password.</p>
		<Button href={authHref('login')} size="lg" class="auth-primary"><ArrowLeft size={16} weight="Outline" /> Back to sign in</Button>
		<p class="small-note">The link expires for your security. Check your spam folder if it does not arrive.</p>
	</section>
{:else}
	<section class="auth-page" aria-labelledby="forgot-title">
		<div class="auth-intro">
			<div class="auth-icon"><Mailbox size={19} weight="Outline" /></div>
			
			<h1 id="forgot-title">Reset your password</h1>
			<p>Enter your email and we will send you a reset link.</p>
		</div>

		{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}
		<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); void sendResetLink(); }} novalidate>
			<AuthInput id="forgot-email" label="Email address" name="email" type="email" autocomplete="email" placeholder="you@company.com" bind:value={email} error={emailError} required disabled={busy} />
			<Button type="submit" size="lg" loading={busy} class="auth-primary">Send reset link <ArrowRight size={16} weight="Outline" /></Button>
		</form>
		<div class="auth-links"><a href={authHref('login')}><ArrowLeft size={14} weight="Outline" /> Back to sign in</a></div>
	</section>
{/if}

<style>
	.auth-page { display: grid; gap: 22px; }.auth-intro { display: grid; gap: 9px; }.auth-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 9px; border-radius: 13px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.auth-intro h1, .confirmation h1 { margin: 0; font-size: clamp(29px, 4vw, 42px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; }.auth-intro > p:last-child, .confirmation > p:not(.auth-eyebrow):not(.small-note) { margin: 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; }.form-error { margin: 0; padding: 11px 13px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; }.auth-page form { display: grid; gap: 16px; }.auth-links { display: flex; justify-content: center; }.auth-links a { display: inline-flex; align-items: center; gap: 7px; color: var(--pc-text-muted); font-size: 12px; }.auth-links a:hover { color: var(--pc-text); }.confirmation { text-align: center; }.confirmation .auth-icon { margin-inline: auto; }.confirmation h1 { margin: 0; }.confirmation strong { color: var(--pc-text); font-weight: 500; }.small-note { max-width: 38ch; margin: 0 auto; color: var(--pc-text-faint); font-size: 12px; line-height: 1.5; }
	:global(.auth-primary) { width: 100%; min-height: 48px; }
	:global(.confirmation .auth-primary) { margin-top: 4px; }
</style>
