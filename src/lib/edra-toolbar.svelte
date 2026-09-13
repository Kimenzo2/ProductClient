<script lang="ts">
	import { Button } from '../../node_modules/edra/dist/components/ui/button/index.js';
	import { Separator } from '../../node_modules/edra/dist/components/ui/separator/index.js';
	import { commands } from '../../node_modules/edra/dist/edra/commands/index.js';
	import { addAIHighlight, getEditor, useEditorTransaction } from '../../node_modules/edra/dist/edra/tiptap/index.js';
	import { cn } from '../../node_modules/edra/dist/utils.js';
	import { WandSparkles } from '@lucide/svelte';
	import Colors from '../../node_modules/edra/dist/edra/shadcn/components/tools/Colors.svelte';
	import Export from '../../node_modules/edra/dist/edra/shadcn/components/tools/Export.svelte';
	import Tooltip from '../../node_modules/edra/dist/edra/shadcn/components/Tooltip.svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
	const editor = getEditor();
	const transaction = useEditorTransaction(editor);
	const commandsKeys = Object.keys(commands).filter((key) => key !== 'diagram');

	function useAI() {
		void transaction.version;
		return editor.extensionManager.extensions.some(
			(e) => e.name === 'ai-highlight' && e.options?.callAI != null
		);
	}

	function isActive(command: (typeof commands)[string][number]): boolean {
		void transaction.version;
		return command.isActive?.(editor) ?? false;
	}

	function isClickable(command: (typeof commands)[string][number]): boolean {
		void transaction.version;
		return command.clickable?.(editor) ?? true;
	}
</script>

<div class={cn('flex h-full w-fit items-center gap-2', className)}>
	{#if useAI()}
		<Tooltip tooltip="Use AI">
			<Button
				onmousedown={(e) => {
					e.preventDefault();
					addAIHighlight(editor);
				}}
				variant="ghost"
				size="icon"
			>
				<WandSparkles />
			</Button>
		</Tooltip>
	{/if}
	{#each commandsKeys as key (key)}
		{@const group = commands[key]}
		{#each group as command, idx (idx)}
			{@const Icon = command.icon as typeof WandSparkles}
			<Tooltip tooltip={command.tooltip} shortCut={command.shortCut ?? ''}>
				<Button
					variant="ghost"
					size="icon"
					class={cn(isActive(command) && 'bg-muted text-primary')}
					disabled={!isClickable(command)}
					onclick={() => command.onClick?.(editor)}
				>
					<Icon size={14} />
				</Button>
			</Tooltip>
		{/each}
		<Separator orientation="vertical" class="h-6!" />
	{/each}
	<Colors />
	<Export />
</div>
