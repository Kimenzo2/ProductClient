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
	.auth-root { width: 100%; min-height: 100dvh; display: grid; place-items: center; padding: 16px 16px max(16px, env(safe-area-inset-bottom)); background: var(--pc-bg); color: var(--pc-text); }
	.auth-frame { width: 100%; max-width: 400px; display: grid; place-items: center; padding-block: 16px; }
	.auth-form-pane { display: grid; place-items: center; width: 100%; background: transparent; }
	.auth-form-content { display: flex; flex-direction: column; justify-content: center; width: 100%; max-width: 360px; box-sizing: border-box; padding: 0; border: 0; background: transparent; box-shadow: none; }
	@media (max-width: 480px) { .auth-root { padding: 12px 12px max(12px, env(safe-area-inset-bottom)); } }
	@media (max-height: 700px) { .auth-root { place-items: start center; padding-block: 12px; } .auth-form-content { justify-content: flex-start; } }
</style>