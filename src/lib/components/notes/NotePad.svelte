<script lang="ts">
	import { CloseCircle, Trash, Clock } from 'reicon-svelte';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { supabase } from '$lib/supabaseClient';
	import { activeProductStore } from '$lib/stores/activeProduct.svelte.js';
	import { Select } from '$lib/components/ui';

	// P-Landing owns notes. The dashboard is a thin client: GET renders the
	// current note + taps, POST supersedes, PATCH extends, DELETE ends now. Auth = the maker's
	// Supabase JWT; CORS allow-list covers localhost:3000 + the app origin.
	interface NoteRow {
		id: string;
		text: string;
		kind: string;
		meta: string | null;
		href: string | null;
		created_at: string;
		expires_at: string;
	}
	interface TapRow {
		note_id: string;
		note_text: string;
		taps: number;
		posted_at: string;
	}

	let {
		open = $bindable(false),
		onclose
	}: {
		open?: boolean;
		onclose?: () => void;
	} = $props();

	// Fill/ink mirror NoteBubble's tone palettes exactly, so the picker and
	// the live-note card preview what actually ships on the public card.
	const KINDS = [
		{ value: 'human', label: 'Note', fill: '#212328', ink: '#f5f5f5' },
		{ value: 'offer', label: 'Offer', fill: '#3c2b28', ink: '#ffd9cf' },
		{ value: 'momentum', label: 'Update', fill: '#2b3444', ink: '#dbe7ff' },
		{ value: 'question', label: 'Question', fill: '#27343a', ink: '#cdeee6' },
		{ value: 'scarcity', label: 'Limited', fill: '#3c2b28', ink: '#ffd9cf' },
		{ value: 'milestone', label: 'Milestone', fill: '#2c3524', ink: '#e2f4c2' }
	] as const;
	const EXPIRY_OPTIONS = [
		{ value: '1', label: '1 hour' },
		{ value: '24', label: '24 hours' },
		{ value: '168', label: '7 days' },
		{ value: 'custom', label: 'Choose an end time' }
	];

	const MAX_TEXT = 80;
	const MAX_META = 40;

	let text = $state('');
	let kind = $state<string>('human');
	let meta = $state('');
	let href = $state('');
	let expiryChoice = $state<'1' | '24' | '168' | 'custom'>('24');
	let customExpiry = $state('');

	let current = $state<NoteRow | null>(null);
	let taps = $state(0);
	let loading = $state(false);
	let saving = $state(false);
	let extending = $state(false);
	let ending = $state(false);
	let error = $state<string | null>(null);
	let savedHint = $state(false);
	let confirmEnd = $state(false);
	let panel = $state<HTMLElement | undefined>(undefined);

	const product = $derived(activeProductStore.activeProduct);
	const isMock = $derived(!product || product.id.startsWith('mock-'));
	const live = $derived(!!current && new Date(current.expires_at).getTime() > Date.now());
	const currentTone = $derived(KINDS.find((k) => k.value === current?.kind) ?? KINDS[0]);
	const textLeft = $derived(MAX_TEXT - text.trim().length);
	const metaLeft = $derived(MAX_META - meta.trim().length);
	const MAX_NOTE_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
	const canExtend = $derived(
		!!current && live && new Date(current.expires_at).getTime() + 24 * 60 * 60 * 1000 <= new Date(current.created_at).getTime() + MAX_NOTE_LIFETIME_MS
	);
	const canSave = $derived(text.trim().length > 0 && textLeft >= 0 && metaLeft >= 0 && expiryIsValid() && !saving && !isMock);
	const hoursLeft = $derived.by(() => {
		if (!current || !live) return null;
		const ms = new Date(current.expires_at).getTime() - Date.now();
		const h = Math.floor(ms / 3_600_000);
		const m = Math.floor((ms % 3_600_000) / 60_000);
		return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
	});

	function expiryTimestamp(): number {
		if (expiryChoice === 'custom') return customExpiry ? new Date(customExpiry).getTime() : Number.NaN;
		return Date.now() + Number(expiryChoice) * 3_600_000;
	}

	function expiryIsValid(): boolean {
		const expiresAt = expiryTimestamp();
		const now = Date.now();
		return Number.isFinite(expiresAt) && expiresAt > now + 5 * 60_000 && expiresAt <= now + MAX_NOTE_LIFETIME_MS;
	}

	function expiryPayload(): { expiry_hours: number } | { expires_at: string } {
		if (expiryChoice === 'custom') return { expires_at: new Date(customExpiry).toISOString() };
		return { expiry_hours: Number(expiryChoice) };
	}

	function toLocalDateTimeInput(date: Date): string {
		return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
	}

	const customExpiryMin = toLocalDateTimeInput(new Date(Date.now() + 5 * 60_000));
	const customExpiryMax = toLocalDateTimeInput(new Date(Date.now() + MAX_NOTE_LIFETIME_MS));

	// Load the product's current note + taps each time the pad opens.
	$effect(() => {
		if (open) void load();
	});

	async function siteOrigin(): Promise<string> {
		try {
			const host = window.location.hostname;
			if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:4100';
		} catch { /* ignore */ }
		return 'https://productclient.com';
	}

	async function authHeaders(): Promise<Record<string, string>> {
		if (!supabase) return {};
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		return token ? { authorization: `Bearer ${token}` } : {};
	}

	async function load(): Promise<void> {
		if (!product || isMock) return;
		loading = true;
		error = null;
		savedHint = false;
		try {
			const res = await fetch(`${await siteOrigin()}/api/notes?product_id=${encodeURIComponent(product.id)}`, {
				headers: await authHeaders()
			});
			if (!res.ok) throw new Error('Could not load the current note');
			const data = (await res.json()) as { current: NoteRow | null; history: TapRow[] };
			current = data.current;
			const liveTap = (data.history ?? []).find((t) => current && t.note_id === current.id);
			taps = liveTap?.taps ?? 0;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not load the current note';
		} finally {
			loading = false;
		}
	}

	function close(): void {
		open = false;
		confirmEnd = false;
		error = null;
		savedHint = false;
		text = '';
		kind = 'human';
		meta = '';
		href = '';
		expiryChoice = '24';
		customExpiry = '';
		onclose?.();
	}

	async function save(): Promise<void> {
		if (!canSave || !product) {
			if (expiryChoice === 'custom' && !expiryIsValid()) error = 'Choose an end time at least 5 minutes from now and within 30 days.';
			return;
		}
		saving = true;
		error = null;
		savedHint = false;
		try {
			const res = await fetch(`${await siteOrigin()}/api/notes`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...(await authHeaders()) },
				body: JSON.stringify({
					product_id: product.id,
					text: text.trim(),
					kind,
					...expiryPayload(),
					...(meta.trim() ? { meta: meta.trim() } : {}),
					...(href.trim() ? { href: href.trim() } : {})
				})
			});
			const data = (await res.json().catch(() => null)) as { id?: string; error?: string; code?: string } | null;
			if (res.status === 429) throw new Error('Hold on — you can post a new note 10 minutes after the last one.');
			if (!res.ok) throw new Error(data?.error ?? 'Could not post the note');
			savedHint = true;
			text = '';
			kind = 'human';
			meta = '';
			href = '';
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not post the note';
		} finally {
			saving = false;
		}
	}

	async function extend24Hours(): Promise<void> {
		if (!product || !current || !canExtend || extending) return;
		extending = true;
		error = null;
		try {
			const res = await fetch(`${await siteOrigin()}/api/notes`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json', ...(await authHeaders()) },
				body: JSON.stringify({ product_id: product.id, note_id: current.id })
			});
			const data = (await res.json().catch(() => null)) as { error?: string } | null;
			if (!res.ok) throw new Error(data?.error ?? 'Could not extend the note');
			savedHint = true;
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not extend the note';
		} finally {
			extending = false;
		}
	}

	async function endNow(): Promise<void> {
		if (!product || ending) return;
		ending = true;
		error = null;
		try {
			const res = await fetch(`${await siteOrigin()}/api/notes?product_id=${encodeURIComponent(product.id)}`, {
				method: 'DELETE',
				headers: await authHeaders()
			});
			if (!res.ok) throw new Error('Could not end the note');
			confirmEnd = false;
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not end the note';
		} finally {
			ending = false;
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<button type="button" class="fixed inset-0 z-40 cursor-default bg-transparent" aria-label="Close" onclick={close}></button>

	<div class="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Post a note">
		<div
			bind:this={panel}
			in:scale={{ start: 0.97, duration: 150, easing: cubicOut }}
			class="flex w-full max-w-[456px] max-h-[min(90dvh,760px)] flex-col overflow-hidden rounded-[20px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)]"
			style:background="var(--pc-bg)"
		>
			<!-- Header -->
			<div class="shrink-0 px-5 pt-5 pb-4">
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<h2 class="text-lg font-medium leading-[1.2] tracking-[-0.01em] text-[var(--pc-text)]">Post a note</h2>
						<p class="mt-1 text-[13px] leading-[1.45] text-[var(--pc-text-muted)]">
							{!product || isMock ? 'Pick a real product first.' : `A short update on ${product.name}'s feed.`}
						</p>
					</div>
					<button
						type="button"
						onclick={close}
						aria-label="Close"
						class="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--pc-surface)] text-[var(--pc-text-muted)] transition-[background-color] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]"
					>
						<CloseCircle size={18} weight="Outline" aria-hidden="true" />
					</button>
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
				{#if loading}
					<p class="py-6 text-center text-[13px] text-[var(--pc-text-muted)]">Loading…</p>
				{:else}
					<div class="grid gap-6">
					<!-- Current note -->
					{#if current && live}
						<!-- Live preview: painted with the note's actual bubble tone -->
						<div class="rounded-[14px] px-4 py-3.5" style:background={currentTone.fill} style:color={currentTone.ink}>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-[13.5px] leading-[1.45] text-pretty">{current.text}</p>
									<p class="mt-1.5 flex items-center gap-1.5 text-[11px] tracking-[-0.01em] opacity-60">
										<Clock size={11} weight="Outline" aria-hidden="true" />
										{hoursLeft}
										{#if taps > 0}<span aria-hidden="true">·</span>{taps} tap{taps === 1 ? '' : 's'}{/if}
									</p>
									{#if canExtend}
										<button type="button" onclick={extend24Hours} disabled={extending} class="mt-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/15 disabled:opacity-50">
											{extending ? 'Extending…' : 'Keep live 24 hours'}
										</button>
									{/if}
								</div>
								{#if confirmEnd}
									<div class="flex shrink-0 items-center gap-1.5">
										<button
											type="button"
											onclick={endNow}
											disabled={ending}
											class="rounded-full px-2.5 py-1 text-[11px] font-medium text-[#fca5a5] transition-colors hover:bg-white/10 disabled:opacity-50"
										>
											{ending ? 'Ending…' : 'End it'}
										</button>
										<button
											type="button"
											onclick={() => (confirmEnd = false)}
											class="rounded-full px-2.5 py-1 text-[11px] font-medium opacity-70 transition-opacity hover:opacity-100"
										>
											Keep
										</button>
									</div>
								{:else}
									<button
										type="button"
										onclick={() => (confirmEnd = true)}
										aria-label="End this note now"
										class="grid size-7 shrink-0 place-items-center rounded-full opacity-60 transition-[opacity,background-color] hover:bg-white/10 hover:opacity-100"
									>
										<Trash size={14} weight="Outline" aria-hidden="true" />
									</button>
								{/if}
							</div>
						</div>
						<p class="mt-2 text-[12px] leading-[1.5] text-[var(--pc-text-muted)]">Posting a new note replaces this one.</p>
					{:else if current}
						<p class="text-[12px] leading-[1.5] text-[var(--pc-text-muted)]">Your last note has expired. Post a fresh one below.</p>
					{/if}

					<!-- Composer -->
					<div class="grid gap-2">
						<label for="notepad-text" class="text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">What's happening?</label>
						<textarea
							id="notepad-text"
							bind:value={text}
							rows={2}
							maxlength={MAX_TEXT + 20}
							placeholder="ship day. coffee level: critical"
							class="mt-2 w-full resize-none rounded-[12px] border border-transparent bg-[var(--pc-surface)] px-3.5 py-3 text-[14px] leading-[1.45] tracking-[-0.01em] text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]"
						></textarea>
						<div class="flex items-center justify-between gap-3">
							<span class="text-[11px] text-[var(--pc-text-muted)]">Shows on your launch card</span>
							<span class="tabular-nums text-[11px] {textLeft < 0 ? 'text-[#fca5a5]' : 'text-[var(--pc-text-muted)]'}">{textLeft}</span>
						</div>
					</div>

					<div class="grid gap-2">
						<label for="notepad-expiry" class="text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">Keep in feed for</label>
						<Select id="notepad-expiry" bind:value={expiryChoice} options={EXPIRY_OPTIONS} />
						{#if expiryChoice === 'custom'}
							<label for="notepad-custom-expiry" class="sr-only">Note end time</label>
							<input id="notepad-custom-expiry" type="datetime-local" min={customExpiryMin} max={customExpiryMax} bind:value={customExpiry} class="h-11 w-full rounded-[12px] border border-[var(--pc-border-strong)] bg-[var(--pc-bg)] px-3.5 text-[13px] text-[var(--pc-text)] outline-none transition-[background-color,border-color] focus:bg-[var(--pc-surface)] focus-visible:border-[var(--pc-focus-ring)]" />
						{/if}
					</div>

					<!-- Kind — tone swatches previewing the exact bubble fill/ink -->
					<fieldset>
						<legend class="flex w-full items-center justify-between text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">
							Kind
							<span class="text-[11px] font-normal tracking-[-0.01em] text-[var(--pc-text-muted)]">Tints your note bubble</span>
						</legend>
						<div class="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Note kind">
							{#each KINDS as k (k.value)}
								<button
									type="button"
									role="radio"
									aria-checked={kind === k.value}
									onclick={() => (kind = k.value)}
									class="grid h-10 place-items-center rounded-[12px] text-[12px] font-medium tracking-[-0.01em] transition-[opacity,box-shadow] duration-150 focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] {kind === k.value ? 'opacity-100' : 'opacity-70 hover:opacity-100'}"
									style:background={k.fill}
									style:color={k.ink}
									style:box-shadow={kind === k.value ? '0 0 0 1.5px var(--pc-text), 0 0 0 3px var(--pc-bg)' : 'none'}
								>
									{k.label}
								</button>
							{/each}
						</div>
					</fieldset>

					<!-- Optional meta + link -->
					<div class="grid gap-4">
						<div>
							<div class="flex items-center justify-between">
								<label for="notepad-meta" class="text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">Tag <span class="font-normal text-[var(--pc-text-muted)]">(optional)</span></label>
								<span class="tabular-nums text-[11px] {metaLeft < 0 ? 'text-[#fca5a5]' : 'text-[var(--pc-text-muted)]'}">{metaLeft}</span>
							</div>
							<input
								id="notepad-meta"
								type="text"
								bind:value={meta}
								maxlength={MAX_META + 10}
								placeholder="e.g. SHIPDAY20"
								class="mt-2 h-10 w-full rounded-[10px] border border-transparent bg-[var(--pc-surface)] px-3 text-[13px] tracking-[-0.01em] text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]"
							/>
						</div>
						<div>
							<label for="notepad-href" class="text-[13px] font-medium tracking-[-0.01em] text-[var(--pc-text)]">Link <span class="font-normal text-[var(--pc-text-muted)]">(optional, https)</span></label>
							<input
								id="notepad-href"
								type="url"
								bind:value={href}
								placeholder="https://…"
								class="mt-2 h-10 w-full rounded-[10px] border border-transparent bg-[var(--pc-surface)] px-3 text-[13px] tracking-[-0.01em] text-[var(--pc-text)] placeholder:text-[var(--pc-text-faint)] outline-none transition-[background-color] focus:bg-[var(--pc-surface-2)]"
							/>
						</div>
					</div>

					{#if error}<p class="rounded-[12px] bg-[#fca5a5]/10 px-3 py-2 text-[13px] leading-[1.5] text-[#fca5a5]" role="alert">{error}</p>{/if}
					{#if savedHint}<p class="text-[13px] leading-[1.5] text-[var(--pc-text)]" role="status">Note is live.</p>{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="shrink-0 border-t border-[var(--pc-border-strong)]/10 px-5 py-4">
				<div class="flex items-center justify-end gap-2">
					<button
						type="button"
						onclick={close}
						class="inline-flex h-10 items-center justify-center rounded-full border border-[var(--pc-border-strong)] bg-[var(--pc-surface)] px-5 text-sm font-medium text-[var(--pc-text)] transition-[background-color] hover:bg-[var(--pc-surface-2)]"
					>
						Close
					</button>
					<button
						type="button"
						onclick={save}
						disabled={!canSave}
						class="inline-flex h-10 items-center justify-center rounded-full bg-[var(--pc-text)] px-5 text-sm font-medium text-[var(--pc-bg)] transition-[opacity,transform] hover:opacity-[0.88] active:scale-[0.98] disabled:opacity-50"
					>
						{saving ? 'Posting…' : current && live ? 'Replace note' : 'Post note'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
