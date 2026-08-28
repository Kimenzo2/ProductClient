<script lang="ts">
	import { page } from '$app/state';
	import { mockStates } from '$lib/data/mockStates';
	import VideoCard from '$lib/components/video/VideoCard.svelte';
	import { Play, Verified, Add, Heart, Dislike, Share, Upload } from 'reicon-svelte';

	let id = $derived(page.params.id);
	let data = $derived(mockStates.find((s) => s.id === id) ?? mockStates[0]);
	let related = $derived(mockStates.filter((s) => s.id !== data.id).slice(0, 6));
	let subscribed = $state(false);
	let liked = $state(false);
	let likes = $state(3412);

	function toggleLike() {
		liked = !liked;
		likes += liked ? 1 : -1;
	}
</script>

<svelte:head>
	<title>{data.title} — Product Client</title>
</svelte:head>

<div class="w-full px-3 md:px-4 py-4 md:py-6">
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_402px] gap-6">
		<!-- Left – Watch -->
		<div class="min-w-0 pc-enter">
			<!-- Player – double-bezel -->
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner relative aspect-video w-full overflow-hidden bg-black">
					<img src={data.thumbnail} alt={data.title} class="h-full w-full object-cover" />
					<button aria-label="Play" class="absolute inset-0 grid place-items-center bg-black/5 hover:bg-black/10 transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group">
						<span class="grid size-16 place-items-center rounded-full bg-white text-black shadow-xl group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
							<Play size={24} weight="Outline" color="black" />
						</span>
					</button>
					<span class="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-700 tracking-wide uppercase text-white backdrop-blur">Now playing • {data.type}</span>
					<span class="pointer-events-none absolute bottom-3 right-3 rounded-[6px] bg-black/80 px-2 py-1 text-xs font-600 text-white backdrop-blur">{data.duration}</span>
				</div>
			</div>

			<!-- Title -->
			<h1 class="mt-4 text-[19px] md:text-[21px] font-700 leading-tight tracking-tight">
				{data.title}
			</h1>

			<!-- Maker + actions -->
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<a href="/p/{data.product.slug}" class="flex items-center gap-3">
					<img src={data.product.avatar} alt={data.product.name} class="size-10 rounded-full object-cover ring-1 ring-[var(--pc-border)]" />
					<span>
						<span class="flex items-center gap-1 text-sm font-700 leading-none">{data.product.name} {#if data.product.verified}<Verified size={14} weight="Outline" color="var(--blue-6)" />{/if}</span>
						<span class="text-xs text-[var(--pc-text-muted)]">12.4k subscribers • @{data.maker.handle}</span>
					</span>
				</a>
				<button
					onclick={() => (subscribed = !subscribed)}
					class={[
						'ml-1 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-700 transition',
						subscribed ? 'bg-[var(--pc-surface-2)] border border-[var(--pc-border)]' : 'bg-[var(--pc-text)] text-[var(--pc-bg)] hover:opacity-90'
					].join(' ')}
				>
					{#if !subscribed}<Add size={14} weight="Outline" />{/if}
					{subscribed ? 'Subscribed' : 'Subscribe'}
				</button>
				<div class="ml-auto flex items-center gap-2">
					<div class="flex items-center overflow-hidden rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface-2)]">
						<button onclick={toggleLike} class={[
							'inline-flex items-center gap-2 px-4 py-2 text-sm font-600 hover:bg-[var(--pc-surface)] transition',
							liked ? 'text-[var(--blue-6)]' : ''
						].join(' ')}>
							<Heart size={16} weight="Outline" color={liked ? 'currentColor' : undefined} />
							{likes.toLocaleString()}
						</button>
						<span class="h-6 w-px bg-[var(--pc-border)]"></span>
						<button class="grid size-9 place-items-center hover:bg-[var(--pc-surface)] transition" aria-label="Dislike">
							<Dislike size={16} weight="Outline" />
						</button>
					</div>
					<button class="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-4 py-2 text-sm font-600 hover:bg-[var(--pc-border)]">
						<Share size={16} weight="Outline" />
						Share
					</button>
					<button class="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--pc-surface-2)] px-4 py-2 text-sm font-600 hover:bg-[var(--pc-border)]">
						<Upload size={16} weight="Outline" />
						Save
					</button>
				</div>
			</div>

			<!-- Description / Changelog – double-bezel -->
			<div class="mt-4 pc-bezel p-1.5">
				<div class="pc-bezel-inner bg-[var(--pc-surface-2)] p-4">
				<div class="flex items-center gap-3 text-sm">
					<span class="font-700">{data.views} views</span>
					<span class="text-[var(--pc-text-muted)]">{data.postedAt}</span>
					<span class="inline-flex items-center rounded-full bg-[var(--pc-surface)] border border-[var(--pc-border)] px-2.5 py-1 text-xs font-700 uppercase tracking-wide">{data.type}</span>
					<span class="inline-flex items-center gap-1 text-xs font-600 text-[var(--green-7)]"><span class="size-2 rounded-full bg-[var(--green-6)] animate-pulse"></span> Uptime: 99.98%</span>
				</div>
				<p class="mt-3 text-sm leading-relaxed text-[var(--pc-text-muted)]">
					{data.description} This update ships with full video, markdown changelog, and feedback thread. Builders can attach incident notes, roadmap items and tag fixes.
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

			<!-- Feedback thread -->
			<div class="mt-6">
				<h3 class="text-sm font-700">Feedback • 18 comments</h3>
				<div class="mt-3 flex gap-3">
					<img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="you" class="size-8 rounded-full" />
					<div class="flex-1 flex gap-2">
						<input placeholder="Send feedback / report a bug…" class="flex-1 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--pc-border-strong)]" />
						<button class="rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] px-5 py-2 text-sm font-700">Send</button>
					</div>
				</div>
				<div class="mt-5 space-y-4">
					{#each [{user:'Ava', avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text:'This launch video is *chef\'s kiss* — finally a changelog I actually want to watch.', time:'2h ago'}, {user:'Mika', avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', text:'Incident bit was super transparent. Love the status inline.', time:'5h ago'}] as c}
						<div class="flex gap-3">
							<img src={c.avatar} alt={c.user} class="size-8 rounded-full" />
							<div class="min-w-0">
								<p class="text-sm"><span class="font-700">@{c.user}</span> <span class="text-xs text-[var(--pc-text-muted)]">• {c.time}</span></p>
								<p class="text-sm text-[var(--pc-text)]">{c.text}</p>
								<div class="mt-1 flex gap-3 text-xs text-[var(--pc-text-muted)]"><button class="hover:text-[var(--pc-text)]">Like</button><button class="hover:text-[var(--pc-text)]">Reply</button></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Right – Up next -->
		<div class="min-w-0">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-700">Up next</h3>
				<label class="flex items-center gap-2 text-xs font-600 text-[var(--pc-text-muted)]"><input type="checkbox" checked /> Autoplay</label>
			</div>
			<div class="mt-3 space-y-3">
				{#each related as item (item.id)}
					<a href="/watch/{item.id}" class="flex gap-2 group">
						<div class="relative w-[168px] shrink-0 aspect-video overflow-hidden rounded-[10px] bg-[var(--pc-surface-2)]">
							<img src={item.thumbnail} alt={item.title} class="h-full w-full object-cover group-hover:brightness-95" />
							<span class="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-600 text-white">{item.duration}</span>
						</div>
						<div class="min-w-0 py-0.5">
							<p class="line-clamp-2 text-sm font-600 leading-tight group-hover:text-[var(--blue-7)]">{item.title}</p>
							<p class="mt-1 text-xs text-[var(--pc-text-muted)]">{item.product.name}</p>
							<p class="text-xs text-[var(--pc-text-faint)]">{item.views} • {item.postedAt}</p>
						</div>
					</a>
				{/each}
			</div>
			<div class="mt-6 rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface)] p-4">
				<h4 class="text-sm font-700">Subscribe to {data.product.name}</h4>
				<p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)]">Get notified for launches, fixes and incidents. Focus mode, not doom scroll.</p>
				<button class="mt-3 w-full rounded-full bg-[var(--pc-text)] text-[var(--pc-bg)] py-2.5 text-sm font-700">Subscribe • Notify me</button>
				<label class="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked /> Only launches</label>
				<label class="flex items-center gap-2 text-xs"><input type="checkbox" /> All updates (inc. incidents)</label>
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
