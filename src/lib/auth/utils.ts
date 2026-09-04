import type { AuthError } from '@supabase/supabase-js';
import { authHref } from '$lib/auth/urls';

export function safeNextPath(value: string | null | undefined, fallback = '/workspace'): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/auth')) return fallback;
	return value;
}

export function authCallbackUrl(next: string): string {
	const callback = new URL(authHref('callback'), window.location.origin);
	callback.searchParams.set('next', safeNextPath(next));
	return callback.toString();
}

export function passwordError(password: string, confirmation?: string): string {
	if (password.length < 8) return 'Use a password with at least 8 characters.';
	if (confirmation !== undefined && password !== confirmation) return 'Passwords do not match.';
	return '';
}

export function readableAuthError(error: AuthError | Error | unknown): string {
	const message = error instanceof Error ? error.message.toLowerCase() : '';
	if (message.includes('invalid login credentials')) return 'Email or password is not correct.';
	if (message.includes('email not confirmed')) return 'Confirm your email address before signing in.';
	if (message.includes('user already registered')) return 'An account with this email already exists. Sign in instead.';
	if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Wait a moment and try again.';
	if (message.includes('password')) return 'Choose a different password and try again.';
	return 'Unable to complete that request. Check your details and try again.';
}

export function isSupabaseConfigured(): boolean {
	return Boolean(import.meta.env);
}
