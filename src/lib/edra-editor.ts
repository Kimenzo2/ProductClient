// Edra publishes its compiled Svelte surfaces below the package root rather
// than exporting the shadcn editor from the package entrypoint. Keep this
// boundary in one local module so the Docs editor does not depend on a
// scattered node_modules path.
import type { Component, Snippet } from 'svelte';
import type { Editor } from '../../node_modules/edra/dist/edra/tiptap/Editor.js';
import { Tiptap, useEditor, AIHighlight, Callout, IFrameExtended, ImageExtended, SlashCommand, SvelteNodeViewRenderer, VideoExtended } from '../../node_modules/edra/dist/edra/tiptap/index.js';
import CodeBlockLowlight from '../../node_modules/@tiptap/extension-code-block-lowlight/dist/index.js';
import { all, createLowlight } from 'lowlight';
import { getDefaultExtensions } from '../../node_modules/edra/dist/edra/extensions.js';
import CodeBlock from '../../node_modules/edra/dist/edra/shadcn/components/CodeBlock.svelte';
import { MediaPlaceholder } from '../../node_modules/edra/dist/edra/tiptap/extensions/MediaPlaceHolder.js';
import MediaPlaceholderComp from '../../node_modules/edra/dist/edra/shadcn/components/MediaPlaceHolder.svelte';
import ImageExtendedComp from '../../node_modules/edra/dist/edra/shadcn/components/ImageExtended.svelte';
import VideoExtendedComp from '../../node_modules/edra/dist/edra/shadcn/components/VideoExtended.svelte';
import IFrameComp from '../../node_modules/edra/dist/edra/shadcn/components/IFrame.svelte';
import SlashCommandComp from '../../node_modules/edra/dist/edra/shadcn/components/SlashCommand.svelte';
import CalloutComp from '../../node_modules/edra/dist/edra/shadcn/components/Callout.svelte';
import TableOfContents, { getHierarchicalIndexes } from '../../node_modules/@tiptap/extension-table-of-contents/dist/index.js';
import { setTocItems } from '../../node_modules/edra/dist/edra/shadcn/toc.svelte';
import EdraContent from './edra-editor-content.svelte';
import BubbleMenu from '../../node_modules/edra/dist/edra/shadcn/components/menu/BubbleMenu.svelte';
import DragHandle from '../../node_modules/edra/dist/edra/shadcn/drag-handle.svelte';
import Toolbar from './edra-toolbar.svelte';

type EditorOptions = {
	onUpdate?: () => void;
	collaborative?: boolean;
	onFileUpload?: (file: File) => Promise<string>;
	callAI?: (prompt: string, onChunk: (chunk: string) => void, onError: (error: Error) => void) => Promise<void>;
};

type EdraSurface = Component<{ editor: Editor | undefined; children?: Snippet }> & {
	Toolbar: Component<{ class?: string }>;
	BubbleMenu: Component<{ class?: string }>;
	Content: Component<{ class?: string }>;
	DragHandle: Component<{ type?: 'simple' | 'extended'; class?: string }>;
};

const lowlight = createLowlight(all);

// Edra's published editor registers Mermaid and imports the Mermaid runtime
// even when a document never uses diagrams. Keep the editor surface intact,
// but leave Mermaid out until the Docs diagram feature is ready for production.
export const createEditor = ((props?: EditorOptions) =>
	useEditor({
		extensions: [
			...getDefaultExtensions({ undoRedo: !props?.collaborative }),
			CodeBlockLowlight.configure({ lowlight }).extend({
				addNodeView() {
					return SvelteNodeViewRenderer(CodeBlock);
				}
			}),
			MediaPlaceholder(MediaPlaceholderComp).configure({ onUpload: props?.onFileUpload }),
			ImageExtended(ImageExtendedComp),
			VideoExtended(VideoExtendedComp),
			IFrameExtended(IFrameComp),
			SlashCommand(SlashCommandComp),
			Callout(CalloutComp),
			AIHighlight.configure({ callAI: props?.callAI || null }),
			TableOfContents.configure({
				getIndex: getHierarchicalIndexes,
				onUpdate: (indexes) => setTocItems(indexes)
			})
		],
		onUpdate: props?.onUpdate || (() => {})
	})) as (options?: EditorOptions) => Editor | undefined;

export const Edra = Object.assign(Tiptap, {
	Content: EdraContent,
	Toolbar,
	BubbleMenu,
	DragHandle
}) as EdraSurface;
