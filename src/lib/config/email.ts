// Central email helpers — mirrors Cloudflare Email Routing for productclient.com
// View in dash: dash.cloudflare.com/17c310890f1b07850d4ff05a3c1e3813/email-service/routing/productclient.com
// All 7 routes forward to otienolorenzo704@gmail.com (Catch-all Disabled).
// noreply is transactional — ContactEmailKey excludes it so it can never be a contact destination.
// billing@ has no Cloudflare route — always contact support with a billing subject instead.
// NOTE: keep in sync with P-Landing's src/lib/config/email.ts (same file, same contract).

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

// Contact-safe inbox keys — noreply excluded at compile time.
export type ContactEmailKey = Exclude<EmailKey, 'noreply'>;

// RFC 6068 mailto builder:
// - spaces encoded as %20 via encodeURIComponent (never `+`: URLSearchParams
//   form-encoding is ambiguous in mailto, where `+` can mean a literal plus)
// - body line breaks normalized to CRLF (%0D%0A, required by RFC 6068 §5)
// - inputs trimmed; empty subject/body omitted. Keep bodies short — Outlook
//   truncates mailto URLs past ~2,000 chars, so stay well under that.
// - pass raw text, never pre-encoded (a literal `%20` would double-encode).
// - empty recipient throws: a silent `mailto:` dead link is worse than a loud error.
export function mailto(email: string, subject?: string, body?: string): string {
	const to = email.trim();
	if (!to) throw new Error('mailto: recipient is required');
	const parts: string[] = [];
	const cleanSubject = subject?.trim();
	if (cleanSubject) parts.push(`subject=${encodeURIComponent(cleanSubject)}`);
	const cleanBody = body?.trim();
	if (cleanBody) parts.push(`body=${encodeURIComponent(cleanBody.replace(/\r\n|\r|\n/g, '\r\n'))}`);
	return parts.length > 0 ? `mailto:${to}?${parts.join('&')}` : `mailto:${to}`;
}

// Typed contact link — guarantees the destination is a real monitored inbox, never noreply.
export function contactMailto(key: ContactEmailKey, subject?: string, body?: string): string {
	return mailto(EMAILS[key], subject, body);
}

// Convenience: Support with prefilled subject for faster triage
export function supportMailto(subject = 'Help with ProductClient'): string {
	return contactMailto('support', subject);
}
