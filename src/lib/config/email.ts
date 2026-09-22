// Central email helpers — mirrors Cloudflare Email Routing for productclient.com
// View in dash: dash.cloudflare.com/17c310890f1b07850d4ff05a3c1e3813/email-service/routing/productclient.com
// All 7 routes forward to otienolorenzo704@gmail.com (Catch-all Disabled). noreply is transactional — never display as contact.
// billing@ has no Cloudflare route — always contact support with a billing subject instead.

export const EMAIL_DOMAIN = 'productclient.com';

export const EMAILS = {
	support: `support@${EMAIL_DOMAIN}`,
	hello: `hello@${EMAIL_DOMAIN}`,
	legal: `legal@${EMAIL_DOMAIN}`,
	privacy: `privacy@${EMAIL_DOMAIN}`,
	security: `security@${EMAIL_DOMAIN}`,
	abuse: `abuse@${EMAIL_DOMAIN}`,
	noreply: `noreply@${EMAIL_DOMAIN}`
} as const;

export type EmailKey = keyof typeof EMAILS;

// mailto: helper — subject/body optional, encoded
export function mailto(email: string, subject?: string, body?: string): string {
	let href = `mailto:${email}`;
	const params = new URLSearchParams();
	if (subject) params.set('subject', subject);
	if (body) params.set('body', body);
	const qs = params.toString();
	return qs ? `${href}?${qs}` : href;
}

// Convenience: Support with prefilled subject for faster triage
export function supportMailto(subject = 'Help with ProductClient'): string {
	return mailto(EMAILS.support, subject);
}
