<script lang="ts">
	import TiptapContent from '../../node_modules/edra/dist/edra/tiptap/components/TiptapContent.svelte';
	import {
		Link,
		MathBlock,
		MathInline,
		TableColMenu,
		TableRowMenu
	} from '../../node_modules/edra/dist/edra/shadcn/components/menu/index.js';
	import { cn } from '../../node_modules/edra/dist/utils.js';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<!-- Mermaid is intentionally omitted until the Docs editor has a dedicated, tested diagram feature. -->
<Link />
<MathBlock />
<MathInline />
<TableColMenu />
<TableRowMenu />
<TiptapContent class={cn('relative', className)} />
