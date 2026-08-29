<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, ArrowRight, BookOpen, Box, Compass, FileText, History, Inbox, MessageDots } from 'reicon-svelte';
	import WorkspaceLauncher from '$lib/components/workspace/WorkspaceLauncher.svelte';
	import HomeWorkItem from '$lib/components/workspace/HomeWorkItem.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { requireSession } from '$lib/auth/guard';
	import { feedback, incidents, problems, releases } from '$lib/data/workspace';

	type HomeMode = 'build' | 'coordinate';
	type StarterAction = { label: string; detail: string; href: string; icon: typeof Box };
	type WorkItem = { kind: string; title: string; detail: string; state: string; nextAction: string; relation: string; href: string; icon: typeof Box };

	let displayName = $state('');
	let role = $state('');
	let mode = $derived<HomeMode>(role === 'Developer' || role === 'Builder' ? 'build' : 'coordinate');

	const coordinateActions: StarterAction[] = [
		{ label: 'Add feedback', detail: 'Capture what someone needs', href: '/feedback/new', icon: MessageDots },
		{ label: 'Review incoming feedback', detail: 'See what needs a reply', href: '/workspace/inbox', icon: Inbox },
		{ label: 'Find an answer', detail: 'Search products, updates, and help', href: '/workspace/search', icon: BookOpen }
	];

	const buildActions: StarterAction[] = [
		{ label: 'Find related feedback', detail: 'See the need behind the work', href: '/workspace/feedback', icon: MessageDots },
		{ label: 'Check a release', detail: 'See what is ready to share', href: '/workspace/releases', icon: History },
		{ label: 'Read product docs', detail: 'Find the current product context', href: '/workspace/docs', icon: FileText }
	];

	const coordinateWork: WorkItem[] = [
		{ kind: 'Feedback', title: feedback.find((item) => item.status === 'New')?.title ?? 'New customer feedback', detail: 'Needs review', state: 'Needs a reply', nextAction: 'Review feedback', relation: 'Starts with a customer message', href: feedback.find((item) => item.status === 'New')?.workspacePath ?? '/workspace/feedback', icon: Inbox },
		{ kind: 'Problem', title: problems.find((item) => item.status === 'Ready for decision')?.title ?? 'A problem is ready for a decision', detail: 'Ready for a decision', state: 'Needs a decision', nextAction: 'Review context', relation: 'Moves from feedback to a decision', href: problems.find((item) => item.status === 'Ready for decision')?.workspacePath ?? '/workspace/problems', icon: Compass },
		{ kind: 'Product update', title: releases[0]?.title ?? 'A product update changed', detail: `${releases[0]?.productName ?? 'Product'} · ${releases[0]?.postedAt ?? 'Recently'}`, state: 'Recently changed', nextAction: 'Read update', relation: 'Connects a decision to customers', href: releases[0]?.workspacePath ?? '/workspace/releases', icon: History }
	];

	const buildWork: WorkItem[] = [
		{ kind: 'Problem', title: problems.find((item) => item.status === 'Ready for decision')?.title ?? 'A problem is ready for a decision', detail: 'Ready for a decision', state: 'Needs context', nextAction: 'Review context', relation: 'Starts with a customer need', href: problems.find((item) => item.status === 'Ready for decision')?.workspacePath ?? '/workspace/problems', icon: Compass },
		{ kind: 'Service problem', title: incidents.find((item) => item.status !== 'Resolved')?.title ?? 'No active service problems', detail: incidents.find((item) => item.status !== 'Resolved')?.severity ?? 'No active issue', state: incidents.find((item) => item.status !== 'Resolved') ? 'Needs technical review' : 'All clear', nextAction: incidents.find((item) => item.status !== 'Resolved') ? 'Open service problem' : 'View service problems', relation: 'Leads to a customer update', href: incidents.find((item) => item.status !== 'Resolved')?.workspacePath ?? '/workspace/incidents', icon: AlertTriangle },
		{ kind: 'Product update', title: releases[0]?.title ?? 'A product update changed', detail: `${releases[0]?.productName ?? 'Product'} · ${releases[0]?.postedAt ?? 'Recently'}`, state: 'Recently changed', nextAction: 'Read update', relation: 'Connects a decision to the release', href: releases[0]?.workspacePath ?? '/workspace/releases', icon: History }
	];

	let actions = $derived(mode === 'build' ? buildActions : coordinateActions);
	let workItems = $derived(mode === 'build' ? buildWork : coordinateWork);

	onMount(async () => {
		const allowed = await requireSession('/workspace');
		if (!allowed || !supabase) return;
		const { data } = await supabase.auth.getUser();
		const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
		const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name : '';
		displayName = fullName || data.user?.email?.split('@')[0] || '';
		role = typeof metadata?.role === 'string' ? metadata.role : '';
	});
</script>

<svelte:head>
	<title>Workspace | Product Client</title>
	<meta name="description" content="Start product work, find context, and see what needs your attention." />
</svelte:head>

<div class="workspace-home">
	<div class="home-content">
		<section class="home-welcome" aria-labelledby="workspace-home-title">
			<p class="home-greeting">Good morning{displayName ? `, ${displayName}` : ''}</p>
			<h1 id="workspace-home-title">{mode === 'build' ? 'What are you trying to ship?' : 'What needs your attention?'}</h1>
			<p class="home-description">{mode === 'build' ? 'Find the customer need, decision, and docs behind your work.' : 'See what needs a reply, decision, or update.'}</p>
			<WorkspaceLauncher placeholder={mode === 'build' ? 'Find the context behind a task or start a new one' : 'Find feedback, an update, a help page, or a product'} />
			<div class="starter-area" aria-labelledby="starter-title">
				<p id="starter-title" class="starter-label">Start with</p>
				<div class="starter-actions">
					{#each actions as action (action.href)}
						{@const Icon = action.icon}
						<a class="starter-action" href={action.href}>
							<span class="starter-icon" aria-hidden="true"><Icon size={16} weight="Outline" /></span>
							<span><strong>{action.label}</strong><small>{action.detail}</small></span>
						</a>
					{/each}
				</div>
			</div>
		</section>

		<section class="home-work" aria-labelledby="home-work-title">
			<div class="section-heading">
				<div>
					<p class="section-kicker">{mode === 'build' ? 'Your work' : 'For you'}</p>
					<h2 id="home-work-title">{mode === 'build' ? 'Work connected to what you are building.' : 'Start with what needs a reply or decision.'}</h2>
				</div>
				<a href={mode === 'build' ? '/workspace/feedback' : '/workspace/inbox'}>View all <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a>
			</div>
			<div class="work-list">
				{#each workItems as item (item.kind + item.title)}
					<HomeWorkItem {...item} />
				{/each}
			</div>
		</section>
	</div>
</div>

<style>
	.workspace-home { display: flex; justify-content: center; width: 100%; min-height: calc(100dvh - var(--pc-header-h)); padding: clamp(48px, 8vh, 82px) 24px 72px; box-sizing: border-box; }
	.home-content { display: flex; flex-direction: column; align-items: center; width: min(100%, 960px); margin-inline: auto; }
	.home-welcome { display: flex; flex-direction: column; align-items: center; width: min(100%, 760px); text-align: center; }
	.home-greeting { width: 100%; margin: 0; color: var(--pc-text-muted); font-size: 13px; text-align: center; }
	.home-welcome h1 { width: 100%; max-width: 18ch; margin: 13px auto 0; color: var(--pc-text); font-size: clamp(38px, 4.5vw, 56px); font-weight: 500; line-height: 1.04; letter-spacing: -.065em; text-align: center; text-wrap: balance; }
	.home-description { width: 100%; max-width: 48ch; margin: 15px auto 0; color: var(--pc-text-muted); font-size: 14px; line-height: 1.55; text-align: center; text-wrap: pretty; }
	.home-welcome :global(.launcher) { margin-top: 30px; }
	.starter-area { width: 100%; margin-top: 21px; text-align: center; }
	.starter-label { margin: 0 0 9px; color: var(--pc-text-faint); font-size: 10px; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	.starter-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
	.starter-action { display: flex; align-items: center; gap: 9px; min-width: 0; padding: 11px; border: 1px solid transparent; border-radius: 13px; color: var(--pc-text-muted); background: var(--pc-surface-2); text-align: start; transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease; }
	.starter-action:hover { border-color: var(--pc-border-strong); color: var(--pc-text); background: rgba(251, 251, 251, .06); transform: translateY(-1px); }
	.starter-icon { display: grid; place-items: center; width: 31px; height: 31px; flex: 0 0 auto; border-radius: 10px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); }
	.starter-action strong, .starter-action small { display: block; }
	.starter-action strong { color: inherit; font-size: 11px; font-weight: 500; }
	.starter-action small { margin-top: 3px; color: var(--pc-text-faint); font-size: 10px; line-height: 1.35; }
	.home-work { width: min(100%, 760px); margin: clamp(58px, 9vh, 88px) auto 0; }
	.section-heading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px; text-align: center; }
	.section-heading > div { display: grid; justify-items: center; }
	.section-kicker { margin: 0 0 5px; color: var(--pc-accent-light); font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
	.section-heading h2 { max-width: 32ch; margin: 0; color: var(--pc-text); font-size: 19px; font-weight: 500; letter-spacing: -.035em; text-wrap: balance; }
	.section-heading > a { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; color: var(--pc-accent-light); font-size: 11px; }
	.work-list { display: grid; gap: 7px; }
	@media (max-width: 680px) { .workspace-home { padding: 42px 16px 54px; }.home-welcome h1 { max-width: 16ch; font-size: clamp(32px, 10vw, 43px); }.home-description { font-size: 13px; }.home-welcome :global(.launcher) { margin-top: 24px; }.starter-actions { grid-template-columns: 1fr; gap: 6px; }.starter-action { padding: 10px 11px; }.home-work { margin-top: 50px; }.section-heading h2 { font-size: 17px; } }
	@media (prefers-reduced-motion: reduce) { .starter-action { transition: none; } }
</style>
