<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
import { Check, Plug, Search } from 'reicon-svelte';
import { Button, Input, Label, Select } from '$lib/components/ui';
import { tooltip } from '$lib/components/Tooltip.svelte';
import { supabase } from '$lib/supabaseClient';

	type Product = { id: string; name: string; slug: string };
	type KitKey = 'docs' | 'roadmap' | 'status';
	type Link = { product_id: string; repo_full_name: string; branch: string; deploy_branch?: string | null; docs_path: string; last_sha: string | null; last_synced_at: string | null; last_error: string | null; installation_id: number };
	type KitRepository = { tenant_id: string; product_id: string | null; repo_full_name: string | null; branch: string; content_path: string; last_sha: string | null; last_synced_at: string | null; last_error: string | null; installation_id: number | null; kit: KitKey; managed?: boolean; provision_status?: string; provision_error?: string | null; github_sync_status?: string };
	type Repo = { full_name: string; default_branch: string; private: boolean };
	const starterKits: Array<{ value: KitKey; label: string }> = [
		{ value: 'docs', label: 'Documentation Starter Kit' },
		{ value: 'roadmap', label: 'RoadMap Page' },
		{ value: 'status', label: 'Status Page' }
	];

	let products = $state<Product[]>([]);
	let activeProductId = $state<string | null>(null);
	let link = $state<Link | null>(null);
	let contextLinks = $state<Link[]>([]);
	let kitRepositories = $state<Record<KitKey, KitRepository | null>>({ docs: null, roadmap: null, status: null });
	let repos = $state<Repo[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let installationId = $state<number | null>(null);

	let selectedRepo = $state('');
	let branch = $state('main');
	let docsPath = $state('/');
	let contextRepo = $state('');
	let contextError = $state('');
	let targetKit = $state<KitKey>('docs');
	let targetRepo = $state('');
	let targetBranch = $state('main');
	let targetPath = $state('/');
	let targetError = $state('');
	let targetBusy = $state(false);
	let busy = $state(false);
	let installPending = $state(false);
	let installPoll: ReturnType<typeof setInterval> | undefined;
	let kitSetupOpen = $state(false);

	// sync
	let syncBusy = $state(false);
	let syncMessage = $state('');

	async function authToken(): Promise<string | null> {
		if (!supabase) return null;
		const { data } = await supabase.auth.getSession();
		return data.session?.access_token ?? null;
	}

	async function loadProducts() {
		if (!supabase) return;
		const token = await authToken();
		if (!token) return;
		// get profiles active_product_id
		const { data: userData } = await supabase.auth.getUser();
		const uid = userData.user?.id;
		if (!uid) return;
		const { data: profile } = await supabase.from('profiles').select('active_product_id').eq('id', uid).maybeSingle();
		activeProductId = (profile as { active_product_id?: string } | null)?.active_product_id ?? null;

		const { data: prods } = await supabase.from('products').select('id,name,slug').eq('maker_id', uid).order('created_at', { ascending: true });
		products = (prods as Product[] | null) ?? [];
		if (!activeProductId && products[0]) activeProductId = products[0].id;

		// allow query override
		const q = page.url.searchParams.get('product_id');
		if (q) activeProductId = q;
	}

	async function loadLink() {
		if (!activeProductId) { link = null; contextLinks = []; kitRepositories = { docs: null, roadmap: null, status: null }; return; }
		const token = await authToken();
		if (!token) return;
		const res = await fetch(`/api/github/link?product_id=${activeProductId}`, { headers: { authorization: `Bearer ${token}` } });
		const j = await res.json().catch(() => null);
		if (j?.ok && j.link) {
			link = j.link as Link;
			installationId = link.installation_id;
			selectedRepo = link.repo_full_name;
			branch = link.branch;
			docsPath = link.docs_path;
		} else {
			link = null;
			// try to get installation_id from query (post-setup redirect)
			const qInst = page.url.searchParams.get('installation_id') ?? (j?.installation_id ? String(j.installation_id) : null);
			installationId = qInst ? Number(qInst) : null;
			selectedRepo = '';
		}
		const contextRes = await fetch(`/api/github/link?product_id=${activeProductId}&role=context`, { headers: { authorization: `Bearer ${token}` } });
		const contextResult = await contextRes.json().catch(() => null);
		contextLinks = contextResult?.ok ? (contextResult.links as Link[]) ?? [] : [];
		await loadKitRepositories(token);
	}

	async function loadKitRepositories(token?: string) {
		if (!activeProductId) return;
		const auth = token ?? (await authToken());
		if (!auth) return;
		const response = await fetch(`/api/github/kits?product_id=${activeProductId}`, { headers: { authorization: `Bearer ${auth}` } });
		const result = await response.json().catch(() => null);
		const next: Record<KitKey, KitRepository | null> = { docs: null, roadmap: null, status: null };
		for (const repository of (result?.repositories ?? []) as KitRepository[]) if (repository.kit in next) next[repository.kit] = repository;
		kitRepositories = next;
		const selected = kitRepositories[targetKit];
		if (selected) {
			targetRepo = selected.repo_full_name ?? '';
			targetBranch = selected.branch;
			targetPath = selected.content_path || '/';
		}
	}

	function chooseTargetKit(value: string) {
		if (!['docs', 'roadmap', 'status'].includes(value)) return;
		targetKit = value as KitKey;
		targetError = '';
		const selected = kitRepositories[targetKit];
		targetRepo = selected?.repo_full_name ?? '';
		targetBranch = selected?.branch ?? 'main';
		targetPath = selected?.content_path ?? '/';
	}

	function kitStatus(repository: KitRepository | null): string {
		if (!repository) return 'Not connected';
		if (repository.provision_status === 'awaiting_authorization') return 'GitHub access needed';
		if (repository.provision_status === 'provisioning' || repository.provision_status === 'pending') return 'Connection in progress';
		if (repository.provision_status === 'failed') return 'Setup needs attention';
		if (repository.provision_status === 'ready' && repository.repo_full_name) return repository.repo_full_name;
		return 'Not connected';
	}

	function openKitSetup(kit: KitKey) {
		chooseTargetKit(kit);
		kitSetupOpen = true;
		setTimeout(() => document.getElementById('kit-repository-settings')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
	}

	async function loadRepos() {
		if (!installationId) { repos = []; return; }
		const token = await authToken();
		if (!token) return;
		const res = await fetch(`/api/github/repos?installation_id=${installationId}`, { headers: { authorization: `Bearer ${token}` } });
		const j = await res.json().catch(() => null);
		if (j?.ok) {
			repos = (j.repositories as Repo[]) ?? [];
			if (repos.length && !selectedRepo) selectedRepo = repos[0].full_name;
			// prefill branch from first repo default
			if (repos.length && branch === 'main') {
				const found = repos.find((r) => r.full_name === selectedRepo);
				if (found) branch = found.default_branch;
			}
		} else {
			error = j?.message ?? 'Could not list repos';
		}
	}

	function stopInstallMonitor() {
		if (installPoll) clearInterval(installPoll);
		installPoll = undefined;
		installPending = false;
		busy = false;
	}

	async function handleGitHubMessage(event: MessageEvent) {
		if (event.origin !== window.location.origin || event.data?.source !== 'productclient-github') return;
		if (event.data?.type !== 'connected') return;
		stopInstallMonitor();
		notice = 'GitHub is connected. Choose a repository for each workspace when you are ready.';
		await loadLink();
		if (installationId) await loadRepos();
	}

	onMount(async () => {
		const callbackWindow = page.url.searchParams.get('github_callback') === '1';
		if (callbackWindow && window.opener && window.opener !== window) {
			window.opener.postMessage({ source: 'productclient-github', type: 'connected' }, window.location.origin);
			window.close();
			return;
		}
		try {
			await loadProducts();
			await loadLink();
			if (installationId) await loadRepos();
			// handle setup redirect notice
			const githubError = page.url.searchParams.get('github_error');
			if (githubError) error = githubError;
			else if (page.url.searchParams.get('connected') === '1') notice = 'GitHub is connected. Choose a repository for each workspace when you are ready.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	});

	async function connect() {
		if (!activeProductId) { error = 'Create a product first'; return; }
		busy = true;
		error = '';
		const installWindow = window.open('', 'productclient-github-install', 'popup,width=760,height=820,left=120,top=80');
		if (!installWindow) {
			busy = false;
			error = 'Allow pop-ups for ProductClient to install the GitHub App.';
			return;
		}
		installPending = true;
		if (installPoll) clearInterval(installPoll);
		installPoll = setInterval(() => {
			if (installWindow.closed) {
				stopInstallMonitor();
				notice = 'GitHub installation window closed before the connection was completed.';
			}
		}, 500);
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch(`/api/github/install?product_id=${activeProductId}`, { headers: { authorization: `Bearer ${token}` } });
			const j = await res.json().catch(() => null);
			if (!j?.ok || !j.installUrl) throw new Error(j?.message ?? 'Could not create install URL');
			installWindow.location.href = j.installUrl as string;
			installWindow.focus();
		} catch (e) {
			installWindow.close();
			stopInstallMonitor();
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function saveLink() {
		if (!activeProductId || !installationId || !selectedRepo) { error = 'Choose a repository.'; return; }
		busy = true;
		error = '';
		notice = '';
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch('/api/github/link', {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
				body: JSON.stringify({ product_id: activeProductId, installation_id: installationId, repo_full_name: selectedRepo, branch, deploy_branch: null, docs_path: docsPath })
			});
			const j = await res.json().catch(() => null);
			if (!j?.ok) throw new Error(j?.message ?? j?.code ?? 'Could not save');
			link = j.link as Link;
			await loadKitRepositories(token);
			notice = 'Connected';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function saveContextRepo() {
		if (!activeProductId || !installationId) return;
		if (!contextRepo) { contextError = 'Choose a repository first.'; return; }
		busy = true;
		contextError = '';
		error = '';
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const contextBranch = repos.find((repo) => repo.full_name === contextRepo)?.default_branch ?? 'main';
			const res = await fetch('/api/github/link', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: activeProductId, installation_id: installationId, repo_full_name: contextRepo, role: 'context', branch: contextBranch, docs_path: '/' }) });
			const result = await res.json().catch(() => null);
			if (!res.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not save context repository');
			contextRepo = '';
			await loadLink();
			notice = 'Repository added.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function removeContextRepo(repo: string) {
		if (!activeProductId) return;
		const token = await authToken();
		if (!token) return;
		await fetch(`/api/github/link?product_id=${activeProductId}&role=context&repo_full_name=${encodeURIComponent(repo)}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
		await loadLink();
	}

	async function disconnect() {
		if (!activeProductId) return;
		if (!confirm('Remove GitHub from this product?')) return;
		busy = true;
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch(`/api/github/link?product_id=${activeProductId}&all=1`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
			const j = await res.json().catch(() => null);
			if (!j?.ok) throw new Error(j?.message ?? 'Could not disconnect');
			link = null;
			installationId = null;
			contextLinks = [];
			repos = [];
			await fetch(`/api/github/kits?product_id=${activeProductId}&all=1`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
			kitRepositories = { docs: null, roadmap: null, status: null };
			kitSetupOpen = false;
			notice = 'Disconnected';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function saveKitRepository() {
		if (!activeProductId || !installationId || !targetRepo) { targetError = 'Choose a repository for this starter kit.'; return; }
		targetBusy = true;
		targetError = '';
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const response = await fetch('/api/github/kits', {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
				body: JSON.stringify({ product_id: activeProductId, installation_id: installationId, repo_full_name: targetRepo, branch: targetBranch, content_path: targetPath || '/', kit: targetKit })
			});
			const result = await response.json().catch(() => null);
			if (!response.ok || !result?.ok) throw new Error(result?.message ?? result?.code ?? 'Could not save starter-kit repository.');
			if (targetKit === 'docs') {
				const sourceResponse = await fetch('/api/github/link', {
					method: 'POST',
					headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
					body: JSON.stringify({
						product_id: activeProductId,
						installation_id: installationId,
						repo_full_name: targetRepo,
						role: 'source',
						branch: targetBranch,
						deploy_branch: null,
						docs_path: targetPath || '/'
					})
				});
				const sourceResult = await sourceResponse.json().catch(() => null);
				if (!sourceResponse.ok || !sourceResult?.ok) throw new Error(sourceResult?.message ?? sourceResult?.code ?? 'Could not connect the documentation repository.');
			}
			await loadKitRepositories(token);
			await loadLink();
			kitSetupOpen = false;
			notice = `${starterKits.find((kit) => kit.value === targetKit)?.label ?? 'Starter kit'} repository connected.`;
		} catch (e) {
			targetError = e instanceof Error ? e.message : String(e);
		} finally {
			targetBusy = false;
		}
	}

	async function removeKitRepository(kit: KitKey) {
		if (!activeProductId) return;
		const token = await authToken();
		if (!token) return;
		await fetch(`/api/github/kits?product_id=${activeProductId}&kit=${kit}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
		if (kit === 'docs') {
			await fetch(`/api/github/link?product_id=${activeProductId}&role=source`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
			link = null;
		}
		await loadKitRepositories(token);
		await loadLink();
		kitSetupOpen = false;
		notice = `${starterKits.find((item) => item.value === kit)?.label ?? 'Starter kit'} disconnected.`;
	}

	async function syncNow() {
		if (!activeProductId) return;
		syncBusy = true;
		syncMessage = '';
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch('/api/github/sync', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ product_id: activeProductId }) });
			const j = await res.json().catch(() => null);
			if (!j?.ok) throw new Error(j?.message ?? j?.code ?? 'Sync failed');
			syncMessage = `Synced ${j.total ?? 0} files @ ${j.sha?.slice(0, 7) ?? ''}`;
			await loadLink();
		} catch (e) {
			syncMessage = e instanceof Error ? e.message : String(e);
		} finally {
			syncBusy = false;
		}
	}

</script>

<svelte:window onmessage={handleGitHubMessage} />

<svelte:head><title>Git · Settings</title></svelte:head>

<div class="mx-auto w-full max-w-[880px]">
	<header class="mb-5">
		<h2 class="flex items-center gap-2 text-xl font-semibold tracking-tight"><Plug size={20} weight="Outline" aria-hidden="true" />GitHub</h2>
	</header>

	{#if loading}
		<div class="h-40 animate-pulse rounded-[12px] bg-[var(--pc-surface-2)]"></div>
	{:else}
		{#if error}<p class="mb-4 rounded-[12px] bg-[rgba(248,113,113,0.12)] px-3 py-2 text-[13px] text-[#fca5a5]" role="alert">{error}</p>{/if}
		{#if notice}<p class="mb-4 rounded-[12px] bg-[rgba(119,152,18,0.12)] px-3 py-2 text-[13px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}

		{#if !products.length}
			<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
				<div class="p-4">
					<div class="truncate text-sm font-medium">No products yet</div>
					<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Create a product to connect docs.</p>
					<Button size="sm" class="mt-3" href="/workspace/products">Create a product</Button>
				</div>
			</section>
		{:else}
			<section class="divide-y divide-[var(--pc-border-strong)] rounded-[12px] border border-[var(--pc-border-strong)]">
				<div class="p-4">
					<div class="grid gap-1.5">
						<Label>Active product</Label>
						<Select value={activeProductId ?? ''} options={products.map((p) => ({ value: p.id, label: `${p.name} · ${p.slug}` }))} onValueChange={(v) => { activeProductId = v; void loadLink(); }} />
					</div>
				</div>

				{#if !installationId}
					<div class="flex items-center gap-3 p-4">
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-medium">Connect GitHub</div>
							<p class="mt-0.5 text-[13px]/[18px] text-[var(--pc-text-muted)]">Connect a repository when you want to edit a workspace outside ProductClient.</p>
						</div>
						<span class="shrink-0"><Button size="sm" loading={busy} onclick={connect}>{installPending ? 'Waiting for GitHub…' : 'Connect'}{#if !installPending}<Plug size={14} weight="Outline" aria-hidden="true" />{/if}</Button></span>
					</div>
				{:else}
					<div class="p-4">
						<div class="flex items-center gap-2 text-sm font-medium"><Check size={14} weight="Outline" aria-hidden="true" /> GitHub is connected</div>
						<p class="mt-1 max-w-[58ch] text-[13px]/[18px] text-[var(--pc-text-muted)]">Choose a repository for each workspace when you are ready.</p>

						{#if link}
							<div class="mt-5 border-t border-[var(--pc-border-strong)] pt-4">
								<div class="text-sm font-medium">Documentation source</div>
								<div class="mt-2 flex flex-wrap items-center gap-2 text-[13px]"><Check size={14} weight="Outline" aria-hidden="true" /> <span class="font-medium tracking-[-0.01em]">{link.repo_full_name}</span><span class="text-[var(--pc-text-muted)]">· {link.branch}</span><span use:tooltip={{ text: link.last_sha ? `Last synced ${link.last_synced_at ? new Date(link.last_synced_at).toLocaleString() : ''} · ${link.last_sha.slice(0,7)}` : 'Not yet synced', island: true }} class="cursor-help text-[var(--pc-text-faint)]"><Search size={12} weight="Outline" aria-hidden="true" /></span></div>
								{#if link.last_error}<p class="mt-2 text-[12px] text-[#fca5a5]" use:tooltip={{ text: link.last_error, island: true }}>Sync failed — check connection</p>{/if}
								<div class="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" loading={syncBusy} onclick={syncNow}>Sync now</Button><Button size="sm" variant="outline" onclick={disconnect}>Disconnect GitHub</Button></div>
								{#if syncMessage}<p class="mt-2 text-[12px] text-[var(--pc-text-muted)]">{syncMessage}</p>{/if}
							</div>
						{/if}

						<div class="mt-5 border-t border-[var(--pc-border-strong)] pt-4">
							<div class="text-sm font-medium">Starter kits</div>
							<div class="mt-3 grid gap-2">
								{#each starterKits as kit}
									<div class="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--pc-border-strong)] px-3 py-3">
										<div class="min-w-0"><div class="text-[13px] font-medium">{kit.label}</div><div class="mt-1 max-w-[42ch] truncate text-[12px] text-[var(--pc-text-muted)]">{kitStatus(kitRepositories[kit.value])}</div></div>
										<Button size="sm" variant="outline" onclick={() => openKitSetup(kit.value)}>{kitRepositories[kit.value]?.repo_full_name ? 'Edit connection' : 'Connect repository'}</Button>
									</div>
								{/each}
							</div>
						</div>

						<div class="mt-5 border-t border-[var(--pc-border-strong)] pt-4">
							<div class="text-sm font-medium">Context repositories</div>
							<p class="mt-1 text-[13px]/[18px] text-[var(--pc-text-muted)]">Optional repositories for links and release details.</p>
							{#if contextLinks.length}<div class="mt-3 grid gap-2">{#each contextLinks as context}<div class="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--pc-border-strong)] px-3 py-2 text-[13px]"><span class="font-medium tracking-[-0.01em]">{context.repo_full_name}</span><Button size="sm" variant="outline" onclick={() => void removeContextRepo(context.repo_full_name)}>Remove</Button></div>{/each}</div>{/if}
							<div class="mt-3 flex gap-2"><Select value={contextRepo} onValueChange={(value) => { contextRepo = value; contextError = ''; }} options={[{ value: '', label: 'Choose a repository' }, ...repos.filter((repo) => repo.full_name !== link?.repo_full_name && !contextLinks.some((context) => context.repo_full_name === repo.full_name)).map((repo) => ({ value: repo.full_name, label: repo.full_name }))]} /><Button size="sm" variant="outline" loading={busy} onclick={saveContextRepo}>Add context</Button></div>
							{#if contextError}<p class="mt-2 text-[12px] text-[#fca5a5]" role="alert">{contextError}</p>{/if}
						</div>

						{#if kitSetupOpen}
							<div id="kit-repository-settings" class="mt-5 rounded-[10px] border border-[var(--pc-border-strong)] p-4">
								<div class="flex items-start justify-between gap-3"><div><div class="text-sm font-medium">Repository connection</div><p class="mt-1 text-[13px]/[18px] text-[var(--pc-text-muted)]">Choose where this workspace is edited outside ProductClient.</p></div><Button size="sm" variant="ghost" onclick={() => (kitSetupOpen = false)}>Cancel</Button></div>
								<div class="mt-4 grid gap-3">
									<div class="grid gap-1.5"><Label>Starter kit</Label><Select value={targetKit} onValueChange={chooseTargetKit} options={starterKits.map((kit) => ({ value: kit.value, label: kit.label }))} /></div>
									<div class="grid gap-1.5"><Label>Repository</Label><Select value={targetRepo} onValueChange={(value) => (targetRepo = value)} options={[{ value: '', label: 'Choose a repository' }, ...repos.map((repo) => ({ value: repo.full_name, label: repo.full_name + (repo.private ? ' · private' : '') }))]} /></div>
									<div class="grid gap-1.5"><Label for="target-branch">Branch</Label><Input id="target-branch" bind:value={targetBranch} placeholder="main" class="max-sm:text-base!" /></div>
									<div class="grid gap-1.5"><Label for="target-path">Content path</Label><Input id="target-path" bind:value={targetPath} placeholder="/" class="max-sm:text-base!" /></div>
									<div class="flex flex-wrap gap-2"><Button size="sm" loading={targetBusy} onclick={saveKitRepository}>{kitRepositories[targetKit] ? 'Save connection' : 'Connect repository'}</Button>{#if kitRepositories[targetKit]}<Button size="sm" variant="outline" onclick={() => void removeKitRepository(targetKit)}>Disconnect repository</Button>{/if}</div>
									{#if targetError}<p class="text-[12px] text-[#fca5a5]" role="alert">{targetError}</p>{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>

<style>
	:global(.font-mono) { font-family: var(--font-mono, ui-monospace, monospace); }
</style>
