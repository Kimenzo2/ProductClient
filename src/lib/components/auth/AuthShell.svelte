<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="auth-root">
	<div class="auth-frame">
		<section class="auth-form-pane">
			<main id="main" class="auth-form-content">
				{@render children()}
			</main>
		</section>
	</div>
</div>

<style>
	:global(html:has(.auth-root)), :global(body:has(.auth-root)) { overflow: hidden; height: 100%; }
	.auth-root { width: 100%; height: 100dvh; overflow: hidden; display: grid; place-items: center; padding: 16px; background: var(--pc-bg); color: var(--pc-text); }
	.auth-frame { width: 100%; max-width: 400px; display: grid; place-items: center; }
	.auth-form-pane { display: grid; place-items: center; width: 100%; background: transparent; }
	.auth-form-content { display: flex; flex-direction: column; justify-content: center; width: 100%; max-width: 360px; box-sizing: border-box; padding: 0; border: 0; background: transparent; box-shadow: none; overflow: hidden; }
	@media (max-width: 480px) { .auth-root { padding: 12px; } }
	@media (max-height: 720px) { .auth-form-content { transform: scale(0.96); transform-origin: center; } }
	@media (max-height: 640px) { .auth-form-content { transform: scale(0.92); } }
</style>