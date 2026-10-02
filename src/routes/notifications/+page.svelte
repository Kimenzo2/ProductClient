<script lang="ts">
	import { onMount } from 'svelte';
	import { Bell, Rocket, AlertTriangle } from 'reicon-svelte';
	import { Tabs } from 'bits-ui';
	import { Avatar, Button, StatePanel } from '#lib/components/ui/index.js';
	import { loadNotifications, markNotificationsRead, type LiveNotification } from '#lib/data/notifications.js';
	import { setNotificationCount } from '#lib/data/signalRegistry.svelte.js';

	const typeIcon: Record<LiveNotification['type'], typeof Rocket> = {
		launch: Rocket,
		incident: AlertTriangle
	};

	const typeColor: Record<LiveNotification['type'], string> = {
		launch: 'var(--color-blue-600)',
		incident: 'var(--yellow-7)'
	};

	let notifications: LiveNotification[] = $state([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	function syncBadge() {
		setNotificationCount(notifications.filter((n) => !n.read).length);
	}

	async function refresh() {
		loading = true;
		loadError = null;
		const { items, error } = await loadNotifications();
		notifications = items;
		loadError = error;
		loading = false;
		syncBadge();
	}

	onMount(() => {
		void refresh();
	});

	let filter = $state<'all' | 'unread'>('all');
	let unreadCount = $derived(notifications.filter((n) => !n.read).length);
	let filtered = $derived(filter === 'unread' ? notifications.filter((n) => !n.read) : notifications);

	function markAllRead() {
		void (async () => {
			await markNotificationsRead(notifications.map((n) => n.id));
			notifications = notifications.map((n) => ({ ...n, read: true }));
			syncBadge();
		})();
	}
</script>

<svelte:head>
	<title>Notifications — Product Client</title>
</svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4 ps-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))]">
	<!-- Header — 30px display, 15/16 body, tabular -->
	<header class="pt-10 pb-8 max-sm:pt-8 max-sm:pb-6">
		<div class="flex items-baseline justify-between gap-4">
			<h1 class="text-[19px] font-semibold leading-[1.2] tracking-[-0.015em] text-balance md:text-[21px] text-wrap-balance">Notifications</h1>
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
	{#if loading}
		<ul class="space-y-3 list-none p-0 m-0" aria-label="Loading notifications">
			{#each [0, 1, 2] as i (i)}
				<li aria-hidden="true">
					<div class="flex items-start gap-3 p-3 rounded-[20px] bg-[var(--pc-surface-2)]">
						<div class="shrink-0 grid size-9 place-items-center rounded-full bg-[var(--pc-surface)] ring-1 ring-[var(--pc-border-strong)] mt-0.5"></div>
						<div class="min-w-0 flex-1 space-y-2 py-1">
							<div class="h-3 w-2/5 rounded-full bg-[var(--pc-surface)]"></div>
							<div class="h-3.5 w-11/12 rounded-full bg-[var(--pc-surface)]"></div>
							<div class="h-2.5 w-1/4 rounded-full bg-[var(--pc-surface)]"></div>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else if loadError}
		<StatePanel icon={Bell} title="Couldn't load notifications" description={loadError} actionLabel="Retry" onAction={() => void refresh()} class="pc-enter" />
	{:else if filtered.length > 0}
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
								<Avatar src={n.productAvatar} alt={n.productName} size="xs" shape="square" class="!ring-0 ring-0 border-0" />
								<span class="text-[13px] font-semibold leading-[1.3] tracking-[-0.01em] truncate">{n.productName}</span>
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
	{:else if !loading && filter === 'unread' && notifications.length > 0}
		<StatePanel icon={Bell} title="You're all caught up" description="Everything here is read. New activity will light the bell again." class="pc-enter" />
	{:else if !loading}
		<StatePanel icon={Bell} title="No activity yet" description="Follow a product and its launches and status updates will appear here." class="pc-enter" />
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
