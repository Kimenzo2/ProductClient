<script lang="ts">
	let { current }: { current: 1 | 2 | 3 | 4 } = $props();
	const steps = ['Your profile', 'Workspace', 'Starting view', 'Ready'];
</script>

<nav class="progress" aria-label="Onboarding progress">
	<div class="progress-label"><span>Setup</span><span>Step {current} of 4</span></div>
	<ol>
		{#each steps as label, index}
			<li class:complete={index + 1 < current} class:current={index + 1 === current} aria-current={index + 1 === current ? 'step' : undefined}>
				<span class="progress-bar" aria-hidden="true"></span>
				<span class="sr-only">{label}{index + 1 === current ? ', current step' : index + 1 < current ? ', complete' : ''}</span>
			</li>
		{/each}
	</ol>
</nav>

<style>
	.progress { display: grid; gap: 10px; margin-bottom: 34px; }.progress-label { display: flex; justify-content: space-between; gap: 12px; color: var(--pc-text-faint); font-size: 11px; }.progress-label span:first-child { color: var(--pc-text-muted); font-weight: 500; }.progress ol { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 0; padding: 0; list-style: none; }.progress li { min-width: 0; }.progress-bar { display: block; height: 3px; border-radius: 99px; background: rgba(251, 251, 251, .11); }.progress li.complete .progress-bar, .progress li.current .progress-bar { background: var(--pc-accent-light); }.progress li.current .progress-bar { box-shadow: 0 0 0 3px rgba(119, 152, 18, .12); }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
