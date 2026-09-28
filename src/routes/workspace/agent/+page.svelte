<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Button, Card, StatePanel, Toggle } from '$lib/components/ui';
	import { requireSession } from '$lib/auth/guard';
	import { supabase } from '$lib/supabaseClient';
	import { activeProductStore, hydrateActiveProduct } from '$lib/stores/activeProduct.svelte';
	import { isAgentV2 } from '$lib/agentV2';
	import { cn } from '$lib/utils.js';

	type Tool = { key: string; label: string; enabled: boolean; pin: string; config: Record<string, unknown>; sort_order: number };
	type Session = { id: string; stage: string; started_at: string; updated_at: string };

	let tab = $state<'overview' | 'tools' | 'conversations' | 'misses'>('overview');
	let v2 = $derived(isAgentV2(page.url));
	let activeId = $derived(activeProductStore.activeProductId);
	let activeSlug = $derived(activeProductStore.activeProduct?.slug ?? null);
	let headerTitle = $derived(activeSlug ? `${activeProductStore.activeProduct?.name ?? 'Product'} · Agent` : 'Agent');

	let enabled = $state(false);
	let greeting = $state('');
	let liveUrl = $state<string | null>(null);
	let tools = $state<Tool[]>([]);
	let sessions = $state<Session[]>([]);
	let counts = $state({ sessions7d: 0, leads: 0, visits: 0, handoffs: 0 });
	let misses = $state<string[]>([]);
	let agentThreads = $state(0);
	let expandedId = $state<string | null>(null);
	let transcript = $state<Array<{ role: string; body: string }>>([]);
	let workingMemory = $state<string | null>(null);
	let transcriptLoading = $state(false);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let lastLoadedFor = $state<string | undefined>(undefined);

	function publicSite(): string {
		try {
			const host = window.location.hostname;
			if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:4100';
		} catch { /* ignore */ }
		return 'https://productclient.com';
	}

	async function authHeader(): Promise<Record<string, string>> {
		if (!supabase) return {};
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		return token ? { authorization: `Bearer ${token}` } : {};
	}

	async function expandSession(id: string): Promise<void> {
		if (expandedId === id) {
			expandedId = null;
			return;
		}
		expandedId = id;
		transcript = [];
		workingMemory = null;
		if (!activeSlug) return;
		transcriptLoading = true;
		try {
			const res = await fetch(
				`${publicSite()}/api/agent/thread/${id}?slug=${encodeURIComponent(activeSlug)}`,
				{ headers: await authHeader() }
			);
			if (!res.ok) throw new Error('Could not load transcript');
			const data = (await res.json()) as {
				messages?: Array<{ role: string; body: string }>;
				workingMemory?: string | null;
			};
			transcript = Array.isArray(data.messages) ? data.messages : [];
			workingMemory = typeof data.workingMemory === 'string' ? data.workingMemory : null;
		} catch {
			transcript = [];
		} finally {
			transcriptLoading = false;
		}
	}

	async function deleteSession(id: string): Promise<void> {
		if (!activeSlug || saving) return;
		saving = true;
		try {
			const res = await fetch(`${publicSite()}/api/agent/thread/${id}?slug=${encodeURIComponent(activeSlug)}`, {
				method: 'DELETE',
				headers: await authHeader()
			});
			if (!res.ok) throw new Error('Could not delete');
			sessions = sessions.filter((s) => s.id !== id);
			if (expandedId === id) expandedId = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not delete';
		} finally {
			saving = false;
		}
	}

	async function load(): Promise<void> {
		const allowed = await requireSession('/workspace/agent');
		if (!allowed || !supabase) return;
		// MVP gate: without ?v2 the surface stays locked and loads nothing.
		if (!isAgentV2(page.url)) {
			loading = false;
			return;
		}
		if (!activeId) {
			loading = false;
			return;
		}
		loading = true;
		error = null;
		try {
			const [{ data: settings }, { data: prod }, { data: toolRows }, { data: sessionRows }] = await Promise.all([
				supabase.from('agent_settings').select('enabled,greeting').eq('product_id', activeId).maybeSingle(),
				supabase.from('products').select('live_url').eq('id', activeId).maybeSingle(),
				supabase.from('agent_tools').select('key,label,enabled,pin,config,sort_order').eq('product_id', activeId).order('sort_order'),
				supabase.from('agent_sessions').select('id,stage,started_at,updated_at').eq('product_id', activeId).order('updated_at', { ascending: false }).limit(50)
			]);
			enabled = (settings as { enabled?: boolean } | null)?.enabled === true;
			greeting = (settings as { greeting?: string | null } | null)?.greeting ?? '';
			liveUrl = (prod as { live_url?: string | null } | null)?.live_url ?? null;
			tools = ((toolRows ?? []) as Tool[]);
			sessions = ((sessionRows ?? []) as Session[]);
			const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
			const { data: events } = await supabase.from('product_contact_events').select('name').eq('product_id', activeId).gte('created_at', since);
			const by: Record<string, number> = {};
			for (const e of (events ?? []) as Array<{ name: string }>) by[e.name] = (by[e.name] ?? 0) + 1;
			counts = { sessions7d: sessions.length, leads: (by.lead_captured ?? 0) + (by.waitlisted ?? 0), visits: by.visited ?? 0, handoffs: by.handed_off ?? 0 };
			const { count } = await supabase.from('inbox_threads').select('id', { count: 'exact', head: true }).eq('product_id', activeId).eq('subject_type', 'agent');
			agentThreads = count ?? 0;
			const ids = sessions.map((s) => s.id);
			if (ids.length) {
				const { data: missRows } = await supabase.from('agent_messages').select('body').in('session_id', ids.slice(0, 200)).eq('role', 'system').like('body', 'miss:%').order('created_at', { ascending: false }).limit(50);
				misses = ((missRows ?? []) as Array<{ body: string }>).map((m) => m.body.replace(/^miss:\s*/, '').slice(0, 300));
			} else misses = [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not load Agent settings';
		} finally {
			loading = false;
			lastLoadedFor = activeId ?? undefined;
		}
	}

	async function setEnabled(value: boolean): Promise<void> {
		if (!supabase || !activeId || saving) return;
		if (activeId.startsWith('mock-')) {
			error = 'Select a real product — the demo entry cannot host an Agent.';
			return;
		}
		saving = true;
		try {
			// An expired session calls PostgREST as anon, which has no execute
			// grant on agent_enable and fails with a bare 403. Fail loudly first.
			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData.session) {
				error = 'Your session expired. Sign in again, then retry.';
				return;
			}
			if (value) {
				const { error } = await supabase.rpc('agent_enable', { p_product_id: activeId, p_greeting: greeting || null });
				if (error) throw error;
				const { data: toolRows } = await supabase.from('agent_tools').select('key,label,enabled,pin,config,sort_order').eq('product_id', activeId).order('sort_order');
				tools = ((toolRows ?? []) as Tool[]);
			} else {
				const { error } = await supabase.from('agent_settings').upsert({ product_id: activeId, enabled: false }, { onConflict: 'product_id' });
				if (error) throw error;
			}
			enabled = value;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not update';
		} finally {
			saving = false;
		}
	}

	async function saveGreeting(): Promise<void> {
		if (!supabase || !activeId || saving) return;
		saving = true;
		try {
			const { error } = await supabase.from('agent_settings').upsert({ product_id: activeId, greeting: greeting || null }, { onConflict: 'product_id' });
			if (error) throw error;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not save';
		} finally {
			saving = false;
		}
	}

	async function patchTool(tool: Tool, patch: Partial<Tool>): Promise<void> {
		if (!supabase || !activeId) return;
		if (tool.key === 'visit' && patch.enabled === true && !liveUrl) {
			error = 'Visit needs a live URL on the product first.';
			return;
		}
		const next = { ...tool, ...patch };
		tools = tools.map((t) => (t.key === tool.key ? next : t));
		const { error: updateError } = await supabase.from('agent_tools').update({ enabled: next.enabled, pin: next.pin }).eq('product_id', activeId).eq('key', tool.key);
		if (updateError) {
			tools = tools.map((t) => (t.key === tool.key ? tool : t));
		}
	}

	onMount(() => {
		void hydrateActiveProduct();
		const t = page.url.searchParams.get('tab');
		if (t === 'tools' || t === 'misses') tab = t;
	});

	$effect(() => {
		void activeId;
		if (!activeProductStore.hydrated) return;
		if (lastLoadedFor !== activeId) void load();
	});
</script>

<svelte:head><title>Agent | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[960px] px-6 max-sm:px-4">
	<WorkspaceHeader title={headerTitle} description="Answers visitors from this product's own pages and hands off to Inbox." />

	{#if !v2}
		<div class="py-6"><StatePanel title="Agent is a V2 preview" description="This surface is still an MVP. Add ?v2 to the URL to open it." /></div>
	{:else}
	<div class="flex gap-1.5 overflow-x-auto py-5" role="tablist" aria-label="Agent sections">
		{#each [{ id: 'overview', label: 'Overview' }, { id: 'tools', label: 'Tools' }, { id: 'conversations', label: 'Conversations' }, { id: 'misses', label: 'Misses' }] as t (t.id)}
			<button
				type="button"
				role="tab"
				aria-selected={tab === t.id}
				onclick={() => (tab = t.id as typeof tab)}
				class={cn('h-9 shrink-0 rounded-full px-4 text-[13px] font-medium', tab === t.id ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]')}
			>
				{t.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="space-y-3" role="status" aria-label="Loading Agent">
			<div class="h-24 rounded-[20px] bg-[var(--pc-surface-2)] animate-pulse"></div>
			<div class="h-24 rounded-[20px] bg-[var(--pc-surface-2)] animate-pulse"></div>
		</div>
	{:else if !activeId}
		<StatePanel title="No product selected" description="Pick a product to configure its Agent." />
	{:else}
		{#if error}<p class="mb-4 text-[13px] text-[var(--red-6)]" role="alert">{error}</p>{/if}

		{#if tab === 'overview'}
			<div class="space-y-3">
				<Card>
					<div class="flex items-center justify-between gap-4">
						<div>
							<p class="text-[14px] font-medium text-[var(--pc-text)]">Agent {enabled ? 'on' : 'off'}</p>
							<p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Lives on the public product page. Off hides the panel.</p>
						</div>
						<Toggle pressed={enabled} onPressedChange={(v) => void setEnabled(v)} disabled={saving} aria-label="Toggle Agent">{enabled ? 'On' : 'Off'}</Toggle>
					</div>
				</Card>
				<Card>
					<label class="block text-[13px] font-medium text-[var(--pc-text)]" for="agent-greeting">Greeting</label>
					<textarea id="agent-greeting" bind:value={greeting} rows="2" maxlength={280} placeholder="Hi, ask me anything about this product." class="mt-2 w-full rounded-[10px] bg-[var(--pc-surface)] px-3 py-2.5 text-[13px] outline-none placeholder:text-[var(--pc-text-faint)]"></textarea>
					<div class="mt-3"><Button variant="surface" size="sm" onclick={() => void saveGreeting()} disabled={saving}>Save greeting</Button></div>
				</Card>
				<div class="grid gap-3 sm:grid-cols-4">
					{#each [{ label: 'Sessions', value: counts.sessions7d }, { label: 'Leads', value: counts.leads }, { label: 'Visits', value: counts.visits }, { label: 'Handoffs', value: counts.handoffs }] as m (m.label)}
						<Card><p class="text-[20px] font-medium tabular-nums text-[var(--pc-text)]">{m.value}</p><p class="mt-1 text-[12px] text-[var(--pc-text-muted)]">{m.label} · 7d</p></Card>
					{/each}
				</div>
			</div>
		{:else if tab === 'tools'}
			<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{#each tools as tool (tool.key)}
					<Card>
						<p class="truncate text-[14px] font-medium text-[var(--pc-text)]">{tool.label}</p>
						<p class="mt-0.5 text-[12px] text-[var(--pc-text-faint)]">{tool.pin === 'both' ? 'Pinned to panel' : 'Agent only'}</p>
						<div class="mt-3 flex items-center justify-between gap-2">
							<button
								type="button"
								onclick={() => void patchTool(tool, { pin: tool.pin === 'both' ? 'agent_only' : 'both' })}
								class={cn('h-8 shrink-0 rounded-full px-3 text-xs font-medium', tool.pin === 'both' ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface-2)] text-[var(--pc-text-muted)]')}
								aria-pressed={tool.pin === 'both'}
							>
								Pin
							</button>
							<Toggle size="sm" pressed={tool.enabled} onPressedChange={(v) => void patchTool(tool, { enabled: v })} aria-label={`Toggle ${tool.label}`}>{tool.enabled ? 'On' : 'Off'}</Toggle>
						</div>
					</Card>
				{:else}
					<div class="col-span-full"><StatePanel title="No tools yet" description="Turn the Agent on to seed its default tools." /></div>
				{/each}
			</div>
		{:else if tab === 'conversations'}
			<div class="space-y-3">
				<Card>
					<p class="text-[14px] font-medium text-[var(--pc-text)]">{agentThreads} Agent thread{agentThreads === 1 ? '' : 's'}</p>
					<p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Handoffs land in Inbox. Reply there; the visitor sees it when the thread resumes.</p>
					<div class="mt-3"><Button href="/workspace/inbox" variant="surface" size="sm">Open Inbox</Button></div>
				</Card>
				{#each sessions as session (session.id)}
					<Card>
						<div class="flex items-center justify-between gap-3">
							<button type="button" onclick={() => void expandSession(session.id)} class="min-w-0 flex-1 text-left" aria-expanded={expandedId === session.id}>
								<p class="truncate text-[14px] font-medium text-[var(--pc-text)]">{new Date(session.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {session.stage.replace(/_/g, ' ')}</p>
								<p class="mt-0.5 text-[12px] text-[var(--pc-text-faint)]">{expandedId === session.id ? 'Hide transcript' : 'View transcript'}</p>
							</button>
							<button
								type="button"
								onclick={() => void deleteSession(session.id)}
								disabled={saving}
								class="h-8 shrink-0 rounded-full px-3 text-xs font-medium text-[var(--pc-text-faint)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)] disabled:opacity-50"
								aria-label="Delete this session everywhere"
							>
								Delete
							</button>
						</div>
						{#if expandedId === session.id}
							<div class="mt-3 border-t border-[var(--pc-border-strong)]/10 pt-3">
								{#if transcriptLoading}
									<p class="text-[13px] text-[var(--pc-text-faint)]">Loading…</p>
								{:else}
									{#if workingMemory}
										<p class="mb-3 whitespace-pre-wrap rounded-[12px] bg-[var(--pc-surface-2)] p-3 text-[12px] leading-[1.6] text-[var(--pc-text-muted)]">{workingMemory}</p>
									{/if}
									{#each transcript as msg, i (i)}
										<div class={cn('flex', msg.role === 'visitor' ? 'justify-end' : 'justify-start')}>
											<p class={cn('mb-2 max-w-[90%] text-[13px] leading-[1.6]', msg.role === 'visitor' ? 'rounded-[12px] bg-[var(--pc-surface-2)] px-3 py-2 text-[var(--pc-text)]' : 'text-[var(--pc-text-muted)]')}>{msg.body}</p>
										</div>
									{:else}
										<p class="text-[13px] text-[var(--pc-text-faint)]">No messages.</p>
									{/each}
								{/if}
							</div>
						{/if}
					</Card>
				{:else}
					<StatePanel title="No sessions yet" description="Sessions appear here after the first visitor chat." />
				{/each}
				<Card>
					<p class="text-[14px] font-medium text-[var(--pc-text)]">MCP endpoint</p>
					<p class="mt-1 break-all font-mono text-[12px] text-[var(--pc-text-muted)]">/api/mcp/product</p>
					<p class="mt-1 text-[12px] text-[var(--pc-text-faint)]">Read-only product graph for Cursor/Claude, on the public site host. No contacts, inbox, or ranking.</p>
				</Card>
			</div>
		{:else}
			<Card>
				<p class="text-[14px] font-medium text-[var(--pc-text)]">Misses</p>
				<p class="mt-1 text-[13px] text-[var(--pc-text-muted)]">Questions the Agent could not ground. Promote the repeats to docs.</p>
				{#if misses.length}
					<ul class="mt-3 space-y-2">
						{#each misses as miss, i (i)}
							<li class="text-[13px] leading-[1.6] text-[var(--pc-text-muted)]">{miss}</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-3 text-[13px] text-[var(--pc-text-faint)]">No misses yet.</p>
				{/if}
			</Card>
		{/if}
	{/if}
	{/if}
</div>
