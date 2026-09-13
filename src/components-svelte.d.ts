declare module 'components-svelte/callout' {
	import type { Component, Snippet } from 'svelte';

	type CalloutProps = {
		children?: Snippet;
		title?: string;
		variant?: 'info' | 'warning' | 'note' | 'tip' | 'check' | 'danger' | 'custom';
		class?: string;
		ariaLabel?: string;
	};

	const Callout: Component<CalloutProps>;
	export default Callout;
}

declare module 'components-svelte/card' {
	import type { Component, Snippet } from 'svelte';
	const Card: Component<{ title?: string | Snippet; icon?: string | Snippet; href?: string; children?: string | Snippet; class?: string }>;
	export default Card;
}

declare module 'components-svelte/code-block' {
	import type { Component, Snippet } from 'svelte';
	const CodeBlock: Component<{ language?: string; filename?: string; hideAskAiButton?: boolean; children?: Snippet; class?: string }>;
	export default CodeBlock;
}

declare module 'components-svelte/accordion' {
	import type { Component, Snippet } from 'svelte';
	const Accordion: Component<{ title: string | Snippet; description?: string; defaultOpen?: boolean | string; children?: Snippet; class?: string }>;
	export default Accordion;
}

declare module 'components-svelte/frame' {
	import type { Component, Snippet } from 'svelte';
	const Frame: Component<{ title?: string; description?: string; children?: Snippet; class?: string }>;
	export default Frame;
}

declare module 'components-svelte/expandable' {
	import type { Component, Snippet } from 'svelte';
	const Expandable: Component<{ title?: string; defaultOpen?: boolean; children?: Snippet; class?: string }>;
	export default Expandable;
}

declare module 'components-svelte/property' {
	import type { Component, Snippet } from 'svelte';
	const Property: Component<{ name: string; type: string; required?: boolean; children?: Snippet | string; class?: string }>;
	export default Property;
}

declare module 'components-svelte/step' {
	import type { Component, Snippet } from 'svelte';
	const Step: Component<{ title: string | Snippet; stepNumber?: number | `${number}`; isLast?: boolean; children?: string | Snippet; class?: string }>;
	export default Step;
}

declare module 'components-svelte/steps' {
	import type { Component, Snippet } from 'svelte';
	const Steps: Component<{ children?: Snippet; class?: string }>;
	export default Steps;
}

declare module 'components-svelte/tabs' {
	import type { Component, Snippet } from 'svelte';
	const Tabs: Component<{ children?: Snippet; ariaLabel?: string; class?: string }>;
	export default Tabs;
}

declare module 'components-svelte/tabs-item' {
	import type { Component, Snippet } from 'svelte';
	const TabsItem: Component<{ title: string; children?: string | Snippet }>;
	export default TabsItem;
}
