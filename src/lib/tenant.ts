import { supabase } from '$lib/supabaseClient';

export type Tenant = {
	id: string;
	owner_id: string;
	slug: string;
	name: string;
	created_at: string;
	updated_at: string;
};

/**
 * Canonical domain that hosts tenant pages (`{slug}.productclient.com`).
 * The docs/status/roadmap Workers all resolve the same slug registry under
 * this domain. `yourplatform.com` appears only as a placeholder in old specs
 * and is never used by ProductClient infrastructure.
 */
export const TENANT_DOMAIN = 'productclient.com';

/**
 * Host for a tenant's hosted pages, e.g. `gemma.productclient.com`.
 */
export function tenantHost(slug: string): string {
	return `${slug}.${TENANT_DOMAIN}`;
}

export function displaySubdomain(slug: string): string {
	return tenantHost(slug);
}

/**
 * URL for a tenant's hosted page. Hosted pages always live on the production
 * domain (Cloudflare Workers), no matter where the dashboard itself runs, so
 * this is a plain https URL even in local development.
 */
export function tenantUrl(slug: string, path = '/'): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `https://${tenantHost(slug)}${normalized}`;
}

/**
 * Hosted status pages live under a path on the neutral status host, e.g.
 * `status.productclient.com/gemma` and `status.productclient.com/gemma/uptime`.
 * Path-based tenants avoid the second-level wildcard certificate problem that
 * `{slug}.status.productclient.com` would have.
 */
export const STATUS_PAGES_HOST = 'status.productclient.com';
export const ROADMAP_HOST = 'roadmap.productclient.com';

export function tenantStatusUrl(slug: string, path = ''): string {
	const suffix = path === '' || path.startsWith('/') ? path : `/${path}`;
	return `https://${STATUS_PAGES_HOST}/${slug}${suffix}`;
}

export function tenantRoadmapUrl(slug: string, path = ''): string {
	const suffix = path === '' || path.startsWith('/') ? path : `/${path}`;
	return `https://${ROADMAP_HOST}/${slug}${suffix}`;
}

export async function getMyTenant(): Promise<Tenant | null> {
	if (!supabase) return null;
	const { data, error } = await supabase.rpc('get_my_tenant');
	if (error) {
		// fallback to direct select if rpc missing (RLS still enforces owner)
		const { data: rows, error: selErr } = await supabase
			.from('tenants')
			.select('*')
			.limit(1)
			.maybeSingle();
		if (selErr) return null;
		return (rows as unknown as Tenant) ?? null;
	}
	// rpc returns setof for get_my_tenant (array), ensure_my_tenant returns a single row
	if (Array.isArray(data)) return (data[0] as Tenant) ?? null;
	return (data as unknown as Tenant) ?? null;
}

export async function ensureMyTenant(): Promise<Tenant | null> {
	if (!supabase) return null;
	// Fast path: the signup trigger usually already created the tenant.
	const existing = await getMyTenant();
	if (existing) return existing;
	const { data, error } = await supabase.rpc('ensure_my_tenant');
	if (error) {
		// Race: another tab finished creating it between our read and write.
		const retry = await getMyTenant();
		if (retry) return retry;
		console.warn('[tenant] ensure_my_tenant failed', error.message);
		return null;
	}
	if (Array.isArray(data)) return (data[0] as Tenant) ?? null;
	return (data as unknown as Tenant) ?? null;
}

export async function syncTenantRegistry(tenant: Pick<Tenant, 'id' | 'slug' | 'name'>): Promise<boolean> {
	if (!supabase) return false;
	try {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) return false;
		const response = await fetch('/api/tenants/sync', {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({ id: tenant.id, slug: tenant.slug, displayName: tenant.name })
		});
		return response.ok;
	} catch {
		return false;
	}
}

export async function renameMyTenant(newSlug: string): Promise<{ tenant?: Tenant; error?: string }> {
	if (!supabase) return { error: 'Supabase not configured' };
	const { data, error } = await supabase.rpc('rename_my_tenant', { p_new_slug: newSlug });
	if (error) return { error: error.message };
	const tenant = Array.isArray(data) ? (data[0] as Tenant) : (data as Tenant);
	return { tenant };
}

export function slugValidationMessage(slug: string): string {
	const s = slug.trim().toLowerCase();
	if (!s) return 'Enter a subdomain';
	if (s.length < 3) return 'Use at least 3 characters';
	if (s.length > 63) return 'Use at most 63 characters';
	if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(s)) return 'Lowercase letters, numbers and hyphens only — cannot start or end with hyphen';
	if (s.includes('--')) return 'Cannot contain consecutive hyphens';
	return '';
}
