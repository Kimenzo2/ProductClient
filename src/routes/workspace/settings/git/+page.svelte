<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
import { Check, Plug, Search, Settings } from 'reicon-svelte';
import { Button, Card, Input, Label, Select } from '$lib/components/ui';
import { tooltip } from '$lib/components/Tooltip.svelte';
import { supabase } from '$lib/supabaseClient';

	type Product = { id: string; name: string; slug: string };
	type Link = { product_id: string; repo_full_name: string; branch: string; docs_path: string; last_sha: string | null; last_synced_at: string | null; last_error: string | null; installation_id: number };
	type Repo = { full_name: string; default_branch: string; private: boolean };

	let products = $state<Product[]>([]);
	let activeProductId = $state<string | null>(null);
	let link = $state<Link | null>(null);
	let repos = $state<Repo[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let installationId = $state<number | null>(null);

	let selectedRepo = $state('');
	let branch = $state('main');
	let docsPath = $state('/');
	let busy = $state(false);

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
		if (!activeProductId) { link = null; return; }
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
			const qInst = page.url.searchParams.get('installation_id');
			if (qInst) installationId = Number(qInst);
		}
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

	onMount(async () => {
		try {
			await loadProducts();
			await loadLink();
			if (installationId) await loadRepos();
			// handle setup redirect notice
			if (page.url.searchParams.get('connected') === '1') notice = 'GitHub connected';
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
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch(`/api/github/install?product_id=${activeProductId}`, { headers: { authorization: `Bearer ${token}` } });
			const j = await res.json().catch(() => null);
			if (!j?.ok || !j.installUrl) throw new Error(j?.message ?? 'Could not create install URL');
			window.location.href = j.installUrl as string;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function saveLink() {
		if (!activeProductId || !installationId || !selectedRepo) { error = 'Pick a repo'; return; }
		busy = true;
		error = '';
		notice = '';
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch('/api/github/link', {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
				body: JSON.stringify({ product_id: activeProductId, installation_id: installationId, repo_full_name: selectedRepo, branch, docs_path: docsPath })
			});
			const j = await res.json().catch(() => null);
			if (!j?.ok) throw new Error(j?.message ?? j?.code ?? 'Could not save');
			link = j.link as Link;
			notice = 'Connected';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function disconnect() {
		if (!activeProductId) return;
		if (!confirm('Remove GitHub from this product?')) return;
		busy = true;
		try {
			const token = await authToken();
			if (!token) throw new Error('Not signed in');
			const res = await fetch(`/api/github/link?product_id=${activeProductId}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
			const j = await res.json().catch(() => null);
			if (!j?.ok) throw new Error(j?.message ?? 'Could not disconnect');
			link = null;
			notice = 'Disconnected';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
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

<svelte:head><title>Git · Settings</title></svelte:head>

<div class="mx-auto w-full max-w-[880px] space-y-6">
	<Card padding="lg">
		<div class="flex items-center gap-2"><Plug size={16} weight="Outline" aria-hidden="true" /><h2 class="text-[16px] font-medium">GitHub</h2><span use:tooltip={{ text: 'One repo per product. Pushes to the chosen branch update this product only.', island: true }} class="text-[var(--pc-text-faint)] cursor-help"><Settings size={12} weight="Outline" aria-hidden="true" /></span></div>

		{#if loading}
			<div class="mt-6 h-24 animate-pulse rounded-[12px] bg-[var(--pc-surface-2)]"></div>
		{:else}
			{#if !products.length}
				<div class="mt-6 rounded-[12px] bg-[var(--pc-surface)] p-4">
					<p class="text-[14px] font-medium text-[var(--pc-text)]">No products yet</p>
					<p class="mt-1 text-[14px] text-[var(--pc-text-muted)]">Create a product to connect docs.</p>
					<Button size="sm" class="mt-3" href="/workspace/products">Create a product</Button>
				</div>
			{:else}
				<div class="mt-5 grid gap-4">
					<div class="grid gap-1.5">
						<Label>Active product</Label>
						<Select value={activeProductId ?? ''} options={products.map((p) => ({ value: p.id, label: `${p.name} · ${p.slug}` }))} onValueChange={(v) => { activeProductId = v; void loadLink(); }} />
					</div>

					{#if error}<p class="rounded-[10px] bg-[rgba(248,113,113,0.12)] px-3 py-2 text-[13px] text-[#fca5a5]" role="alert">{error}</p>{/if}
					{#if notice}<p class="rounded-[10px] bg-[rgba(119,152,18,0.12)] px-3 py-2 text-[13px] text-[var(--pc-accent-light)]" role="status">{notice}</p>{/if}

					{#if link}
						<div class="rounded-[14px] border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] p-4">
							<div class="flex items-center gap-2 text-[13px] font-medium"><Check size={14} weight="Outline" aria-hidden="true" /> {link.repo_full_name} · {link.branch}<span use:tooltip={{ text: link.last_sha ? `Last synced ${link.last_synced_at ? new Date(link.last_synced_at).toLocaleString() : ''} · ${link.last_sha.slice(0,7)}` : 'Not yet synced', island: true }} class="text-[var(--pc-text-faint)] cursor-help"><Search size={12} weight="Outline" aria-hidden="true" /></span></div>
							{#if link.last_error}<p class="mt-2 text-[12px] text-[#fca5a5]" use:tooltip={{ text: link.last_error, island: true }}>Sync failed — check connection</p>{/if}
							<div class="mt-3 flex flex-wrap gap-2">
								<Button size="sm" variant="outline" loading={syncBusy} onclick={syncNow}>Sync now</Button>
								<Button size="sm" variant="outline" onclick={disconnect}>Disconnect</Button>
							</div>
							{#if syncMessage}<p class="mt-2 text-[12px] text-[var(--pc-text-muted)]">{syncMessage}</p>{/if}
						</div>
					{:else}
						{#if !installationId}
							<Button size="sm" loading={busy} onclick={connect}><Plug size={14} weight="Outline" aria-hidden="true" /> Connect GitHub</Button>
						{:else}
							<div class="grid gap-3">
								<div class="grid gap-1.5"><Label>Repository</Label>
									{#if repos.length}
										<Select bind:value={selectedRepo} options={repos.map((r) => ({ value: r.full_name, label: r.full_name + (r.private ? ' · private' : '') }))} />
									{:else}
										<div class="flex gap-2"><Input value={selectedRepo} placeholder="org/repo" oninput={(e: Event) => (selectedRepo = (e.target as HTMLInputElement).value)} class="flex-1 font-mono" /><Button size="sm" variant="outline" onclick={loadRepos}><Search size={14} weight="Outline" aria-hidden="true" /></Button></div>
									{/if}
								</div>
								<div class="grid grid-cols-2 gap-3">
									<div class="grid gap-1.5"><Label for="gh-branch">Branch</Label><Input id="gh-branch" bind:value={branch} placeholder="main" class="font-mono" /></div>
									<div class="grid gap-1.5"><Label for="gh-path">Folder</Label><Input id="gh-path" bind:value={docsPath} placeholder="/" class="font-mono" /></div>
								</div>
								<div class="flex gap-2">
									<Button size="sm" loading={busy} onclick={saveLink}>Save</Button>
									<Button size="sm" variant="outline" onclick={connect}>Change install</Button>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		{/if}
	</Card>

</div>

<style>
	:global(.font-mono) { font-family: var(--font-mono, ui-monospace, monospace); }
</style>
