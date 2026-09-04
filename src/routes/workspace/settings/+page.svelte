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
		<div class="min-h-[200px] py-4" aria-hidden="true"></div>
		<Card padding="lg"><div class="flex items-center gap-2"><Settings size={16} weight="Outline" class="opacity-55" /><h2 class="text-base font-medium">Workspace rules</h2></div><div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Product page links</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">/p/product-slug</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">When updates become public</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">After someone publishes them</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Service problem stages</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">Draft → Looking into it → Watching → Fixed</p></div><div class="rounded-[14px] bg-[var(--pc-surface)] p-3"><p class="text-xs font-medium">Who can search</p><p class="mt-1 text-[11px] text-[var(--pc-text-muted)] opacity-65">Only people with access</p></div></div></Card>
		<div class="flex items-center gap-2 rounded-[14px] bg-[var(--pc-surface)] px-4 py-3 text-xs text-[var(--pc-text-muted)]"><CheckCircle size={15} weight="Outline" class="text-[var(--pc-accent-light)]" />These settings are saved in this prototype. The backend will save them for your workspace later.</div>
	</div>
</div>
