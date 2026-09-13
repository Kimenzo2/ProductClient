import { env as privateEnv } from '$env/dynamic/private';
import { createHmac, createSign, timingSafeEqual } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

// Env helpers — server-only
function env(name: string): string | undefined {
	return (privateEnv as Record<string, string | undefined>)[name];
}

function getAppId(): string {
	const id = env('GITHUB_APP_ID');
	if (!id) throw new Error('Missing GITHUB_APP_ID');
	return id;
}

function getPrivateKey(): string {
	let key = env('GITHUB_APP_PRIVATE_KEY');
	if (key) {
		// support \n escaped
		if (key.includes('\\n')) key = key.replace(/\\n/g, '\n');
		if (key.includes('"')) key = key.replace(/"/g, '');
		return key.trim();
	}
	// fallback: local pem file downloaded by user (dev only)
	const fallbackPaths = [
		'C:\\Users\\admin\\Downloads\\product-client.2026-09-13.private-key.pem',
		'./product-client.private-key.pem'
	];
	for (const p of fallbackPaths) {
		try {
			if (existsSync(p)) return readFileSync(p, 'utf-8').trim();
		} catch {}
	}
	throw new Error('Missing GITHUB_APP_PRIVATE_KEY (set env or place pem at fallback)');
}

export function getWebhookSecret(): string {
	const s = env('GITHUB_APP_WEBHOOK_SECRET');
	if (!s) throw new Error('Missing GITHUB_APP_WEBHOOK_SECRET');
	return s;
}

export function getAppSlug(): string {
	return env('GITHUB_APP_SLUG') ?? 'product-client';
}

function base64url(input: string | Buffer): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

function base64urlJson(obj: unknown): string {
	return base64url(JSON.stringify(obj));
}

/**
 * Create a GitHub App JWT (RFC 7519) — iss = app id, RS256, iat -60s, exp + 9min (<10min)
 */
export function createAppJWT(): string {
	const appId = getAppId();
	const privateKey = getPrivateKey();
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'RS256', typ: 'JWT' };
	const payload = { iss: appId, iat: now - 60, exp: now + 540 };
	const headerB64 = base64urlJson(header);
	const payloadB64 = base64urlJson(payload);
	const data = `${headerB64}.${payloadB64}`;
	const signer = createSign('RSA-SHA256');
	signer.update(data);
	signer.end();
	const signature = signer.sign(privateKey);
	const sigB64 = base64url(signature);
	return `${data}.${sigB64}`;
}

/**
 * Exchange App JWT for installation access token.
 * Caches in memory until expires_at (with 60s leeway). Do NOT persist beyond process.
 */
const tokenCache = new Map<bigint | number, { token: string; expiresAt: number }>();

export async function getInstallationToken(installationId: bigint | number): Promise<string> {
	const cached = tokenCache.get(installationId);
	if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;

	const jwt = createAppJWT();
	const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${jwt}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`GitHub installation token failed ${res.status}: ${text}`);
	}
	const data = (await res.json()) as { token: string; expires_at: string };
	const expiresAt = new Date(data.expires_at).getTime();
	tokenCache.set(installationId, { token: data.token, expiresAt });
	return data.token;
}

/**
 * Verify webhook signature HMAC-SHA256
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | null, secret: string): boolean {
	if (!signatureHeader) return false;
	const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
	const a = Buffer.from(expected);
	const b = Buffer.from(signatureHeader);
	if (a.length !== b.length) return false;
	try {
		return timingSafeEqual(a, b);
	} catch {
		let r = 0;
		for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
		return r === 0;
	}
}

export const verifyWebhookSignatureSync = verifyWebhookSignature;

/**
 * State signing for install flow — prevents CSRF + binds product_id to maker.
 * state = base64url(JSON) + "." + hmac
 */
function getStateSecret(): string {
	return env('GITHUB_STATE_SECRET') ?? getWebhookSecret();
}

export function signState(payload: Record<string, unknown>): string {
	const secret = getStateSecret();
	const json = JSON.stringify(payload);
	const b64 = base64url(json);
	const sig = createHmac('sha256', secret).update(b64).digest('hex');
	return `${b64}.${sig}`;
}

export function verifyState(state: string): Record<string, unknown> | null {
	const secret = getStateSecret();
	const idx = state.lastIndexOf('.');
	if (idx === -1) return null;
	const b64 = state.slice(0, idx);
	const sig = state.slice(idx + 1);
	const expected = createHmac('sha256', secret).update(b64).digest('hex');
	const a = Buffer.from(expected);
	const b = Buffer.from(sig);
	if (a.length !== b.length) return null;
	try {
		if (!timingSafeEqual(a, b)) return null;
	} catch {
		let r = 0;
		for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
		if (r !== 0) return null;
	}
	try {
		const json = Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return null;
	}
}

export function getInstallUrl(state: string): string {
	const override = env('GITHUB_APP_INSTALL_URL');
	if (override) return `${override}${override.includes('?') ? '&' : '?'}state=${encodeURIComponent(state)}`;
	const slug = getAppSlug().replace(/^https:\/\/github\.com\/apps\//, '').replace(/\/$/, '');
	return `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`;
}

// GitHub API helpers
export async function listInstallationRepos(installationId: bigint | number): Promise<Array<{ id: number; full_name: string; private: boolean; default_branch: string; updated_at?: string }>> {
	const token = await getInstallationToken(installationId);
	const res = await fetch('https://api.github.com/installation/repositories?per_page=100', {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	if (!res.ok) {
		const t = await res.text().catch(() => '');
		throw new Error(`list repos failed ${res.status}: ${t}`);
	}
	const data = (await res.json()) as { repositories: Array<{ id: number; full_name: string; private: boolean; default_branch: string; updated_at?: string }> };
	return data.repositories;
}

export async function getRepoTree(
	installationId: bigint | number,
	repoFullName: string,
	branch: string,
	docsPath: string
): Promise<{ sha: string; files: Array<{ path: string; sha: string; size: number }> }> {
	const token = await getInstallationToken(installationId);
	// get branch sha
	const branchRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${encodeURIComponent(branch)}`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
	});
	if (!branchRes.ok) throw new Error(`branch ${branch} not found ${branchRes.status}`);
	const branchData = (await branchRes.json()) as { object: { sha: string } };
	const sha = branchData.object.sha;
	// get tree recursively
	const treeRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/${sha}?recursive=1`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
	});
	if (!treeRes.ok) throw new Error(`tree failed ${treeRes.status}`);
	const treeData = (await treeRes.json()) as { tree: Array<{ path: string; type: string; sha: string; size?: number }> };
	const prefix = docsPath === '/' ? '' : docsPath.replace(/^\/+|\/+$/g, '') + '/';
	const files = treeData.tree
		.filter((n) => n.type === 'blob' && (prefix === '' ? true : n.path.startsWith(prefix)))
		.filter((n) => /\.(md|mdx|json)$/i.test(n.path) || n.path.endsWith('.json'))
		.map((n) => ({ path: n.path, sha: n.sha, size: n.size ?? 0 }));
	return { sha, files };
}

export async function fetchFileContent(installationId: bigint | number, repoFullName: string, path: string, ref: string): Promise<string> {
	const token = await getInstallationToken(installationId);
	const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(ref)}`, {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' }
	});
	if (!res.ok) throw new Error(`fetch ${path} failed ${res.status}`);
	// raw returns text; if base64 json, handle
	const ct = res.headers.get('content-type') ?? '';
	if (ct.includes('application/json')) {
		const j = (await res.json()) as { content: string; encoding: string };
		if (j.encoding === 'base64') return Buffer.from(j.content, 'base64').toString('utf-8');
		return j.content;
	}
	return await res.text();
}
