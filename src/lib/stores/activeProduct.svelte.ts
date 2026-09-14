import { browser } from '$app/environment';
import { page } from '$app/state';
import { supabase } from '$lib/supabaseClient';
import { env } from '$env/dynamic/public';
import { ensureMyTenant } from '$lib/tenant';
import { products as mockProductsSeed } from '$lib/data/workspace';
import type { ProductRecord } from '$lib/data/workspace';

export type ActiveProduct = {
	id: string;
	slug: string;
	name: string;
	logo_url: string | null;
	avatar: string | null;
	github_url: string | null;
	category: string | null;
	tagline: string | null;
	status: string;
};

const PC_ACTIVE_PRODUCT_KEY = 'pc.active_product_id';
const PC_GITHUB_PROVISION_PREFIX = 'pc.github_provisioned_at:';

function toActiveProduct(row: any): ActiveProduct {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		logo_url: row.logo_url ?? row.avatar ?? null,
		avatar: row.avatar ?? row.logo_url ?? null,
		github_url: row.github_url ?? null,
		category: row.category ?? null,
		tagline: row.tagline ?? null,
		status: row.status ?? 'Live'
	};
}

function mockToActive(mock: ProductRecord): ActiveProduct {
	return {
		id: `mock-${mock.slug}`,
		slug: mock.slug,
		name: mock.name,
		logo_url: mock.avatar,
		avatar: mock.avatar,
		github_url: null,
		category: mock.category ?? null,
		tagline: mock.tagline ?? null,
		status: mock.status
	};
}

// Module-level state — Svelte 5 runes require top-level.
let productsState: ActiveProduct[] = $state([]);
let activeIdState: string | null = $state(null);
let loadingState = $state(false);
let hydratedState = $state(false);
let errorState: string | null = $state(null);

let activeProductState = $derived(productsState.find((p) => p.id === activeIdState) ?? null);

// Persist helpers
function readLocal(): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(PC_ACTIVE_PRODUCT_KEY);
	} catch {
		return null;
	}
}
function writeLocal(id: string | null) {
	if (!browser) return;
	try {
		if (id) localStorage.setItem(PC_ACTIVE_PRODUCT_KEY, id);
		else localStorage.removeItem(PC_ACTIVE_PRODUCT_KEY);
	} catch {}
}

/**
 * Start starter-kit provisioning without delaying workspace navigation.
 * The server owns the idempotency and returns an authorization-needed state
 * until the maker installs the GitHub App.
 */
export async function requestGithubProvisioning(productId: string, force = false): Promise<void> {
	if (!browser || !productId || productId.startsWith('mock-')) return;
	try {
		const marker = `${PC_GITHUB_PROVISION_PREFIX}${productId}`;
		const lastAttempt = Number(sessionStorage.getItem(marker) ?? 0);
		if (!force && Number.isFinite(lastAttempt) && Date.now() - lastAttempt < 5 * 60 * 1000) return;
		const { data: session } = await supabase?.auth.getSession() ?? { data: { session: null } };
		const token = session.session?.access_token;
		if (!token) return;
		sessionStorage.setItem(marker, String(Date.now()));
		await fetch('/api/github/provision', {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify({ product_id: productId })
		});
	} catch {
		// Provisioning is background work. Workspace navigation must remain usable.
	}
}

async function fetchProfileActiveId(): Promise<string | null> {
	if (!supabase) return null;
	try {
		const { data: session } = await supabase.auth.getSession();
		if (!session.session) return null;
		const { data, error } = await supabase
			.from('profiles')
			.select('active_product_id')
			.eq('id', session.session.user.id)
			.maybeSingle();
		if (error) return null;
		return (data as any)?.active_product_id ?? null;
	} catch {
		return null;
	}
}

function resolveActiveId(
	products: ActiveProduct[],
	profileId: string | null,
	localId: string | null,
	urlSlug: string | null
): string | null {
	// 1. URL slug takes precedence if it maps to a real product
	if (urlSlug) {
		const bySlug = products.find((p) => p.slug === urlSlug);
		if (bySlug) return bySlug.id;
	}
	// 2. Profile
	if (profileId && products.some((p) => p.id === profileId)) return profileId;
	// 3. localStorage
	if (localId && products.some((p) => p.id === localId)) return localId;
	// 4. First product
	if (products.length > 0) return products[0].id;
	return null;
}

let loadPromise: Promise<void> | undefined;

export async function hydrateActiveProduct(): Promise<void> {
	if (!browser || hydratedState) return;
	if (loadPromise) return loadPromise;
	loadingState = true;
	loadPromise = (async () => {
		try {
			const isBypass = !import.meta.env.PROD && env.PUBLIC_DEV_AUTH_BYPASS === '1';
			let rows: ActiveProduct[] = [];

			if (supabase) {
				try {
					const { data: session } = await supabase.auth.getSession();
					if (session.session) {
						// Use RPC if available, fallback to direct select (RLS enforces maker_id)
						const { data: rpcData, error: rpcErr } = await supabase.rpc('get_my_products');
						if (!rpcErr && Array.isArray(rpcData)) {
							rows = (rpcData as any[]).map(toActiveProduct);
						} else {
							const { data: sel, error: selErr } = await supabase
								.from('products')
								.select('id, slug, name, logo_url, avatar, github_url, category, tagline, status')
								.is('deleted_at', null)
								.order('created_at', { ascending: true });
							if (!selErr && Array.isArray(sel)) rows = (sel as any[]).map(toActiveProduct);
						}
					}
				} catch {}
			}

			// Dev bypass: show mock products when DB is empty so the switcher is still testable.
			// In real zero-product state we would show empty; this is only for dev with no auth.
			if (rows.length === 0 && isBypass) {
				rows = mockProductsSeed.slice(0, 6).map(mockToActive);
			}

			productsState = rows;

			// Resolve active id
			const urlSlug = (() => {
				try {
					const u = page.url;
					const qp = u.searchParams.get('product');
					if (qp) return qp.trim().toLowerCase();
					return null;
				} catch {
					return null;
				}
			})();

			const [profileId, localId] = await Promise.all([fetchProfileActiveId(), Promise.resolve(readLocal())]);

			let nextId = resolveActiveId(rows, profileId, localId, urlSlug);

			// If resolved id not in list, clear
			if (nextId && !rows.some((p) => p.id === nextId)) nextId = rows[0]?.id ?? null;

			activeIdState = nextId;
			if (nextId) writeLocal(nextId);
			else writeLocal(null);
			if (nextId) void requestGithubProvisioning(nextId);

			// If DB has products but profile/local disagree, sync profile lazily (no await)
			if (nextId && profileId !== nextId && supabase) {
				void supabase.rpc('set_active_product', { p_product_id: nextId }).then(
					() => {},
					() => {}
				);
			}
		} catch (e) {
			errorState = e instanceof Error ? e.message : String(e);
		} finally {
			loadingState = false;
			hydratedState = true;
		}
	})();
	return loadPromise;
}

export async function setActiveProduct(id: string | null): Promise<void> {
	if (!id) {
		activeIdState = null;
		writeLocal(null);
		return;
	}
	const exists = productsState.some((p) => p.id === id);
	if (!exists) return;

	activeIdState = id;
	writeLocal(id);

	if (!supabase) return;
	try {
		const { data: session } = await supabase.auth.getSession();
		if (!session.session) return;
		// Prefer RPC which verifies membership; fallback to direct update if RPC missing
		const { error } = await supabase.rpc('set_active_product', { p_product_id: id });
		if (error) {
			await supabase.from('profiles').update({ active_product_id: id }).eq('id', session.session.user.id);
		}
	} catch {}
}

export async function createProduct(input: { name: string; slug?: string; category?: string }): Promise<ActiveProduct | null> {
	if (!supabase) return null;
	const name = input.name.trim();
	if (!name) return null;
	let slug = (input.slug ?? name).trim().toLowerCase();
	slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	if (!slug || slug.length < 3) slug = `product-${Math.random().toString(36).slice(2, 6)}`;
	if (slug.length > 63) slug = slug.slice(0, 63).replace(/-+$/g, '');

	try {
		const { data: session } = await supabase.auth.getSession();
		if (!session.session) return null;
		const maker_id = session.session.user.id;
		const tenant = await ensureMyTenant();
		if (!tenant) return null;
		const { data, error } = await supabase
			.from('products')
			.insert({
				maker_id,
				tenant_id: tenant.id,
				slug,
				name,
				category: input.category ?? null,
				status: 'Live'
			})
			.select('id, slug, name, logo_url, avatar, category, tagline, status')
			.single();
		if (error) {
			// slug collision — try with suffix
			if (error.message?.toLowerCase().includes('duplicate') || error.code === '23505') {
				const suffix = `-${Math.random().toString(36).slice(2, 4)}`;
				const altSlug = `${slug.slice(0, 63 - suffix.length)}${suffix}`;
				const { data: retry, error: retryErr } = await supabase
					.from('products')
					.insert({ maker_id, tenant_id: tenant.id, slug: altSlug, name, category: input.category ?? null, status: 'Live' })
					.select('id, slug, name, logo_url, avatar, category, tagline, status')
					.single();
				if (retryErr) return null;
				const prod = toActiveProduct(retry);
				productsState = [...productsState, prod];
				await setActiveProduct(prod.id);
				void requestGithubProvisioning(prod.id);
				return prod;
			}
			return null;
		}
		const prod = toActiveProduct(data);
		productsState = [...productsState, prod];
		await setActiveProduct(prod.id);
		void requestGithubProvisioning(prod.id);
		return prod;
	} catch {
		return null;
	}
}

export async function refreshProducts(): Promise<void> {
	hydratedState = false;
	loadPromise = undefined;
	await hydrateActiveProduct();
}

// Reactive getters for components
export const activeProductStore = {
	get products() {
		return productsState;
	},
	get activeProductId() {
		return activeIdState;
	},
	get activeProduct() {
		return activeProductState;
	},
	get loading() {
		return loadingState;
	},
	get hydrated() {
		return hydratedState;
	},
	get error() {
		return errorState;
	}
};

// For Svelte $derived consumers that import state directly
export function getProducts() {
	return productsState;
}
export function getActiveProduct() {
	return activeProductState;
}
export function getActiveProductId() {
	return activeIdState;
}
