<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowRight, Lock } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import { passwordError, readableAuthError } from '$lib/auth/utils';
	import { authHref } from '$lib/auth/urls';
	import { supabase } from '$lib/supabaseClient';

	let password = $state('');
	let confirmation = $state('');
	let passwordFieldError = $state('');
	let confirmationError = $state('');
	let formError = $state('');
	let busy = $state(false);
	let formEl = $state<HTMLFormElement | undefined>(undefined);

	onMount(() => {
		if (!supabase) formError = 'Supabase is not configured for this app.';
	});

	function validate(): boolean {
		const message = passwordError(password, confirmation);
		passwordFieldError = message && !message.includes('match') ? message : '';
		confirmationError = message.includes('match') ? message : '';
		if (passwordFieldError || confirmationError) {
			formEl?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
			return false;
		}
		return true;
	}

	async function updatePassword() {
		formError = '';
		if (!validate() || !supabase) return;
		busy = true;
		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			formError = readableAuthError(error);
			busy = false;
			return;
		}
		await goto('/workspace', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Choose a new password | Product Client</title>
	<meta name="description" content="Choose a new Product Client password." />
</svelte:head>

<section class="auth-page" aria-labelledby="reset-title">
	<div class="auth-intro">
		<div class="auth-icon"><Lock size={18} weight="Outline" /></div>
		
		<h1 id="reset-title">Choose a new password</h1>
		<p>Use a password you have not used here before.</p>
	</div>

	{#if formError}<p class="form-error" role="alert">{formError}</p>{/if}
	<form bind:this={formEl} onsubmit={(event) => { event.preventDefault(); void updatePassword(); }} novalidate>
		<AuthInput id="reset-password" label="New password" name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" bind:value={password} error={passwordFieldError} hint="Use 8 or more characters." required disabled={busy} />
		<AuthInput id="reset-confirmation" label="Confirm new password" name="password-confirmation" type="password" autocomplete="new-password" placeholder="Enter it again" bind:value={confirmation} error={confirmationError} required disabled={busy} />
		<Button type="submit" size="lg" loading={busy} class="auth-primary">Save new password <ArrowRight size={16} weight="Outline" /></Button>
	</form>
	<div class="auth-links"><a href={authHref('login')}>Back to sign in</a></div>
</section>

<style>
	.auth-page { display: grid; gap: 22px; }.auth-intro { display: grid; gap: 9px; }.auth-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 9px; border-radius: 13px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.auth-intro h1 { margin: 0; font-size: clamp(29px, 4vw, 42px); font-weight: 500; line-height: 1.02; letter-spacing: -.06em; }.auth-intro > p:last-child { margin: 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; }.form-error { margin: 0; padding: 11px 13px; border: 1px solid rgba(224, 122, 122, .32); border-radius: 12px; color: #f09b9b; background: rgba(224, 122, 122, .08); font-size: 12px; line-height: 1.45; }.auth-page form { display: grid; gap: 16px; }.auth-links { display: flex; justify-content: center; }.auth-links a { color: var(--pc-text-muted); font-size: 12px; }.auth-links a:hover { color: var(--pc-text); }
	:global(.auth-primary) { width: 100%; min-height: 48px; }
</style>
