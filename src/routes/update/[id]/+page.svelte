<script lang="ts">
	import { page } from '$app/state';
	import { mockStates } from '$lib/data/mockStates';
	import { Verified, Add, Heart, Dislike, Share, Upload, ArrowRight, Book, CheckCircle } from 'reicon-svelte';
	import { Button, Card, Chip } from '$lib/components/ui';
	import { publicDocs, publicIncidents } from '$lib/data/public';

	let id = $derived(page.params.id);
	let data = $derived(mockStates.find((s) => s.id === id) ?? mockStates[0]);
	let following = $state(false);
	let liked = $state(false);
	let disliked = $state(false);
	let saved = $state(false);
	let shared = $state(false);
	let likes = $state(3412);

	function toggleLike() {
		liked = !liked;
		if (liked) disliked = false;
		likes += liked ? 1 : -1;
	}

	function toggleDislike() {
		disliked = !disliked;
		if (disliked && liked) { liked = false; likes -= 1; }
	}

	async function shareUpdate() {
		if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined') {
			await navigator.clipboard.writeText(window.location.href);
			shared = true;
			setTimeout(() => (shared = false), 1800);
		}
	}

	let relatedDocs = $derived(publicDocs.filter((doc) => doc.productSlug === data.product.slug).slice(0, 2));
	let relatedIncidents = $derived(publicIncidents.filter((incident) => incident.productSlug === data.product.slug).slice(0, 2));
</script>

<svelte:head>
	<title>{data.title} — Product Client</title>
</svelte:head>

<div class="w-full px-3 md:px-4 py-4 md:py-6">
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_402px] gap-6">
		<!-- Left – Update detail -->
		<div class="min-w-0 pc-enter">
			<!-- Player – double-bezel -->
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner relative aspect-[4/3] w-full overflow-hidden bg-black">
					<img src={data.thumbnail} alt={data.title} class="h-full w-full object-cover" />
					<span class="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-700 tracking-wide uppercase text-white backdrop-blur">{data.type}</span>
				</div>
			</div>

			<!-- Title -->
			<h1 class="mt-4 text-[19px] md:text-[21px] font-700 leading-tight tracking-tight">
				{data.title}
			</h1>

			<!-- Maker + actions -->
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<a href="/p/{data.product.slug}" class="flex items-center gap-3">
					<img src={data.product.avatar} alt={data.product.name} class="size-10 rounded-full object-cover" />
					<span>
						<span class="flex items-center gap-1 text-sm font-700 leading-none">{data.product.name} {#if data.product.verified}<Verified size={14} weight="Outline" color="var(--blue-6)" />{/if}</span>
						<span class="text-xs text-[var(--pc-text-muted)]">12.4k followers • @{data.maker.handle}</span>
					</span>
				</a>
				<button
					type="button"
					onclick={() => (following = !following)}
					class={[
						'ml-1 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-700 transition',
						following ? 'bg-[var(--pc-surface-2)] border border-[var(--pc-border)]' : 'bg-[var(--pc-text)] text-[var(--pc-bg)] hover:opacity-90'
					].join(' ')}
				>
					{#if !following}<Add size={14} weight="Outline" />{/if}
					{following ? 'Following' : 'Follow'}
				</button>
				<div class="ml-auto flex items-center gap-2">
					<div class="flex items-center overflow-hidden rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface-2)]">
						<button type="button" onclick={toggleLike} aria-pressed={liked} class={[
							'inline-flex items-center gap-2 px-4 py-2 text-sm font-600 hover:bg-[var(--pc-surface)] transition',
							liked ? 'text-[var(--blue-6)]' : ''
						].join(' ')}>
							<Heart size={16} weight="Outline" color={liked ? 'currentColor' : undefined} />
							{likes.toLocaleString()}
						</button>
						<span class="h-6 w-px bg-[var(--pc-border)]"></span>
						<button type="button" onclick={toggleDislike} aria-pressed={disliked} class={['grid size-9 place-items-center transition hover:bg-[var(--pc-surface)]', disliked ? 'text-[var(--red-6)]' : ''].join(' ')} aria-label="Dislike">
							<Dislike size={16} weight="Outline" />
						</button>
					</div>
					<button type="button" onclick={shareUpdate} class="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-4 py-2 text-sm font-600 transition-[background-color,color] hover:bg-[var(--pc-border)]" aria-label="Copy update link">
						<Share size={16} weight="Outline" />
						{shared ? 'Copied' : 'Share'}
					</button>
					<button type="button" onclick={() => (saved = !saved)} aria-pressed={saved} class="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-4 py-2 text-sm font-600 transition-[background-color,color] hover:bg-[var(--pc-border)]">
						<Upload size={16} weight="Outline" />
						{saved ? 'Saved' : 'Save'}
					</button>
				</div>
			</div>
			<p class="mt-2 text-right text-[11px] text-[var(--pc-text-faint)]" role="status">{saved ? 'Saved to your collection.' : shared ? 'Link copied to clipboard.' : ''}</p>

			<!-- Description / Changelog – double-bezel -->
			<div class="mt-4 pc-bezel p-1.5">
				<div class="pc-bezel-inner bg-[var(--pc-surface-2)] p-4">
					<div class="flex items-center gap-3 text-sm">
						<span class="font-700">{data.reads} reads</span>
						<span class="text-[var(--pc-text-muted)]">{data.postedAt}</span>
						<span class="inline-flex items-center rounded-full bg-[var(--pc-surface)] border border-[var(--pc-border)] px-2.5 py-1 text-xs font-700 uppercase tracking-wide">{data.type}</span>
						<span class="inline-flex items-center gap-1 text-xs font-600" style:color="var(--color-green-600)"><span class="size-2 rounded-full animate-pulse" style:background="var(--color-green-600)"></span> Uptime: 99.98%</span>
					</div>
					<p class="mt-3 text-sm leading-relaxed text-[var(--pc-text-muted)]">
						{data.description} This update ships with markdown changelog and feedback thread. Builders can attach incident notes, roadmap items and tag fixes.
					</p>
					<div class="mt-3 grid md:grid-cols-3 gap-3 text-xs">
						<div class="rounded-[10px] bg-[var(--pc-surface)] border border-[var(--pc-border)] p-3">
							<p class="font-700">Changelog</p>
							<p class="text-[var(--pc-text-muted)]">3 features • 7 fixes • 2 docs</p>
						</div>
						<div class="rounded-[10px] bg-[var(--pc-surface)] border border-[var(--pc-border)] p-3">
							<p class="font-700">Incident log</p>
							<p class="text-[var(--pc-text-muted)]">Last incident 9 hours ago • Resolved</p>
						</div>
						<div class="rounded-[10px] bg-[var(--pc-surface)] border border-[var(--pc-border)] p-3">
							<p class="font-700">Feedback</p>
							<p class="text-[var(--pc-text-muted)]">42 open • Avg response 4h</p>
						</div>
					</div>
					<details class="mt-3">
						<summary class="cursor-pointer text-sm font-600">Show more …</summary>
						<pre class="mt-3 whitespace-pre-wrap rounded-[10px] bg-[var(--pc-surface)] border border-[var(--pc-border)] p-3 text-xs leading-5">## Changes
- Realtime vision pipeline (3x faster)
- New composer with persistent state
- Fix: terminal timeout on long runs
- Fix: status page webhooks delayed (root cause DNS)

Links: github.com • docs • status</pre>
					</details>
				</div>
			</div>
		</div>

		<!-- Right – connected context -->
		<aside class="min-w-0 space-y-4">
			<Card padding="md"><div class="flex items-center gap-2"><CheckCircle size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Keep exploring</h2></div><p class="mt-3 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">This update is one part of the product record. Follow the links the team uses to explain and operate it.</p><div class="mt-4 space-y-1"><a href="/p/{data.product.slug}" class="flex items-center gap-2 rounded-[10px] px-2 py-2 text-xs hover:bg-[var(--pc-surface)]"><ArrowRight size={13} weight="Outline" /> Product profile</a><a href="/status/{data.product.slug}" class="flex items-center gap-2 rounded-[10px] px-2 py-2 text-xs hover:bg-[var(--pc-surface)]"><ArrowRight size={13} weight="Outline" /> Status history</a></div></Card>
			{#if relatedDocs.length > 0}<Card padding="md"><div class="flex items-center gap-2"><Book size={15} weight="Outline" class="opacity-55" /><h2 class="text-[13px] font-medium">Related docs</h2></div>{#each relatedDocs as doc (doc.slug)}<a href={doc.publicPath} class="mt-3 block text-xs text-[var(--pc-accent-light)] hover:underline">{doc.title}</a>{/each}</Card>{/if}
			{#if relatedIncidents.length > 0}<Card padding="md"><div class="flex items-center gap-2"><Chip size="xs" variant="accent">{relatedIncidents.length}</Chip><h2 class="text-[13px] font-medium">Incident context</h2></div>{#each relatedIncidents as incident (incident.id)}<a href={`${incident.publicPath}#${incident.id}`} class="mt-3 block text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]">{incident.title} · {incident.status}</a>{/each}</Card>{/if}
		</aside>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
