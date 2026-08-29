<script lang="ts">
	import { Bell, CheckCircle, Settings } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';
	import { Card, Toggle } from '$lib/components/ui';

	let releaseNotifications = $state(true);
	let incidentNotifications = $state(true);
	let weeklyDigest = $state(false);
</script>

<svelte:head><title>Settings | Product Client</title></svelte:head>

<div class="mx-auto w-full max-w-[920px] px-4 sm:px-6">
	<WorkspaceHeader eyebrow="Workspace" title="Settings" description="Choose what you are told about and how the workspace works." />
	<div class="grid gap-4 py-6">
		<Card padding="lg"><div class="flex items-center gap-2"><Bell size={16} weight="Outline" class="opacity-55" /><h2 class="text-base font-medium">Notifications</h2></div><div class="mt-5 divide-y divide-[var(--pc-border-strong)]/20">{#each [{label:'Product update alerts', description:'When a product you follow shares something new.', value: releaseNotifications, set: (value: boolean) => (releaseNotifications = value)}, {label:'Service problem alerts', description:'When a service problem changes or affects your products.', value: incidentNotifications, set: (value: boolean) => (incidentNotifications = value)}, {label:'Weekly summary', description:'A short summary of new feedback and work that still needs an answer.', value: weeklyDigest, set: (value: boolean) => (weeklyDigest = value)}] as item}<div class="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div class="min-w-0 flex-1"><p class="text-[13px] font-medium">{item.label}</p><p class="mt-1 text-xs leading-relaxed text-[var(--pc-text-muted)] opacity-65">{item.description}</p></div><Toggle pressed={item.value} onPressedChange={item.set} variant="default" size="sm">{item.value ? 'On' : 'Off'}</Toggle></div>{/each}</div></Card>
		<Card padding="lg"><div class="flex items-center gap-2"><Settings size={16} weight="Outline" class="opacity-55" /><h2 class="text-base font-medium">Workspace rules</h2></div><div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Product page links</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">/p/product-slug</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">When updates become public</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">After someone publishes them</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Service problem stages</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">Draft → Looking into it → Watching → Fixed</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Who can search</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">Only people with access</p></div></div></Card>
		<div class="flex items-center gap-2 rounded-[14px] bg-[var(--pc-surface)] px-4 py-3 text-xs text-[var(--pc-text-muted)]"><CheckCircle size={15} weight="Outline" class="text-[var(--pc-accent-light)]" />These settings are saved in this prototype. The backend will save them for your workspace later.</div>
	</div>
</div>
