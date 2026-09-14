import type { SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { getInstallationToken } from '$lib/server/githubApp';
import { githubRepositoryUrl } from '$lib/server/githubCanonical';

export type KitKey = 'docs' | 'roadmap' | 'status';

type Product = { id: string; tenant_id: string; maker_id: string; slug: string; name: string };
type Installation = { installation_id: number; account_login: string; account_type: 'User' | 'Organization' };
type KitRow = {
	id: string;
	product_id: string | null;
	kit: KitKey;
	installation_id: number | null;
	repo_full_name: string | null;
	branch: string;
	content_path: string;
	managed: boolean;
	provision_status: string;
	provision_error: string | null;
	template_repo: string | null;
};

const KIT_ORDER: KitKey[] = ['docs', 'roadmap', 'status'];

function privateValue(name: string): string | undefined {
	return (privateEnv as Record<string, string | undefined>)[name];
}

function templateInstallationId(): number | null {
	const value = privateValue('GITHUB_KIT_TEMPLATE_INSTALLATION_ID');
	if (!value?.trim()) return null;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function templateRepository(kit: KitKey): string {
	const override = privateValue(`GITHUB_KIT_TEMPLATE_${kit.toUpperCase()}`);
	if (override?.trim()) return override.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
	return {
		docs: 'Kimenzo2/documentation-starter-kit',
		roadmap: 'Kimenzo2/roadmap-starter-kit',
		status: 'Kimenzo2/status-page'
	}[kit];
}

function apiHeaders(token?: string): HeadersInit {
	return {
		Accept: 'application/vnd.github+json',
		'Content-Type': 'application/json',
		'X-GitHub-Api-Version': '2022-11-28',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};
}

async function githubJson<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
	const response = await fetch(`https://api.github.com${path}`, {
		...init,
		headers: { ...apiHeaders(token), ...(init.headers ?? {}) }
	});
	const text = await response.text().catch(() => '');
	let body: unknown = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = text;
	}
	if (!response.ok) {
		const message = typeof body === 'object' && body && 'message' in body ? String((body as { message?: unknown }).message) : text.slice(0, 400);
		throw new Error(`GitHub ${response.status}: ${message || 'request failed'}`);
	}
	return body as T;
}

function repositoryName(product: Product, kit: KitKey): string {
	const base = `${product.slug}-${kit}-${product.tenant_id.replace(/-/g, '').slice(0, 8)}`
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return base.slice(0, 100).replace(/[-_.]+$/g, '') || `product-${kit}`;
}

async function loadTemplate(template: string, token: string): Promise<{
	defaultBranch: string;
	sha: string;
	files: Array<{ path: string; mode: string; sha: string }>;
}> {
	const repo = await githubJson<{ default_branch: string }>(`/repos/${template}`, {}, token);
	const branch = repo.default_branch || 'main';
	const ref = await githubJson<{ object: { sha: string } }>(`/repos/${template}/git/ref/heads/${encodeURIComponent(branch)}`, {}, token);
	const tree = await githubJson<{ truncated?: boolean; tree: Array<{ path: string; mode?: string; type: string; sha: string }> }>(
		`/repos/${template}/git/trees/${ref.object.sha}?recursive=1`,
		{},
		token
	);
	if (tree.truncated) throw new Error('The starter-kit template is too large to provision safely.');
	const files = tree.tree
		.filter((entry) => entry.type === 'blob')
		.map((entry) => ({ path: entry.path, mode: entry.mode ?? '100644', sha: entry.sha }));
	if (!files.length) throw new Error('The starter-kit template has no files.');
	return { defaultBranch: branch, sha: ref.object.sha, files };
}

async function createRepositoryFromTemplate(
	template: string,
	installation: Installation,
	name: string,
	product: Product,
	token: string
): Promise<{ id: number; full_name: string; default_branch: string }> {
	return githubJson<{ id: number; full_name: string; default_branch: string }>(
		`/repos/${template}/generate`,
		{
			method: 'POST',
			body: JSON.stringify({
				owner: installation.account_login,
				name,
				private: true,
				include_all_branches: false,
				description: `${product.name} ${name.slice(product.slug.length + 1, product.slug.length + 6)} starter kit managed by ProductClient`,
			})
		},
		token
	);
}

async function copyTemplateToRepository(
	token: string,
	template: string,
	templateData: Awaited<ReturnType<typeof loadTemplate>>,
	repository: { full_name: string; default_branch: string }
): Promise<string> {
	const blobs = new Array<{ path: string; mode: string; type: 'blob'; sha: string }>(templateData.files.length);
	let cursor = 0;
	const workers = Array.from({ length: Math.min(8, templateData.files.length) }, async () => {
		while (cursor < templateData.files.length) {
			const index = cursor++;
			const file = templateData.files[index];
			const content = await githubJson<{ content: string; encoding: string }>(`/repos/${template}/git/blobs/${file.sha}`, {}, token);
			if (content.encoding !== 'base64') throw new Error(`Template file ${file.path} used an unsupported encoding.`);
			const created = await githubJson<{ sha: string }>(
				`/repos/${repository.full_name}/git/blobs`,
				{ method: 'POST', body: JSON.stringify({ content: content.content.replace(/\n/g, ''), encoding: 'base64' }) },
				token
			);
			blobs[index] = { path: file.path, mode: file.mode, type: 'blob', sha: created.sha };
		}
	});
	await Promise.all(workers);

	let parentSha: string | null = null;
	let baseTreeSha: string | null = null;
	try {
		const ref = await githubJson<{ object: { sha: string } }>(`/repos/${repository.full_name}/git/ref/heads/${encodeURIComponent(repository.default_branch || 'main')}`, {}, token);
		parentSha = ref.object.sha;
		const commit = await githubJson<{ tree: { sha: string } }>(`/repos/${repository.full_name}/git/commits/${parentSha}`, {}, token);
		baseTreeSha = commit.tree.sha;
	} catch {
		// A newly created repository has no branch yet. The first commit creates it.
	}

	const tree = await githubJson<{ sha: string }>(
		`/repos/${repository.full_name}/git/trees`,
		{ method: 'POST', body: JSON.stringify({ ...(baseTreeSha ? { base_tree: baseTreeSha } : {}), tree: blobs }) },
		token
	);
	const commit = await githubJson<{ sha: string }>(
		`/repos/${repository.full_name}/git/commits`,
		{ method: 'POST', body: JSON.stringify({ message: 'Initialize ProductClient starter kit', tree: tree.sha, ...(parentSha ? { parents: [parentSha] } : {}) }) },
		token
	);
	const branch = repository.default_branch || 'main';
	if (parentSha) {
		await githubJson(
			`/repos/${repository.full_name}/git/refs/heads/${encodeURIComponent(branch)}`,
			{ method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) },
			token
		);
	} else {
		await githubJson(
			`/repos/${repository.full_name}/git/refs`,
			{ method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }) },
			token
		);
	}
	return commit.sha;
}

async function upsertKitRow(admin: SupabaseClient, product: Product, kit: KitKey, values: Record<string, unknown>) {
	const { data, error } = await admin
		.from('github_kit_repositories')
		.upsert({ tenant_id: product.tenant_id, product_id: product.id, kit, branch: 'main', content_path: '/', ...values, updated_at: new Date().toISOString() }, { onConflict: 'product_id,kit' })
		.select('*')
		.single();
	if (error) throw new Error(error.message);
	return data as KitRow;
}

async function existingKitRow(admin: SupabaseClient, productId: string, kit: KitKey): Promise<KitRow | null> {
	const { data } = await admin.from('github_kit_repositories').select('*').eq('product_id', productId).eq('kit', kit).maybeSingle();
	return (data as KitRow | null) ?? null;
}

async function provisionOne(admin: SupabaseClient, product: Product, installation: Installation, kit: KitKey): Promise<KitRow> {
	const template = templateRepository(kit);
	let row = await existingKitRow(admin, product.id, kit);
	if (row && !row.managed) return row;
	if (row?.provision_status === 'ready' && row.repo_full_name && row.installation_id === installation.installation_id) return row;
	row = await upsertKitRow(admin, product, kit, {
		installation_id: installation.installation_id,
		managed: true,
		template_repo: template,
		provision_status: 'provisioning',
		provision_error: null
	});
	try {
		const token = await getInstallationToken(installation.installation_id);
		const templateToken = templateInstallationId() ? await getInstallationToken(templateInstallationId() as number) : token;
		let templateData: Awaited<ReturnType<typeof loadTemplate>>;
		try {
			templateData = await loadTemplate(template, templateToken);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.includes('GitHub 401') || message.includes('GitHub 403') || message.includes('GitHub 404')) {
				throw new Error(`Starter-kit template ${template} is not accessible. Make it readable by the GitHub App or set GITHUB_KIT_TEMPLATE_INSTALLATION_ID to an installation that can read it.`);
			}
			throw error;
		}
		let repository: { id: number; full_name: string; default_branch: string };
		let generatedFromTemplate = false;
		if (row.repo_full_name) {
			repository = await githubJson<{ id: number; full_name: string; default_branch: string }>(`/repos/${row.repo_full_name}`, {}, token);
		} else {
			repository = await createRepositoryFromTemplate(template, installation, repositoryName(product, kit), product, token);
			generatedFromTemplate = true;
			row = await upsertKitRow(admin, product, kit, { installation_id: installation.installation_id, managed: true, template_repo: template, template_sha: templateData.sha, repository_id: repository.id, repo_full_name: repository.full_name, branch: repository.default_branch || 'main', provision_status: 'provisioning' });
		}
		const sha = generatedFromTemplate
			? (await githubJson<{ object: { sha: string } }>(`/repos/${repository.full_name}/git/ref/heads/${encodeURIComponent(repository.default_branch || 'main')}`, {}, token)).object.sha
			: await copyTemplateToRepository(token, template, templateData, repository);
		const { data, error } = await admin.from('github_kit_repositories').update({ repository_id: repository.id, repo_full_name: repository.full_name, branch: repository.default_branch || 'main', template_repo: template, template_sha: templateData.sha, last_sha: sha, provision_status: 'ready', provision_error: null, provisioned_at: new Date().toISOString(), sync_status: 'synced', updated_at: new Date().toISOString() }).eq('id', row.id).select('*').single();
		if (error) throw new Error(error.message);
		if (kit === 'docs') {
			const payload = { product_id: product.id, installation_id: installation.installation_id, repo_full_name: repository.full_name, role: 'source', branch: repository.default_branch || 'main', deploy_branch: null, docs_path: '/' , updated_at: new Date().toISOString() };
			const { data: existingLink } = await admin.from('github_repo_links').select('id').eq('product_id', product.id).eq('role', 'source').maybeSingle();
			if (existingLink?.id) await admin.from('github_repo_links').update(payload).eq('id', existingLink.id);
			else await admin.from('github_repo_links').insert(payload);
			await admin.from('products').update({ github_url: githubRepositoryUrl(repository.full_name) }).eq('id', product.id);
		}
		return data as KitRow;
	} catch (error) {
		let message = error instanceof Error ? error.message : String(error);
		if (message.includes('GitHub 403') && message.toLowerCase().includes('resource not accessible')) {
			message = 'The GitHub App cannot create repositories. Grant it Administration: read and write permission, then reinstall the App.';
		}
		if (message.includes('GitHub 422') && message.toLowerCase().includes('template')) {
			message = `Starter-kit template ${template} must be marked as a GitHub Template repository.`;
		}
		await admin.from('github_kit_repositories').update({ provision_status: 'failed', provision_error: message.slice(0, 1000), last_error: message.slice(0, 1000), sync_status: 'failed', updated_at: new Date().toISOString() }).eq('id', row.id);
		throw new Error(`${kit}: ${message}`);
	}
}

async function ensureWaitingRows(admin: SupabaseClient, product: Product): Promise<KitRow[]> {
	const rows: KitRow[] = [];
	for (const kit of KIT_ORDER) {
		const existing = await existingKitRow(admin, product.id, kit);
		if (existing && (!existing.managed || (existing.provision_status === 'ready' && existing.repo_full_name))) {
			rows.push(existing);
			continue;
		}
		rows.push(await upsertKitRow(admin, product, kit, { managed: true, template_repo: templateRepository(kit), provision_status: 'awaiting_authorization', provision_error: null, installation_id: null, repo_full_name: null }));
	}
	return rows;
}

async function setProvisionJob(admin: SupabaseClient, product: Product, requestedBy: string, status: 'provisioning' | 'awaiting_authorization', now: string): Promise<void> {
	const { data: existing } = await admin.from('github_kit_provision_jobs').select('id').eq('product_id', product.id).in('status', ['pending', 'provisioning', 'awaiting_authorization']).maybeSingle();
	const payload = { status, requested_by: requestedBy, attempts: status === 'provisioning' ? 1 : 0, last_error: null, started_at: status === 'provisioning' ? now : null, completed_at: null, updated_at: now };
	if (existing?.id) {
		await admin.from('github_kit_provision_jobs').update(payload).eq('id', existing.id);
		return;
	}
	await admin.from('github_kit_provision_jobs').insert({ tenant_id: product.tenant_id, product_id: product.id, ...payload });
}

export async function provisionStarterKits(admin: SupabaseClient, productId: string, requestedBy: string): Promise<{ status: string; repositories: KitRow[] }> {
	const { data: productData, error: productError } = await admin.from('products').select('id, tenant_id, maker_id, slug, name').eq('id', productId).maybeSingle();
	if (productError) throw new Error(productError.message);
	if (!productData?.tenant_id) throw new Error('Product is not attached to a tenant.');
	const product = productData as Product;
	const now = new Date().toISOString();
	const { data: installationData } = await admin.from('github_installations').select('installation_id, account_login, account_type').eq('maker_id', product.maker_id).is('suspended_at', null).order('updated_at', { ascending: false }).limit(1).maybeSingle();
	if (!installationData) {
		const repositories = await ensureWaitingRows(admin, product);
		await setProvisionJob(admin, product, requestedBy, 'awaiting_authorization', now);
		return { status: 'awaiting_authorization', repositories };
	}

	const installation = installationData as Installation;
	await setProvisionJob(admin, product, requestedBy, 'provisioning', now);
	const repositories: KitRow[] = [];
	const errors: string[] = [];
	for (const kit of KIT_ORDER) {
		try {
			repositories.push(await provisionOne(admin, product, installation, kit));
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
		}
	}
	const status = errors.length ? 'failed' : 'ready';
	await admin.from('github_kit_provision_jobs').update({ status, last_error: errors.length ? errors.join('; ').slice(0, 2000) : null, completed_at: now, updated_at: now }).eq('product_id', product.id).in('status', ['provisioning', 'pending']);
	if (errors.length) throw new Error(errors.join('; '));
	return { status, repositories };
}
