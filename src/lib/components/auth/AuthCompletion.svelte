<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { type EmailOtpType, type Session } from '@supabase/supabase-js';
	import { ArrowRight, CheckCircle, Lock } from 'reicon-svelte';
	import { Button } from '$lib/components/ui';
	import { readableAuthError, safeNextPath } from '$lib/auth/utils';
	import { appHref, authHref } from '$lib/auth/urls';
	import { supabase } from '$lib/supabaseClient';

	let { mode = 'callback' }: { mode?: 'callback' | 'confirm' } = $props();
	let status = $state<'checking' | 'error'>('checking');
	let message = $state('');

	onMount(() => {
		if (!supabase) {
			status = 'error';
			message = 'Supabase is not configured for this app.';
			return;
		}

		const next = safeNextPath(page.url.searchParams.get('next'), mode === 'confirm' ? '/reset-password' : '/workspace');
		let redirected = false;
		const redirectIfSignedIn = (session: Session | null) => {
			if (!session || redirected) return;
			redirected = true;
			const destination = mode === 'confirm' ? authHref('reset-password') : appHref(next, session);
			if (destination.startsWith('http')) {
				window.location.assign(destination);
			} else {
				void goto(destination, { replaceState: true });
			}
		};
		const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => redirectIfSignedIn(session));
		const timeout = window.setTimeout(() => {
			if (!redirected) {
				status = 'error';
				message = 'This sign-in link is missing or has expired. Start again.';
			}
		}, 6000);

		void (async () => {
			let authError: Error | null = null;
			if (mode === 'callback') {
				const code = page.url.searchParams.get('code');
				if (code) {
					const result = await supabase.auth.exchangeCodeForSession(code);
					authError = result.error;
				}
			} else {
				const tokenHash = page.url.searchParams.get('token_hash');
				const type = page.url.searchParams.get('type') as EmailOtpType | null;
				if (tokenHash && type) {
					const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
					authError = result.error;
				} else {
					authError = new Error('Missing confirmation details');
				}
			}

			if (authError) {
				status = 'error';
				message = readableAuthError(authError);
				return;
			}

			const { data } = await supabase.auth.getSession();
			redirectIfSignedIn(data.session);
		})();

		return () => {
			window.clearTimeout(timeout);
			authListener.subscription.unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>{mode === 'confirm' ? 'Confirm your email' : 'Signing you in'} | Product Client</title>
	<meta name="description" content="Finish signing in to Product Client." />
</svelte:head>

<section class="completion" aria-live="polite">
	<div class="completion-icon" class:error={status === 'error'}>
		{#if status === 'checking'}
			<span class="completion-spinner" aria-hidden="true"></span>
		{:else}
			<Lock size={22} weight="Outline" />
		{/if}
	</div>
	
	<h1>{status === 'checking' ? 'Finishing your sign-in' : 'We could not finish signing you in'}</h1>
	<p class="description">{status === 'checking' ? 'We are checking the link and opening your workspace.' : message}</p>
	{#if status === 'error'}
		<div class="completion-actions">
			<Button href={authHref('login')} size="lg"><ArrowRight size={16} weight="Outline" /> Start again</Button>
			<a href={authHref('forgot-password')}>Reset your password</a>
		</div>
	{:else}
		<div class="completion-note"><CheckCircle size={15} weight="Outline" /> Your session is being secured</div>
	{/if}
</section>

<style>
	.completion { max-width: 420px; margin: 0 auto; text-align: center; }.completion-icon { display: grid; place-items: center; width: 58px; height: 58px; margin: 0 auto 23px; border-radius: 18px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }.completion-icon.error { color: #f09b9b; background: rgba(224, 122, 122, .12); }.completion-spinner { width: 20px; height: 20px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: completion-spin .8s linear infinite; }.completion h1 { margin: 0; color: var(--pc-text); font-size: clamp(28px, 4vw, 38px); font-weight: 500; line-height: 1.06; letter-spacing: -.055em; }.description { max-width: 38ch; margin: 15px auto 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.6; }.completion-actions { display: grid; gap: 18px; margin-top: 28px; }.completion-actions a { color: var(--pc-text-muted); font-size: 13px; }.completion-actions a:hover { color: var(--pc-text); }.completion-note { display: inline-flex; align-items: center; gap: 8px; margin-top: 28px; color: var(--pc-text-faint); font-size: 12px; }@keyframes completion-spin { to { transform: rotate(360deg); } }@media (prefers-reduced-motion: reduce) { .completion-spinner { animation: none; } }
</style>
