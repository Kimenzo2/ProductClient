<script lang="ts">
	import { page } from '$app/state';
	import { Building, CreditCard, Plug, Shield, Users, Warning } from 'reicon-svelte';
	import WorkspaceHeader from '$lib/components/workspace/WorkspaceHeader.svelte';

	let { children } = $props();

	const sections = [
		{ href: '/workspace/settings/general', label: 'General', icon: Building },
		{ href: '/workspace/settings/members', label: 'Members', icon: Users },
		{ href: '/workspace/settings/billing', label: 'Billing', icon: CreditCard },
		{ href: '/workspace/settings/integrations', label: 'Integrations', icon: Plug },
		{ href: '/workspace/settings/security', label: 'Security', icon: Shield },
		{ href: '/workspace/settings/advanced', label: 'Advanced', icon: Warning }
	];

	const isActive = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<svelte:head><title>Settings · ProductClient</title></svelte:head>

<div class="mx-auto w-full max-w-[1080px] px-4 sm:px-6">
	<WorkspaceHeader title="Settings" description="Global workspace controls. One change here defines the default everywhere." />
	<div class="mt-6 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
		<nav class="hidden lg:block" aria-label="Settings">
			<div class="sticky top-[76px] grid gap-1">
				{#each sections as s}
					{@const Icon = s.icon}
					<a
						href={s.href}
						class="flex items-center gap-2 rounded-[12px] px-3 py-2 text-[14px] font-medium transition-colors {isActive(s.href) ? 'bg-[var(--pc-surface)] text-[var(--pc-text)]' : 'text-[var(--pc-text-muted)] hover:bg-[var(--pc-surface-2)] hover:text-[var(--pc-text)]'}"
						aria-current={isActive(s.href) ? 'page' : undefined}
					>
						<Icon size={16} weight="Outline" aria-hidden="true" />{s.label}
					</a>
				{/each}
			</div>
		</nav>
		<!-- Mobile: horizontal pills -->
		<div class="lg:hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
			{#each sections as s}
				{@const Icon = s.icon}
				<a href={s.href} class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium {isActive(s.href) ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'bg-[var(--pc-surface)] text-[var(--pc-text-muted)]'}"><Icon size={14} weight="Outline" aria-hidden="true" />{s.label}</a>
			{/each}
		</div>
		<div class="min-w-0">
			{@render children()}
		</div>
	</div>
</div>
