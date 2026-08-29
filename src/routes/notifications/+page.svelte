<script lang="ts">
	import { Verified, Bell, ArrowUp, Rocket, MessageDots, AlertTriangle, CheckCircle } from 'reicon-svelte';
	import { Tabs } from 'bits-ui';
	import { Avatar, Button, Card } from '$lib/components/ui';

	type Notification = {
		id: string;
		type: 'upvote' | 'launch' | 'comment' | 'incident' | 'milestone';
		product: string;
		productAvatar: string;
		message: string;
		time: string;
		read: boolean;
	};

	let notifications: Notification[] = $state([
		{ id: '1', type: 'launch', product: 'ChatGPT', productAvatar: 'https://cdn.reicon.dev/logos/openai/original.svg', message: 'ChatGPT 6 launched — realtime vision, voice and reasoning', time: '2 hours ago', read: false },
		{ id: '2', type: 'upvote', product: 'Linear', productAvatar: 'https://cdn.reicon.dev/logos/linear/original.svg', message: 'Your upvote pushed Linear to #2 on the weekly leaderboard', time: '5 hours ago', read: false },
		{ id: '3', type: 'milestone', product: 'Vercel', productAvatar: 'https://cdn.reicon.dev/logos/vercel/original.svg', message: 'Vercel hit 1M reads — you were one of the first followers', time: '1 day ago', read: false },
		{ id: '4', type: 'incident', product: 'Vercel', productAvatar: 'https://cdn.reicon.dev/logos/vercel/original.svg', message: 'Edge functions latency incident — resolved', time: '1 day ago', read: true },
		{ id: '5', type: 'comment', product: 'Figma', productAvatar: 'https://cdn.reicon.dev/logos/figma/original.svg', message: 'New comment on Figma 4.0 launch announcement', time: '2 days ago', read: true },
		{ id: '6', type: 'launch', product: 'Cursor', productAvatar: 'https://cdn.reicon.dev/logos/cursor/original.svg', message: 'Cursor shipped background agents — now available in beta', time: '3 days ago', read: true },
		{ id: '7', type: 'upvote', product: 'Supabase', productAvatar: 'https://cdn.reicon.dev/logos/supabase/original.svg', message: 'Supabase moved up 3 spots — your follows are ranking it', time: '3 days ago', read: true },
		{ id: '8', type: 'milestone', product: 'Notion', productAvatar: 'https://cdn.reicon.dev/logos/notion/original.svg', message: 'Notion reached 500K followers on Product Client', time: '4 days ago', read: true },
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
		incident: 'var(--yellow-600)',
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

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<!-- Header -->
	<header class="pt-10 pb-5 max-sm:pt-8 max-sm:pb-4">
		<div class="flex items-baseline justify-between gap-4">
			<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Notifications</h1>
			{#if unreadCount > 0}
			<Button variant="ghost" size="sm" onclick={markAllRead} class="!text-[var(--pc-accent)]">Mark all read</Button>
			{/if}
		</div>
		<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">
			{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
		</p>
	</header>

	<!-- Filter tabs -->
	<Tabs.Root value={filter} onValueChange={(v) => { if (v) filter = v as typeof filter; }} class="pb-4">
		<Tabs.List class="flex items-center gap-1">
			<Tabs.Trigger value="all" class="h-8 px-3 rounded-lg text-[13px] font-normal transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				All
			</Tabs.Trigger>
			<Tabs.Trigger value="unread" class="h-8 px-3 rounded-lg text-[13px] font-normal transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-[var(--tab-active-color)] data-[state=active]:shadow-[var(--tab-active-shadow)] data-[state=inactive]:bg-[var(--tab-bg)] data-[state=inactive]:text-[var(--tab-color)] data-[state=inactive]:hover:bg-[var(--tab-hover-bg)] data-[state=inactive]:hover:text-[var(--tab-hover-color)]">
				Unread {#if unreadCount > 0}<span class="text-[11px] opacity-65">{unreadCount}</span>{/if}
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	<!-- Notifications list -->
	{#if filtered.length > 0}
		<div class="space-y-1 pc-enter-stagger">
			{#each filtered as n (n.id)}
				{@const Icon = typeIcon[n.type]}
				<div class={[
					'flex items-start gap-3 p-3 rounded-[14px] transition-[background-color] duration-100',
					n.read ? 'bg-transparent' : 'bg-[var(--pc-surface-2)]'
				].join(' ')}>
					<!-- Icon -->
				<div class="shrink-0 size-9 rounded-full bg-[var(--pc-surface-2)] grid place-items-center mt-0.5">
					<span style:color={typeColor[n.type]}><Icon size={14} weight="Outline" /></span>
				</div>

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<Avatar src={n.productAvatar} alt="" size="xs" shape="square" />
							<span class="text-[13px] font-medium">{n.product}</span>
							{#if !n.read}
								<span class="size-1.5 rounded-full bg-[var(--pc-accent)] shrink-0"></span>
							{/if}
						</div>
						<p class="mt-0.5 text-[13px] text-[var(--pc-text-muted)] opacity-60 line-clamp-2">{n.message}</p>
						<span class="mt-1 block text-[11px] text-[var(--pc-text-faint)] opacity-60">{n.time}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="py-16 flex flex-col items-center text-center pc-enter">
			<div class="mx-auto size-10 rounded-full bg-[var(--pc-surface-2)] grid place-items-center">
				<Bell size={16} weight="Outline" class="opacity-55" />
			</div>
			<p class="mt-3 text-sm font-medium">No unread notifications</p>
			<p class="mt-1 text-[13px] text-[var(--pc-text-muted)] opacity-65">You're all caught up.</p>
		</div>
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
</style>
