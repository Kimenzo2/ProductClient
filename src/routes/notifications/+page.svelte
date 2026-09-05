<script lang="ts">
	import { Verified, Bell, ArrowUp, Rocket, MessageDots, AlertTriangle, CheckCircle } from 'reicon-svelte';
	import { Tabs } from 'bits-ui';
	import { Avatar, Button, StatePanel } from '$lib/components/ui';
	import { mockStates } from '$lib/data/mockStates';

	// Product identity comes from the shared mock data — never duplicate names or avatars here.
	const productBySlug = new Map(mockStates.map((s) => [s.product.slug, s.product]));
	function productName(slug: string): string {
		return productBySlug.get(slug)?.name ?? slug;
	}
	function productAvatar(slug: string): string {
		return productBySlug.get(slug)?.avatar ?? '';
	}

	type Notification = {
		id: string;
		type: 'upvote' | 'launch' | 'comment' | 'incident' | 'milestone';
		productSlug: string;
		message: string;
		time: string;
		read: boolean;
	};

	let notifications: Notification[] = $state([
		{ id: '1', type: 'launch', productSlug: 'bento', message: 'Bento 0.4 launched — voice commands, quick switching, better answers', time: '2 hours ago', read: false },
		{ id: '2', type: 'upvote', productSlug: 'tetra', message: 'Your upvote pushed Tetra to #4 on the weekly leaderboard', time: '5 hours ago', read: false },
		{ id: '3', type: 'milestone', productSlug: 'mossbit', message: 'Mossbit crossed 1,000 reads this month — you were one of the first followers', time: '1 day ago', read: false },
		{ id: '4', type: 'incident', productSlug: 'mossbit', message: 'Requests latency incident — resolved', time: '1 day ago', read: true },
		{ id: '5', type: 'comment', productSlug: 'quillpost', message: 'New comment on Quillpost launch announcement', time: '2 days ago', read: true },
		{ id: '6', type: 'launch', productSlug: 'inkwell', message: 'Inkwell shipped background exports — now available in beta', time: '3 days ago', read: true },
		{ id: '7', type: 'upvote', productSlug: 'hearth', message: 'Hearth moved up 3 spots — your follows are ranking it', time: '3 days ago', read: true },
		{ id: '8', type: 'milestone', productSlug: 'signalfox', message: 'Signalfox passed 100 followers on Product Client', time: '4 days ago', read: true },
	]);

	const typeIcon: Record<string, typeof Rocket> = {
		launch: Rocket,
		upvote: ArrowUp,
		comment: MessageDots,
		incident: AlertTriangle,
		milestone: CheckCircle
	};

	const typeColor: Record<string, string> = {
		launch: 'var(--color-blue-600)',
		upvote: 'var(--pc-accent)',
		comment: 'var(--pc-text-muted)',
		incident: 'var(--yellow-7)',
		milestone: 'var(--pc-accent)'
	};

	let filter = $state<'all' | 'unread'>('all');
	let unreadCount = $derived(notifications.filter((n) => !n.read).length);
	let filtered = $derived(filter === 'unread' ? notifications.filter((n) => !n.read) : notifications);

	function markAllRead() {
		notifications = notifications.map((n) => ({ ...n, read: true }));
	}
</script>

<svelte:head>
	<title>Notifications — Product Client</title>
</svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))]">
	<!-- Header — 30px display, 15/16 body, tabular -->
	<header class="pt-10 pb-8 max-sm:pt-8 max-sm:pb-6">
		<div class="flex items-baseline justify-between gap-4">
			<h1 class="text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px]">Notifications</h1>
			{#if unreadCount > 0}
			<Button variant="ghost" size="sm" onclick={markAllRead} class="!text-[var(--pc-accent-strong)]">Mark all read</Button>
			{/if}
		</div>
		<p class="mt-3 max-w-[60ch] text-[13px] leading-[1.6] tracking-[-0.003em] text-[var(--pc-text-muted)] text-pretty">
			{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
		</p>
	</header>

	<!-- Filter tabs — gap 12, mask peek, 44 hit -->
	<Tabs.Root value={filter} onValueChange={(v) => { if (v) filter = v as typeof filter; }} class="pb-4">
		<Tabs.List class="flex items-center gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-ps-6 pe-6 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
			<Tabs.Trigger value="all" class="inline-flex items-center justify-center h-9 px-3.5 rounded-full text-[13px] font-medium leading-none tracking-[-0.01em] whitespace-nowrap snap-start shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				All
			</Tabs.Trigger>
			<Tabs.Trigger value="unread" class="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium leading-none tracking-[-0.01em] whitespace-nowrap snap-start shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.96] focus-visible:outline-[0.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--pc-focus-ring)] data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				Unread {#if unreadCount > 0}<span class="text-xs tabular-nums">{unreadCount}</span>{/if}
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	<!-- List — flat, opaque, no opacity wash, 60ch, concentric -->
	{#if filtered.length > 0}
		<ul class="space-y-3 pc-enter-stagger list-none p-0 m-0" role="list" aria-label="Notifications">
			{#each filtered as n (n.id)}
				{@const Icon = typeIcon[n.type]}
				<li role="listitem">
					<div class={[
						'flex items-start gap-3 p-3 rounded-[20px] transition-[background-color] duration-150',
						n.read ? 'bg-transparent hover:bg-[var(--pc-surface)]' : 'bg-[var(--pc-surface-2)]'
					].join(' ')}>
						<!-- Icon — 36 hit, muted bg, neutral -->
						<div class="shrink-0 grid size-9 place-items-center rounded-full bg-[var(--pc-surface)] ring-1 ring-[var(--pc-border-strong)] mt-0.5" aria-hidden="true">
							<span style:color={typeColor[n.type]}><Icon size={14} weight="Outline" aria-hidden="true" /></span>
						</div>

						<!-- Content — no opacity, 14/15 body, tabular -->
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<Avatar src={productAvatar(n.productSlug)} alt={productName(n.productSlug)} size="xs" shape="square" class="!ring-0 ring-0 border-0" />
								<span class="text-[13px] font-semibold leading-[1.3] tracking-[-0.01em] truncate">{productName(n.productSlug)}</span>
								{#if !n.read}
									<span class="size-1.5 rounded-full bg-[var(--pc-accent)] shrink-0" aria-hidden="true"></span>
									<span class="sr-only">Unread</span>
								{/if}
							</div>
							<p class="mt-1 text-[14px] md:text-[15px] leading-[1.65] tracking-[-0.01em] text-[var(--pc-text)] max-w-[60ch] text-pretty line-clamp-2 break-words [overflow-wrap:break-word]">{n.message}</p>
							<span class="mt-1 block text-xs leading-[1.4] tracking-[-0.01em] text-[var(--pc-text-faint)] tabular-nums">{n.time}</span>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<StatePanel icon={Bell} title="You're all caught up" description="New activity from products you follow will appear here." class="pc-enter" />
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.scrollbar-none { scrollbar-width: none; }
	.scrollbar-none::-webkit-scrollbar { display: none; }
</style>
