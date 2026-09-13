<script lang="ts">
	let { children } = $props();
</script>

<div class="docs-editor-standalone">
	{@render children()}
</div>

<style>
	.docs-editor-standalone {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--pc-bg);
		overflow: hidden;
	}
	:global(html:has(.docs-editor-standalone)) {
		overflow: hidden;
	}
	:global(body:has(.docs-editor-standalone)) {
		overflow: hidden;
	}
	/* Inside the fixed viewport overlay the shell must fill the viewport, not
	   calc(100dvh - header). The page's own .docs-editor-shell rule is
	   calc(100dvh - var(--pc-header-h)) and would win on specificity (page
	   styles load after layout). Force 100dvh with !important so the
	   editor-workspace flex:1 actually reaches the laptop bottom. */
	:global(.docs-editor-standalone .docs-editor-shell) {
		display: flex !important;
		flex-direction: column !important;
		height: 100dvh !important;
		min-height: 100dvh !important;
		max-height: 100dvh !important;
		overflow: hidden !important;
	}
	:global(.docs-editor-standalone .editor-workspace),
	:global(.docs-editor-standalone .site-config-shell) {
		flex: 1 1 0 !important;
		height: auto !important;
		min-height: 0 !important;
		max-height: none !important;
		overflow: hidden !important;
	}
	:global(.docs-editor-standalone .editor-canvas),
	:global(.docs-editor-standalone .site-config-main),
	:global(.docs-editor-standalone .canvas-scroll),
	:global(.docs-editor-standalone .editor-tree),
	:global(.docs-editor-standalone .site-config-sidebar) {
		min-height: 0 !important;
	}
	/* Desktop bottom breathing room lives inside the editor's own scroller
	   (canvas-scroll / site-config-main), NOT the workspace main. The workspace
	   main's pb-20 lg:pb-0 already clears the fixed mobile nav (lg:hidden, bottom-0
	   z-30) on mobile; the fixed overlay on desktop (z-50) sits above that nav, so
	   it needs its own safe-area + bottom inset. */
	/* Tablet/mobile: drop the fixed overlay so editor flows inside workspace's
	   inner scroller like every other /docs page. Keep 1024 aligned with
	   workspace mobile nav's lg:hidden so nav + editor never fight. Inner
	   two-col -> stacked collapse stays at 680 (phone) so tablet keeps grid. */
	@media (max-width: 1024px) {
		.docs-editor-standalone {
			position: static !important;
			overflow: visible !important;
			height: auto !important;
			min-height: 0 !important;
		}
		:global(.docs-editor-standalone .docs-editor-shell) {
			display: block !important;
			height: auto !important;
			min-height: 0 !important;
			max-height: none !important;
			overflow: visible !important;
		}
		:global(.docs-editor-standalone .editor-workspace),
		:global(.docs-editor-standalone .site-config-shell) {
			display: block !important;
			height: auto !important;
			min-height: 0 !important;
			max-height: none !important;
			overflow: visible !important;
		}
		:global(.docs-editor-standalone .editor-canvas),
		:global(.docs-editor-standalone .site-config-main),
		:global(.docs-editor-standalone .canvas-scroll),
		:global(.docs-editor-standalone .editor-tree),
		:global(.docs-editor-standalone .site-config-sidebar),
		:global(.docs-editor-standalone .tree-list) {
			overflow: visible !important;
			max-height: none !important;
			height: auto !important;
			min-height: 0 !important;
		}
	}
</style>
