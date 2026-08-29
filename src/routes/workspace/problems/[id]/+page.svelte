<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, CheckCircle, Clock, Compass, Inbox, Map, Users2 } from 'reicon-svelte';
	import { Button, Card, Chip, StatePanel } from '$lib/components/ui';
	import RelationList from '$lib/components/workspace/RelationList.svelte';
	import StatusBadge from '$lib/components/workspace/StatusBadge.svelte';
	import { decisionThreadById, docFeedback, docs, feedback, problemById, problems, roadmapItems } from '$lib/data/workspace';

	let id = $derived(page.params.id ?? '');
	let problem = $derived(problemById(id));
	let relatedFeedback = $derived(problem ? feedback.filter((item) => problem.feedbackIds.includes(item.id)) : []);
	let relatedIncidents = $derived(problem ? (problem.incidentIds ?? []).map((incidentId) => `/workspace/incidents/${incidentId}`) : []);
	let decision = $derived(problem?.decisionId ? decisionThreadById(problem.decisionId) : undefined);
	let roadmap = $derived(problem ? roadmapItems.find((item) => item.title === decision?.title || item.productSlug === problem.productSlug && item.status !== 'Shipped') : undefined);
	let relatedDocs = $derived(problem ? docs.filter((doc) => doc.productSlug === problem.productSlug && (problem.docSlugs ?? []).includes(doc.slug)) : []);
	let relatedDocFeedback = $derived(problem ? docFeedback.filter((item) => item.linkedProblemId === problem.id) : []);
	let saved = $state(false);

	let problemRelations = $derived([
		...relatedFeedback.map((item) => ({ kind: 'Feedback' as const, title: item.title, detail: `${item.from} · ${item.status}`, href: item.workspacePath, status: item.status })),
		...(decision ? [{ kind: 'Decision' as const, title: decision.title, detail: `${decision.status} · ${decision.owner}`, href: `/workspace/decisions/${decision.id}`, status: decision.status }] : []),
		...(roadmap ? [{ kind: 'Roadmap' as const, title: roadmap.title, detail: `${roadmap.status} · ${roadmap.owner}`, href: `/workspace/roadmap#${roadmap.id}`, status: roadmap.status }] : []),
		...relatedDocs.map((doc) => ({ kind: 'Doc' as const, title: doc.title, detail: `${doc.section} · updated ${doc.updatedAt}`, href: doc.publicPath, status: 'Published' })),
		...relatedIncidents.map((href, index) => ({ kind: 'Incident' as const, title: `Service problem ${index + 1}`, detail: 'Related service problem', href, status: 'Open' }))
	]);
</script>

<svelte:head><title>{problem?.title ?? 'Problem'} | Product Client</title></svelte:head>

{#if problem}
	<div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
		<header class="border-b border-[var(--pc-border-strong)]/30 pb-6 pt-8 sm:pt-10">
			<a href="/workspace/problems" class="inline-flex min-h-8 items-center gap-1 text-xs text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]"><ArrowLeft size={13} weight="Outline" aria-hidden="true" /> Problems</a>
			<div class="mt-5 flex flex-wrap items-center gap-2"><Chip size="xs" variant="accent">Problem</Chip><StatusBadge label={problem.status} tone={problem.status === 'Resolved' ? 'success' : problem.status === 'Ready for decision' ? 'accent' : 'warning'} /><span class="text-xs text-[var(--pc-text-faint)]">Updated {problem.updatedAt}</span></div>
			<div class="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pc-accent-light)]">{problem.productName} · {problem.productArea} · {problem.owner}</p><h1 class="mt-1 max-w-[32ch] text-[28px] font-medium leading-tight tracking-tight sm:text-[38px]">{problem.title}</h1><p class="mt-2 max-w-[64ch] text-sm leading-relaxed text-[var(--pc-text-muted)] opacity-80">{problem.statement}</p></div>{#if decision}<Button href={`/workspace/decisions/${decision.id}`} variant="primary" size="sm"><Map size={14} weight="Outline" aria-hidden="true" /> Open product decision</Button>{:else}<Button href="/workspace/decisions" variant="primary" size="sm"><Map size={14} weight="Outline" aria-hidden="true" /> Choose what to do</Button>{/if}</div>
		</header>

		<div class="grid gap-6 py-6 pb-12 lg:grid-cols-[minmax(0,1fr)_300px]">
			<main class="min-w-0 space-y-4">
				<Card padding="lg"><div class="flex items-center gap-2"><Compass size={16} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-base font-medium">What people need</h2></div><p class="mt-4 text-sm leading-7 text-[var(--pc-text-muted)]">{problem.statement}</p><div class="mt-6 grid gap-3 sm:grid-cols-2"><div class="rounded-[15px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] uppercase tracking-[0.12em] text-[var(--pc-text-faint)]">Who is affected</p><p class="mt-2 text-sm font-medium">{problem.affectedAudience}</p></div><div class="rounded-[15px] bg-[var(--pc-surface)] p-3"><p class="text-[10px] uppercase tracking-[0.12em] text-[var(--pc-text-faint)]">Product area</p><p class="mt-2 text-sm font-medium">{problem.productArea}</p></div></div></Card>
				<Card padding="md"><div class="grid gap-4 sm:grid-cols-2"><div><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">What people do today</p><p class="mt-2 text-sm leading-relaxed text-[var(--pc-text-muted)]">{problem.workaround}</p></div><div><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">What it costs</p><p class="mt-2 text-sm leading-relaxed text-[var(--pc-text-muted)]">{problem.costOfInaction}</p></div></div></Card>
				<Card padding="md"><div class="flex items-center justify-between gap-3"><div><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Evidence</p><h2 class="mt-1 text-[15px] font-medium">What led us here</h2></div><span class="text-[10px] text-[var(--pc-text-faint)]">{relatedFeedback.length + relatedDocFeedback.length} sources</span></div><div class="mt-4 space-y-2">{#each relatedFeedback as item (item.id)}<a href={item.workspacePath} class="flex items-start gap-2 rounded-[12px] bg-[var(--pc-surface)] p-3 transition-colors hover:bg-[var(--pc-surface-2)]"><Inbox size={14} weight="Outline" class="mt-0.5 shrink-0 opacity-55" aria-hidden="true" /><span class="min-w-0 flex-1"><span class="block text-xs font-medium">{item.title}</span><span class="mt-1 block text-[11px] text-[var(--pc-text-muted)] opacity-70">{item.from} · {item.body}</span></span><ArrowRight size={12} weight="Outline" class="mt-0.5 opacity-45" aria-hidden="true" /></a>{/each}{#each relatedDocFeedback as item (item.id)}<div class="flex items-start gap-2 rounded-[12px] bg-[var(--pc-surface)] p-3"><CheckCircle size={14} weight="Outline" class="mt-0.5 shrink-0 opacity-55" aria-hidden="true" /><span class="min-w-0 flex-1"><span class="block text-xs font-medium">Help page feedback</span><span class="mt-1 block text-[11px] text-[var(--pc-text-muted)] opacity-70">{item.comment}</span></span></div>{/each}</div><a href="/workspace/inbox" class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Find more evidence <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a></Card>
				<Card padding="md"><div class="flex items-center gap-2"><Clock size={15} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-[13px] font-medium">What happens next</h2></div><p class="mt-3 text-sm leading-relaxed text-[var(--pc-text-muted)]">{decision ? 'The team is comparing options before it promises a product change.' : 'Add more evidence until the need is clear enough to compare options.'}</p><div class="mt-4 flex flex-wrap gap-2"><Button variant={saved ? 'primary' : 'outline'} size="sm" onclick={() => (saved = !saved)}>{saved ? 'Saved for review' : 'Save for review'}</Button><Button href="/workspace/inbox" variant="ghost" size="sm">Add evidence</Button></div></Card>
				<Card padding="md"><RelationList relations={problemRelations} label="Related pages" /></Card>
			</main>

			<aside class="space-y-4"><Card padding="md"><div class="flex items-center gap-2"><Users2 size={15} weight="Outline" class="opacity-55" aria-hidden="true" /><h2 class="text-[13px] font-medium">About this problem</h2></div><div class="mt-4 space-y-3 text-xs"><div><p class="text-[var(--pc-text-faint)]">Owner</p><p class="mt-1 font-medium">{problem.owner}</p></div><div><p class="text-[var(--pc-text-faint)]">Product</p><p class="mt-1 font-medium">{problem.productName}</p></div><div><p class="text-[var(--pc-text-faint)]">Last updated</p><p class="mt-1 font-medium">{problem.updatedAt}</p></div></div></Card>{#if decision}<Card padding="md"><p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pc-accent-light)]">Connected choice</p><p class="mt-2 text-sm font-medium">{decision.title}</p><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-70">{decision.status === 'In decision' ? 'The team is choosing a direction.' : 'This problem has a product direction.'}</p><a href={`/workspace/decisions/${decision.id}`} class="mt-3 inline-flex items-center gap-1 text-xs text-[var(--pc-accent-light)]">Read the reasoning <ArrowRight size={13} weight="Outline" aria-hidden="true" /></a></Card>{/if}</aside>
		</div>
	</div>
{:else}
	<div class="px-4 sm:px-6"><StatePanel size="page" icon={Compass} title="Problem not found" description="This problem is not in the current workspace list." actionLabel="Back to problems" actionHref="/workspace/problems" class="pc-enter" /></div>
{/if}
