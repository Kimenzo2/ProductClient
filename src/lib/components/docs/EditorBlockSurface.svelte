<script lang="ts">
	import { onMount } from 'svelte';
	import Callout from 'components-svelte/callout';
	import { Add, ChevronDown, Trash } from 'reicon-svelte';
	import { tooltip } from '$lib/components/Tooltip.svelte';
	import type { DocsBlock } from '$lib/data/docsEditor';
	import type { Component } from 'svelte';

	type LoadedComponent = Component<any>;

	type Props = {
		blocks: DocsBlock[];
		onChange: (blocks: DocsBlock[]) => void;
	};

	let { blocks, onChange }: Props = $props();
	let blockMenuOpen = $state(false);
	let CardComponent = $state<LoadedComponent | null>(null);
	let FrameComponent = $state<LoadedComponent | null>(null);
	let AccordionComponent = $state<LoadedComponent | null>(null);
	let ExpandableComponent = $state<LoadedComponent | null>(null);
	let PropertyComponent = $state<LoadedComponent | null>(null);
	let StepComponent = $state<LoadedComponent | null>(null);
	let StepsComponent = $state<LoadedComponent | null>(null);
	let TabsComponent = $state<LoadedComponent | null>(null);
	let TabsItemComponent = $state<LoadedComponent | null>(null);

	onMount(async () => {
		const [card, frame, accordion, expandable, property, step, steps, tabs, tabsItem] = await Promise.all([
			import('components-svelte/card'),
			import('components-svelte/frame'),
			import('components-svelte/accordion'),
			import('components-svelte/expandable'),
			import('components-svelte/property'),
			import('components-svelte/step'),
			import('components-svelte/steps'),
			import('components-svelte/tabs'),
			import('components-svelte/tabs-item')
		]);
		CardComponent = card.default;
		FrameComponent = frame.default;
		AccordionComponent = accordion.default;
		ExpandableComponent = expandable.default;
		PropertyComponent = property.default;
		StepComponent = step.default;
		StepsComponent = steps.default;
		TabsComponent = tabs.default;
		TabsItemComponent = tabsItem.default;
	});

	const blockTypes = [
		{ type: 'paragraph', label: 'Paragraph' },
		{ type: 'heading', label: 'Heading' },
		{ type: 'list', label: 'List' },
		{ type: 'callout', label: 'Callout' },
		{ type: 'card', label: 'Card' },
		{ type: 'code', label: 'Code block' },
		{ type: 'frame', label: 'Frame' },
		{ type: 'steps', label: 'Steps' },
		{ type: 'tabs', label: 'Tabs' },
		{ type: 'accordion', label: 'Accordion' },
		{ type: 'property', label: 'Property' },
		{ type: 'expandable', label: 'Expandable' }
	] as const;

	function commit(nextBlocks: DocsBlock[]) {
		onChange(nextBlocks);
	}

	function patchBlock(index: number, patch: Partial<DocsBlock>) {
		const next = [...blocks];
		const block = next[index];
		if (!block) return;
		next[index] = { ...block, ...patch } as DocsBlock;
		commit(next);
	}

	function patchCollectionItem(index: number, itemIndex: number, field: 'title' | 'body', value: string) {
		const block = blocks[index];
		if (!block || (block.type !== 'steps' && block.type !== 'tabs')) return;
		const next = [...blocks];
		next[index] = { ...block, items: block.items.map((item, currentIndex) => currentIndex === itemIndex ? { ...item, [field]: value } : item) };
		commit(next);
	}

	function newBlock(type: DocsBlock['type']): DocsBlock {
		const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		if (type === 'heading') return { id, type, level: 2, text: 'New heading' };
		if (type === 'list') return { id, type, items: ['New list item'] };
		if (type === 'callout') return { id, type, variant: 'tip', title: 'A useful note', body: 'Explain the context readers need.' };
		if (type === 'card') return { id, type, title: 'New card', body: 'Describe the next useful action.', icon: 'sparkles' };
		if (type === 'code') return { id, type, language: 'ts', filename: 'example.ts', code: 'const result = await client.list();' };
		if (type === 'frame') return { id, type, caption: 'Caption', body: 'Replace this placeholder with an image or embedded surface.' };
		if (type === 'steps') return { id, type, items: [{ id: `${id}-1`, title: 'First step', body: 'Describe what the reader should do.' }] };
		if (type === 'tabs') return { id, type, items: [{ id: `${id}-1`, title: 'Example', body: 'Add the content for this tab.' }, { id: `${id}-2`, title: 'Details', body: 'Add supporting detail.' }] };
		if (type === 'accordion') return { id, type, title: 'More details', description: 'Optional supporting context.', body: 'Add the details readers can expand.' };
		if (type === 'property') return { id, type, name: 'parameter', value: 'Describe this parameter.', dataType: 'string', required: false };
		if (type === 'expandable') return { id, type, title: 'More details', body: 'Add the details readers can expand.', defaultOpen: false, properties: [] };
		return { id, type: 'paragraph', text: 'Start writing here.' };
	}

	function addBlock(type: DocsBlock['type'], index = blocks.length - 1) {
		const next = [...blocks];
		next.splice(index + 1, 0, newBlock(type));
		blockMenuOpen = false;
		commit(next);
	}

	function removeBlock(index: number) {
		commit(blocks.filter((_, currentIndex) => currentIndex !== index));
	}
</script>

<div class="document-editor-toolbar">
	<div class="block-menu-anchor">
		<button class="document-add-block" type="button" aria-expanded={blockMenuOpen} onclick={() => (blockMenuOpen = !blockMenuOpen)}>
			<Add size={13} weight="Outline" aria-hidden="true" /> Add block <ChevronDown size={12} weight="Outline" aria-hidden="true" />
		</button>
		{#if blockMenuOpen}
			<div class="block-menu" role="menu" aria-label="Insert documentation block">
				{#each blockTypes as option}
					<button class="block-menu-item" type="button" role="menuitem" onclick={() => addBlock(option.type)}>{option.label}</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<div class="document-editor-body" aria-label="Documentation content editor">
	{#each blocks as block, index (block.id)}
		<div class="document-block" data-block-type={block.type}>
			<button class="document-block-add" type="button" aria-label={`Add block after block ${index + 1}`} use:tooltip={{ text: 'Add block', island: true }} onclick={() => addBlock('paragraph', index)}><Add size={13} weight="Outline" aria-hidden="true" /></button>
			{#if block.type === 'paragraph'}
				<textarea class="document-block-input document-block-paragraph" rows="3" aria-label={`Paragraph ${index + 1}`} value={block.text} placeholder="Start writing your documentation…" oninput={(event) => patchBlock(index, { text: event.currentTarget.value })}></textarea>
			{:else if block.type === 'heading'}
				<div class="document-heading-editor">
					<div class="document-heading-level" role="group" aria-label={`Heading level for block ${index + 1}`}>
						{#each [1, 2, 3] as level}
							<button class:active={block.level === level} type="button" aria-pressed={block.level === level} onclick={() => patchBlock(index, { level: level as 1 | 2 | 3 })}>H{level}</button>
						{/each}
					</div>
					<input class:document-block-heading={block.level === 1} class:document-block-subheading={block.level > 1} class="document-block-input" aria-label={`Heading ${index + 1}`} value={block.text} oninput={(event) => patchBlock(index, { text: event.currentTarget.value })} />
				</div>
			{:else if block.type === 'list'}
				<textarea class="document-block-input document-block-list" rows={Math.max(2, block.items.length)} aria-label={`List ${index + 1}`} value={block.items.join('\n')} oninput={(event) => patchBlock(index, { items: event.currentTarget.value.split('\n').filter((item) => item.trim()) })}></textarea>
			{:else if block.type === 'callout'}
				<div class="document-component-wrap">
					<div class="component-property-row"><input aria-label={`Callout title ${index + 1}`} value={block.title} oninput={(event) => patchBlock(index, { title: event.currentTarget.value })} /><span class="component-type">{block.variant}</span></div>
					<Callout class="document-component-callout" variant={block.variant} title={block.title} ariaLabel={`Documentation callout ${index + 1}`}>
						<textarea class="document-component-input" rows="3" aria-label={`Documentation callout ${index + 1}`} value={block.body} placeholder="Add a note for readers…" oninput={(event) => patchBlock(index, { body: event.currentTarget.value })}></textarea>
					</Callout>
				</div>
			{:else if block.type === 'card'}
				<div class="document-component-wrap">
					<div class="component-property-grid"><input aria-label={`Card title ${index + 1}`} value={block.title} oninput={(event) => patchBlock(index, { title: event.currentTarget.value })} /><input aria-label={`Card link ${index + 1}`} value={block.href ?? ''} placeholder="/optional-link" oninput={(event) => patchBlock(index, { href: event.currentTarget.value || undefined })} /></div>
					{#if CardComponent}
						{@const CardView = CardComponent}
						<CardView class="document-component-card" title={block.title} icon={block.icon} href={block.href || undefined}>
							<textarea class="document-component-input" rows="3" aria-label={`Card body ${index + 1}`} value={block.body} oninput={(event) => patchBlock(index, { body: event.currentTarget.value })}></textarea>
						</CardView>
					{:else}<div class="component-loading">Loading Card component…</div>{/if}
				</div>
			{:else if block.type === 'code'}
				{#if FrameComponent}
					{@const FrameView = FrameComponent}
					<FrameView class="document-component-frame" title={block.filename || 'Code block'}>
						<pre class="document-code-preview"><code>{block.code}</code></pre>
						<div class="component-code-editor"><input aria-label={`Code language ${index + 1}`} value={block.language} oninput={(event) => patchBlock(index, { language: event.currentTarget.value })} /><textarea aria-label={`Code source ${index + 1}`} rows="6" value={block.code} oninput={(event) => patchBlock(index, { code: event.currentTarget.value })}></textarea></div>
					</FrameView>
				{:else}<div class="component-loading">Loading Frame component…</div>{/if}
			{:else if block.type === 'frame'}
				{#if FrameComponent}
					{@const FrameView = FrameComponent}
					<div class="document-component-wrap">
						<div class="component-property-row"><input aria-label={`Frame caption ${index + 1}`} value={block.caption} oninput={(event) => patchBlock(index, { caption: event.currentTarget.value })} /></div>
						<FrameView class="document-component-frame" description={block.caption}><textarea class="document-component-input" rows="4" aria-label={`Frame content ${index + 1}`} value={block.body} oninput={(event) => patchBlock(index, { body: event.currentTarget.value })}></textarea></FrameView>
					</div>
				{:else}<div class="component-loading">Loading Frame component…</div>{/if}
			{:else if block.type === 'steps'}
				{#if StepsComponent && StepComponent}
					{@const StepsView = StepsComponent}
					<StepsView class="document-component-steps">
						{#each block.items as item, itemIndex (item.id)}
							{@const StepView = StepComponent}
							<StepView title={item.title} stepNumber={itemIndex + 1} isLast={itemIndex === block.items.length - 1}>
								<div class="component-edit-fields"><input aria-label={`Step ${itemIndex + 1} title`} value={item.title} oninput={(event) => patchCollectionItem(index, itemIndex, 'title', event.currentTarget.value)} /><textarea aria-label={`Step ${itemIndex + 1} body`} rows="2" value={item.body} oninput={(event) => patchCollectionItem(index, itemIndex, 'body', event.currentTarget.value)}></textarea></div>
							</StepView>
						{/each}
					</StepsView>
				{:else}<div class="component-loading">Loading Steps components…</div>{/if}
			{:else if block.type === 'tabs'}
				{#if TabsComponent && TabsItemComponent}
					{@const TabsView = TabsComponent}
					<TabsView class="document-component-tabs" ariaLabel={`Tabs block ${index + 1}`}>
						{#each block.items as item, itemIndex (item.id)}
							{@const TabsItemView = TabsItemComponent}
							<TabsItemView title={item.title}><div class="component-edit-fields"><input aria-label={`Tab ${itemIndex + 1} title`} value={item.title} oninput={(event) => patchCollectionItem(index, itemIndex, 'title', event.currentTarget.value)} /><textarea aria-label={`Tab ${itemIndex + 1} body`} rows="3" value={item.body} oninput={(event) => patchCollectionItem(index, itemIndex, 'body', event.currentTarget.value)}></textarea></div></TabsItemView>
						{/each}
					</TabsView>
				{:else}<div class="component-loading">Loading Tabs components…</div>{/if}
			{:else if block.type === 'accordion'}
				<div class="document-component-wrap"><div class="component-property-grid"><input aria-label={`Accordion title ${index + 1}`} value={block.title} oninput={(event) => patchBlock(index, { title: event.currentTarget.value })} /><input aria-label={`Accordion description ${index + 1}`} value={block.description ?? ''} placeholder="Optional description" oninput={(event) => patchBlock(index, { description: event.currentTarget.value })} /></div>{#if AccordionComponent}{@const AccordionView = AccordionComponent}<AccordionView class="document-component-accordion" title={block.title} description={block.description} defaultOpen={true}><textarea class="document-component-input" rows="4" aria-label={`Accordion body ${index + 1}`} value={block.body} oninput={(event) => patchBlock(index, { body: event.currentTarget.value })}></textarea></AccordionView>{:else}<div class="component-loading">Loading Accordion component…</div>{/if}</div>
			{:else if block.type === 'property'}
				<div class="document-component-wrap document-property-editor">
					<div class="component-property-grid"><input aria-label={`Property name ${index + 1}`} value={block.name} oninput={(event) => patchBlock(index, { name: event.currentTarget.value })} /><input aria-label={`Property type ${index + 1}`} value={block.dataType} oninput={(event) => patchBlock(index, { dataType: event.currentTarget.value })} /></div>
					{#if PropertyComponent}
						{@const PropertyView = PropertyComponent}
						<PropertyView class="document-component-property" name={block.name} type={block.dataType} required={block.required}><textarea class="document-component-input" rows="2" aria-label={`Property description ${index + 1}`} value={block.value} oninput={(event) => patchBlock(index, { value: event.currentTarget.value })}></textarea></PropertyView>
					{:else}<div class="component-loading">Loading Property component…</div>{/if}
				</div>
			{:else if block.type === 'expandable'}
				<div class="document-component-wrap document-expandable-editor">
					<div class="component-property-row"><input aria-label={`Expandable title ${index + 1}`} value={block.title} oninput={(event) => patchBlock(index, { title: event.currentTarget.value })} /><label class="component-checkbox"><input type="checkbox" checked={block.defaultOpen ?? false} onchange={(event) => patchBlock(index, { defaultOpen: event.currentTarget.checked })} /> Open by default</label></div>
					{#if ExpandableComponent}
						{@const ExpandableView = ExpandableComponent}
						<ExpandableView class="document-component-expandable" title={block.title} defaultOpen={block.defaultOpen ?? false}>
							<textarea class="document-component-input" rows="3" aria-label={`Expandable body ${index + 1}`} value={block.body} oninput={(event) => patchBlock(index, { body: event.currentTarget.value })}></textarea>
							{#each block.properties ?? [] as property, propertyIndex (property.id)}
								{#if PropertyComponent}{@const PropertyView = PropertyComponent}<PropertyView class="document-component-property" name={property.name} type={property.dataType} required={property.required}><textarea class="document-component-input" rows="2" aria-label={`Expandable property ${propertyIndex + 1}`} value={property.value} oninput={(event) => { const properties = [...(block.properties ?? [])]; properties[propertyIndex] = { ...property, value: event.currentTarget.value }; patchBlock(index, { properties }); }}></textarea></PropertyView>{/if}
							{/each}
						</ExpandableView>
					{:else}<div class="component-loading">Loading Expandable component…</div>{/if}
				</div>
			{/if}
			<button class="document-block-remove" type="button" aria-label={`Remove block ${index + 1}`} use:tooltip={{ text: 'Remove block', island: true }} onclick={() => removeBlock(index)}><Trash size={12} weight="Outline" aria-hidden="true" /></button>
		</div>
	{:else}
		<div class="document-block-empty">Add a block to begin writing.</div>
	{/each}
</div>

<style>
	.document-editor-toolbar { display: flex; justify-content: flex-end; margin-bottom: 7px; }
	.block-menu-anchor { position: relative; }
	.document-add-block { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 0 10px; border: 1px solid var(--editor-border); border-radius: 8px; color: var(--editor-muted); background: var(--pc-surface); cursor: pointer; font: inherit; font-size: 11px; }
	.document-add-block:hover,
	.document-add-block:focus-visible { border-color: var(--pc-text-muted); color: var(--pc-text); outline: 0; }
	.block-menu { position: absolute; z-index: 20; top: calc(100% + 7px); right: 0; display: grid; min-width: 160px; gap: 2px; padding: 5px; border: 1px solid var(--editor-border); border-radius: 10px; background: var(--pc-surface); box-shadow: 0 18px 36px rgba(0, 0, 0, .28); }
	.block-menu-item { min-height: 30px; padding: 0 9px; border: 0; border-radius: 7px; color: var(--editor-muted); background: transparent; cursor: pointer; font: inherit; font-size: 11px; text-align: left; }
	.block-menu-item:hover,
	.block-menu-item:focus-visible { color: var(--pc-text); background: var(--pc-surface-2); outline: 0; }
	.document-editor-body { display: grid; gap: 8px; max-width: 900px; min-width: 0; overflow-wrap: anywhere; padding-bottom: env(safe-area-inset-bottom, 0px); }
	.document-block { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr) 24px; align-items: start; gap: 6px; margin-inline: -30px; min-width: 0; }
	.document-block-add,
	.document-block-remove { display: grid; place-items: center; width: 20px; height: 28px; margin-top: 13px; border: 0; border-radius: 6px; color: var(--editor-faint); background: transparent; cursor: pointer; opacity: 0; transition: opacity 120ms ease, color 120ms ease, background-color 120ms ease; }
	.document-block-add { grid-column: 1; }
	.document-block-remove { grid-column: 3; }
	.document-block:hover .document-block-add,
	.document-block:hover .document-block-remove,
	.document-block:focus-within .document-block-add,
	.document-block:focus-within .document-block-remove { opacity: 1; }
	.document-block-add:hover,
	.document-block-remove:hover { color: var(--pc-text); background: var(--pc-surface-2); }
	.document-block-input { grid-column: 2; display: block; width: 100%; min-width: 0; min-height: 54px; padding: 8px 0; overflow: hidden; overflow-wrap: anywhere; word-break: break-word; border: 1px solid transparent; border-radius: 7px; outline: 0; resize: vertical; color: var(--pc-text); background: transparent; font: inherit; font-size: 16px; line-height: 1.65; }
	.document-block-input:hover,
	.document-block-input:focus-visible { border-color: var(--editor-border-soft); background: color-mix(in oklch, var(--pc-surface) 36%, transparent); outline: 0; }
	.document-block-heading { min-height: 44px; color: var(--pc-text); font-size: clamp(28px, 3vw, 38px); font-weight: 650; letter-spacing: -.045em; line-height: 1.16; }
	.document-block-subheading { min-height: 38px; margin-top: 12px; color: var(--pc-text); font-size: 25px; font-weight: 650; letter-spacing: -.035em; line-height: 1.25; }
	.document-block-list { min-height: 38px; }
	.document-heading-editor { grid-column: 2; min-width: 0; display: grid; gap: 5px; }
	.document-heading-editor > .document-block-input { grid-column: 1; }
	.document-heading-level { display: flex; gap: 3px; opacity: 0; transition: opacity 120ms ease; }
	.document-heading-level { grid-column: 1; }
	.document-heading-editor:hover .document-heading-level,
	.document-heading-editor:focus-within .document-heading-level { opacity: 1; }
	.document-heading-level button { min-width: 28px; min-height: 24px; border: 1px solid var(--editor-border); border-radius: 6px; color: var(--editor-muted); background: transparent; cursor: pointer; font-size: 10px; font-weight: 600; }
	.document-heading-level button.active,
	.document-heading-level button:hover { color: var(--pc-text); background: var(--pc-surface); }
	.document-component-wrap { grid-column: 2; min-width: 0; }
	:global(.document-component-frame),
	:global(.document-component-steps),
	:global(.document-component-tabs) { grid-column: 2; min-width: 0; }
	.component-property-row,
	.component-property-grid,
	.component-code-editor,
	.component-edit-fields { display: grid; gap: 6px; }
	.component-property-row { grid-template-columns: minmax(0, 1fr) auto; align-items: center; margin-bottom: 6px; }
	.component-property-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); margin-bottom: 6px; }
	.component-property-row input,
	.component-property-grid input,
	.component-code-editor input,
	.component-edit-fields input,
	.component-code-editor textarea,
	.component-edit-fields textarea { width: 100%; border: 1px solid var(--editor-border); border-radius: 7px; outline: 0; color: var(--pc-text); background: color-mix(in oklch, var(--pc-bg) 72%, var(--pc-surface)); font: inherit; font-size: 12px; }
	.component-property-row input,
	.component-property-grid input,
	.component-code-editor input,
	.component-edit-fields input { min-height: 30px; padding: 0 9px; }
	.component-code-editor textarea,
	.component-edit-fields textarea { min-height: 54px; padding: 8px 9px; resize: vertical; line-height: 1.5; }
	.component-property-row input:focus-visible,
	.component-property-grid input:focus-visible,
	.component-code-editor input:focus-visible,
	.component-code-editor textarea:focus-visible,
	.component-edit-fields input:focus-visible,
	.component-edit-fields textarea:focus-visible { border-color: var(--pc-text-muted); outline: 2px solid var(--pc-focus-ring); outline-offset: 1px; }
	.component-type { color: var(--editor-faint); font-size: 11px; }
	.component-checkbox { display: inline-flex; align-items: center; gap: 6px; color: var(--editor-muted); font-size: 11px; white-space: nowrap; }
	.component-checkbox input { accent-color: var(--pc-accent, currentColor); }
	.component-loading { min-height: 62px; display: grid; place-items: center; border: 1px dashed var(--editor-border); border-radius: 10px; color: var(--editor-muted); font-size: 12px; }
	:global(.document-component-callout),
	:global(.document-component-card),
	:global(.document-component-accordion) { min-width: 0; }
	.document-component-input { display: block; width: 100%; min-height: 60px; padding: 4px 0 0; border: 0; outline: 0; resize: vertical; color: inherit; background: transparent; font: inherit; line-height: 1.6; }
	.document-component-input:focus-visible { outline: 2px solid var(--pc-focus-ring); outline-offset: 3px; }
	:global(.document-component-frame) :global([data-component-part='frame']) { display: grid; gap: 8px; }
	:global(.document-component-frame) :global(pre) { margin: 0; }
	.document-code-preview { margin: 0; overflow: auto; max-width: 100%; border: 1px solid var(--editor-border); border-radius: 8px; padding: 12px; color: var(--pc-text); background: var(--pc-bg); font: 12px/1.6 var(--font-mono, ui-monospace, monospace); white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
	:global(.document-component-tabs) { margin-block: 8px; }
	.document-block-empty { grid-column: 2; padding: 32px; border: 1px dashed var(--editor-border); border-radius: 10px; color: var(--editor-muted); text-align: center; }
	/* Prevent -30px bleed on narrow containers from creating horizontal scroll that
	   then clips bottom via overflow:hidden ancestors. At 680 the block add gutter
	   collapses, but keep min-width:0 to avoid markdown long token overflow. */
	@media (max-width: 680px) {
		.document-block { margin-inline: -4px; grid-template-columns: 0 minmax(0, 1fr) 20px; min-width: 0; }
		.document-block-add { display: none; }
		.document-block-input,
		.document-heading-editor,
		.document-component-wrap,
		:global(.document-component-frame),
		:global(.document-component-steps),
		:global(.document-component-tabs),
		.document-block-empty { grid-column: 2; }
		.component-property-grid { grid-template-columns: 1fr; }
	}
</style>
