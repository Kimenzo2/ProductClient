<script lang="ts">
	import { ArrowRight, Box } from 'reicon-svelte';

	let {
		kind,
		title,
		detail,
		state,
		nextAction,
		relation,
		href,
		icon: Icon
	}: {
		kind: string;
		title: string;
		detail: string;
		state: string;
		nextAction: string;
		relation: string;
		href: string;
		icon: typeof Box;
	} = $props();
</script>

<a class="home-work-item" href={href}>
	<span class="work-icon" aria-hidden="true"><Icon size={17} weight="Outline" /></span>
	<span class="work-body">
		<span class="work-topline"><span class="work-detail">{detail}</span></span>
		<strong>{title}</strong>
		<span class="work-bottomline"><span>{relation}</span><span class="work-state">{state}</span></span>
	</span>
	<span class="work-action">{nextAction}<ArrowRight size={14} weight="Outline" aria-hidden="true" /></span>
</a>

<style>
	.home-work-item { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 13px; padding: 13px 14px; border: 1px solid transparent; border-radius: 15px; color: var(--pc-text-muted); background: var(--pc-surface-2); transition: background-color 100ms ease, color 100ms ease; }
	.home-work-item:hover { color: var(--pc-text); background: var(--pc-surface); }
	.work-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); }
	.work-body { min-width: 0; }
	.work-topline, .work-bottomline { display: flex; align-items: center; gap: 8px; min-width: 0; }
	.work-topline { margin-bottom: 4px; }
	
	.work-detail, .work-bottomline { overflow: hidden; color: var(--pc-text-faint); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
	.work-body strong { display: block; overflow: hidden; color: var(--pc-text); font-size: 13px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.work-bottomline { margin-top: 5px; }
	.work-bottomline > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.work-state { flex: 0 0 auto; color: var(--pc-text-muted); }
	.work-action { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; color: var(--pc-accent-light); font-size: 11px; white-space: nowrap; }
	@media (max-width: 680px) { .home-work-item { grid-template-columns: 36px minmax(0, 1fr); gap: 10px; padding: 11px; }.work-icon { width: 36px; height: 36px; }.work-action { grid-column: 2; justify-self: start; margin-top: -2px; }.work-body { grid-column: 2; grid-row: 1; } }
	@media (prefers-reduced-motion: reduce) { .home-work-item { transition: none; } }
</style>
