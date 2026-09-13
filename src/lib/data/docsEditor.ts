export type DocsViewKind = 'tabs' | 'dropdown';

export type DocsBlock =
	| { id: string; type: 'paragraph'; text: string }
	| { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
	| { id: string; type: 'list'; ordered?: boolean; items: string[] }
	| { id: string; type: 'callout'; variant: 'info' | 'warning' | 'note' | 'tip' | 'check' | 'danger'; title: string; body: string }
	| { id: string; type: 'card'; title: string; body: string; icon?: string; href?: string }
	| { id: string; type: 'code'; language: string; filename?: string; code: string }
	| { id: string; type: 'frame'; caption: string; body: string }
	| { id: string; type: 'steps'; items: Array<{ id: string; title: string; body: string }> }
	| { id: string; type: 'tabs'; items: Array<{ id: string; title: string; body: string }> }
	| { id: string; type: 'accordion'; title: string; description?: string; body: string }
	| { id: string; type: 'property'; name: string; value: string; dataType: string; required?: boolean }
	| { id: string; type: 'expandable'; title: string; body: string; defaultOpen?: boolean; properties?: Array<{ id: string; name: string; value: string; dataType: string; required?: boolean }> };

export type DocsPage = {
	id: string;
	slug: string;
	title: string;
	description: string;
	markdown: string;
	blocks?: DocsBlock[];
	groupId: string | null;
	order: number;
};

export type DocsGroup = {
	id: string;
	label: string;
	order: number;
};

export type DocsView = {
	id: string;
	label: string;
	kind: DocsViewKind;
	order: number;
	groups: DocsGroup[];
};

export type DocsDocument = {
	schemaVersion: 1;
	dimensions: [];
	views: DocsView[];
	pages: DocsPage[];
};

export const emptyDocsDocument: DocsDocument = {
	schemaVersion: 1,
	dimensions: [],
	views: [],
	pages: []
};

function starterPage(
	id: string,
	slug: string,
	title: string,
	description: string,
	markdown: string,
	groupId: string,
	order: number,
	blocks?: DocsBlock[]
): DocsPage {
	return { id, slug, title, description, markdown, ...(blocks ? { blocks } : {}), groupId, order };
}

function blockId(prefix: string, index: number): string {
	return `${prefix}-${index + 1}`;
}

export function markdownToDocsBlocks(markdown: string): DocsBlock[] {
	const chunks = markdown
		.split(/\n{2,}/)
		.map((chunk) => chunk.trim())
		.filter(Boolean);
	const blocks: DocsBlock[] = [];
	for (const [index, chunk] of chunks.entries()) {
		if (/^```/.test(chunk)) {
			const lines = chunk.split('\n');
			const language = lines[0].slice(3).trim() || 'text';
			blocks.push({ id: blockId('code', index), type: 'code', language, code: lines.slice(1, -1).join('\n') });
			continue;
		}
		if (/^#{1,3} /.test(chunk)) {
			const match = chunk.match(/^(#{1,3})\s+(.*)$/s);
			if (match) blocks.push({ id: blockId('heading', index), type: 'heading', level: match[1].length as 1 | 2 | 3, text: match[2].trim() });
			continue;
		}
		if (/^(?:- |\d+\. )/.test(chunk)) {
			const lines = chunk.split('\n').filter(Boolean);
			const ordered = /^\d+\. /.test(lines[0]);
			blocks.push({ id: blockId('list', index), type: 'list', ordered, items: lines.map((line) => line.replace(ordered ? /^\d+\.\s+/ : /^-\s+/, '').trim()) });
			continue;
		}
		if (/^> ?/.test(chunk)) {
			const lines = chunk.split('\n').map((line) => line.replace(/^>\s?/, '').trim());
			blocks.push({ id: blockId('callout', index), type: 'callout', variant: 'tip', title: lines.shift() || 'Note', body: lines.join('\n') });
			continue;
		}
		blocks.push({ id: blockId('paragraph', index), type: 'paragraph', text: chunk });
	}
	return blocks.length ? blocks : [{ id: 'paragraph-1', type: 'paragraph', text: '' }];
}

export function docsBlocksToMarkdown(blocks: DocsBlock[]): string {
	return blocks
		.map((block) => {
			switch (block.type) {
				case 'heading': return `${'#'.repeat(block.level)} ${block.text}`;
				case 'list': return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${item}`).join('\n');
				case 'callout': return [`> ${block.title}`, ...block.body.split('\n').map((line) => `> ${line}`)].join('\n');
			case 'card': return `### ${block.title}\n${block.body}`;
			case 'code': return `\`\`\`${block.language}\n${block.code}\n\`\`\``;
			case 'frame': return `> ${block.caption}\n> ${block.body}`;
				case 'steps': return `## Steps\n${block.items.map((item, index) => `${index + 1}. **${item.title}** — ${item.body}`).join('\n')}`;
			case 'tabs': return block.items.map((item) => `### ${item.title}\n${item.body}`).join('\n\n');
			case 'accordion': return `### ${block.title}\n${block.body}`;
			case 'property': return `- ${block.name} (${block.dataType})${block.required ? ' — required' : ''} — ${block.value}`;
			case 'expandable': return [`### ${block.title}`, block.body, ...(block.properties ?? []).map((property) => `- ${property.name} (${property.dataType})${property.required ? ' — required' : ''} — ${property.value}`)].filter(Boolean).join('\n');
			}
		})
		.filter(Boolean)
		.join('\n\n');
}

/**
 * The first draft for a new tenant mirrors the Documentation Starter Kit.
 * This is content, not a preview fixture: the editor can immediately modify,
 * save, and publish every page below.
 */
export const starterDocsDocument: DocsDocument = {
	schemaVersion: 1,
	dimensions: [],
	views: [
		{
			id: 'starter-documentation',
			label: 'Documentation',
			kind: 'tabs',
			order: 0,
			groups: [
				{ id: 'starter-getting-started', label: 'Getting Started', order: 0 },
				{ id: 'starter-guides', label: 'Guides', order: 1 },
				{ id: 'starter-api', label: 'API Reference', order: 2 },
				{ id: 'starter-reference', label: 'Reference', order: 3 }
			]
		}
	],
	pages: [
		starterPage(
			'index',
			'index',
			'Introduction',
			'Welcome to ProductClient documentation.',
			'ProductClient gives your team a clear place to understand, build, and operate your documentation experience.\n\n> Start here\n> New to ProductClient? Follow the Quickstart to run the site locally, then browse Components and Settings to make it yours.\n\n## Guides\n\n### Quickstart\nSet up your workspace and publish your first documentation page.\n\n### Components\nUse the ProductClient Svelte component library to structure clear, useful documentation.\n\n### Settings\nSet your product name, branding, and navigation in the docs.json file.\n\n## API reference\n\n- Authentication — bearer tokens and API keys\n- Pagination — cursor pagination for lists\n- Errors — standard error shape and codes',
			'starter-getting-started',
			0,
			[
				{ id: 'intro-paragraph', type: 'paragraph', text: 'ProductClient gives your team a clear place to understand, build, and operate your documentation experience.' },
				{ id: 'intro-callout', type: 'callout', variant: 'tip', title: 'Start here', body: 'New to ProductClient? Follow the Quickstart to run the site locally, then browse Components and Settings to make it yours.' },
				{ id: 'intro-guides', type: 'heading', level: 2, text: 'Guides' },
				{ id: 'intro-quickstart', type: 'card', title: 'Quickstart', body: 'Set up your workspace and publish your first documentation page.', icon: 'rocket', href: '/quickstart' },
				{ id: 'intro-components', type: 'card', title: 'Components', body: 'Use the ProductClient Svelte component library to structure clear documentation.', icon: 'blocks', href: '/components' },
				{ id: 'intro-settings', type: 'card', title: 'Settings', body: 'Set your product name, branding, and navigation in the docs.json file.', icon: 'settings', href: '/settings' },
				{ id: 'intro-api', type: 'heading', level: 2, text: 'API reference' },
				{ id: 'intro-api-list', type: 'list', items: ['Authentication — bearer tokens and API keys', 'Pagination — cursor pagination for lists', 'Errors — standard error shape and codes'] }
			]
		),
		starterPage(
			'quickstart',
			'quickstart',
			'Quickstart',
			'Begin with the fastest path to a successful ProductClient documentation site.',
			'Follow these steps to take the local starter from a clean workspace to a running documentation site.\n\nA quickstart should take someone from zero to a useful first result. These steps give you a quick win and a clear place to continue.\n\n## Prerequisites\n\nBefore you begin, make sure you have:\n\n- Bun 1.4 or a compatible JavaScript runtime.\n- A modern browser with JavaScript enabled.\n\n## Get started\n\n### 1. Install the project\nInstall the dependencies with Bun from the Documentation Starter Kit directory.\n\n### 2. Start the local site\nRun the development server on the project’s dedicated local port.\n\n### 3. Make it yours\nEdit the content files, update the ProductClient configuration, and keep the shell tokens as the shared visual foundation.\n\n> Next step\n> Continue to Components to learn the building blocks, or open Settings to name and brand your site.',
			'starter-getting-started',
			1,
			[
				{ id: 'quickstart-intro', type: 'paragraph', text: 'Follow these steps to take the local starter from a clean workspace to a running documentation site.' },
				{ id: 'quickstart-context', type: 'paragraph', text: 'A quickstart should take someone from zero to a useful first result. These steps give you a quick win and a clear place to continue.' },
				{ id: 'quickstart-prerequisites', type: 'heading', level: 2, text: 'Prerequisites' },
				{ id: 'quickstart-prerequisites-list', type: 'list', items: ['Bun 1.4 or a compatible JavaScript runtime.', 'A modern browser with JavaScript enabled.'] },
				{ id: 'quickstart-steps', type: 'steps', items: [
					{ id: 'quickstart-step-1', title: 'Install the project', body: 'Install the dependencies with Bun from the Documentation Starter Kit directory.' },
					{ id: 'quickstart-step-2', title: 'Start the local site', body: 'Run the development server on the project’s dedicated local port.' },
					{ id: 'quickstart-step-3', title: 'Make it yours', body: 'Edit the content files, update the ProductClient configuration, and keep the shell tokens as the shared visual foundation.' }
				] },
				{ id: 'quickstart-install-code', type: 'code', language: 'bash', filename: 'install.sh', code: 'bun install' },
				{ id: 'quickstart-dev-code', type: 'code', language: 'bash', code: 'bun run dev -- --host 127.0.0.1 --port 3004' },
				{ id: 'quickstart-next', type: 'callout', variant: 'tip', title: 'Next step', body: 'Continue to Components to learn the building blocks, or open Settings to name and brand your site.' }
			]
		),
		starterPage(
			'components',
			'components',
			'Components',
			'Building blocks for clear product documentation.',
			'ProductClient ships a small set of documentation components. Use them inside any page to keep guides consistent. All live examples use the shared components-svelte library and work in light and dark.\n\n> Where components live\n> All components come from the shared components-svelte library, so every tenant gets the same finished look in light and dark mode.\n\n## Callouts\n\nCallouts highlight information without breaking the flow. Use info for context, warning for side effects, danger for irreversible actions, and tip for a recommended next step.\n\n## Tabs and accordions\n\nGroup related content without leaving the page, or collapse long details behind a heading.\n\n## Cards\n\nUse cards to link between guides and make the next useful action obvious.\n\n## Step lists\n\nGuide readers through a sequence with numbered steps.\n\n## Code blocks\n\nCode blocks show language, filename, and a copy button. Copy is handled by the library.\n\n## Diagrams\n\nMermaid diagrams render to SVG and remain readable in dark mode. Broken source shows an error in place, not a blank page.',
			'starter-guides',
			2,
			[
				{ id: 'components-intro', type: 'paragraph', text: 'ProductClient ships a small set of documentation components. Use them inside any page to keep guides consistent. All live examples use the shared components-svelte library and work in light and dark.' },
				{ id: 'components-source', type: 'callout', variant: 'info', title: 'Where components live', body: 'All components come from the shared components-svelte library, so every tenant gets the same finished look in light and dark mode.' },
				{ id: 'components-callouts', type: 'heading', level: 2, text: 'Callouts' },
				{ id: 'components-callouts-copy', type: 'paragraph', text: 'Callouts highlight information without breaking the flow.' },
				{ id: 'components-callout-info', type: 'callout', variant: 'info', title: 'Info', body: 'This is an info callout. Use it for general context or tips.' },
				{ id: 'components-callout-warning', type: 'callout', variant: 'warning', title: 'Warning', body: 'This is a warning. Use it when an action could have side effects.' },
				{ id: 'components-callout-danger', type: 'callout', variant: 'danger', title: 'Danger', body: 'This is a danger callout. Use it for breaking changes or irreversible actions.' },
				{ id: 'components-tabs-heading', type: 'heading', level: 2, text: 'Tabs' },
				{ id: 'components-tabs-copy', type: 'paragraph', text: 'Group related content without leaving the page.' },
				{ id: 'components-tabs', type: 'tabs', items: [
					{ id: 'components-tab-curl', title: 'cURL', body: 'curl https://api.productclient.com/v1/users -H "Authorization: Bearer TOKEN"' },
					{ id: 'components-tab-typescript', title: 'TypeScript', body: 'fetchDocs()' },
					{ id: 'components-tab-python', title: 'Python', body: 'print("hello")' }
				] },
				{ id: 'components-accordion-heading', type: 'heading', level: 2, text: 'Accordion' },
				{ id: 'components-accordion-copy', type: 'paragraph', text: 'Collapse long details behind a heading.' },
				{ id: 'components-accordion-product', type: 'accordion', title: 'What is ProductClient?', description: 'A docs platform for product teams', body: 'ProductClient is a platform for creating beautiful documentation for your products.' },
				{ id: 'components-accordion-start', type: 'accordion', title: 'How do I start?', description: 'Install and run locally', body: 'Run bun install and bun run dev to start the starter kit.' },
				{ id: 'components-cards-heading', type: 'heading', level: 2, text: 'Cards' },
				{ id: 'components-cards-copy', type: 'paragraph', text: 'Use cards to link between guides.' },
				{ id: 'components-card-quickstart', type: 'card', title: 'Quickstart', body: 'Set up your workspace and publish your first documentation page.', icon: 'rocket', href: '/quickstart' },
				{ id: 'components-card-settings', type: 'card', title: 'Settings', body: 'Set your product name, branding, and navigation in docs.json.', icon: 'settings', href: '/settings' },
				{ id: 'components-steps-heading', type: 'heading', level: 2, text: 'Step lists' },
				{ id: 'components-steps-copy', type: 'paragraph', text: 'Guide the reader through a sequence.' },
				{ id: 'components-steps', type: 'steps', items: [
					{ id: 'components-step-1', title: 'Install the project', body: 'Run bun install from the starter kit directory.' },
					{ id: 'components-step-2', title: 'Start the local site', body: 'Run bun run dev and open the local URL.' },
					{ id: 'components-step-3', title: 'Make it yours', body: 'Edit the page files and docs.json to match your product.' }
				] },
				{ id: 'components-code-heading', type: 'heading', level: 2, text: 'Code blocks' },
				{ id: 'components-code-copy', type: 'paragraph', text: 'Code blocks show language, filename, and a copy button. Copy is handled by the library.' },
				{ id: 'components-code-install', type: 'code', language: 'bash', filename: 'install.sh', code: 'bun install' },
				{ id: 'components-code-typescript', type: 'code', language: 'typescript', filename: 'hello.ts', code: 'console.log("hello")' },
				{ id: 'components-code-json', type: 'code', language: 'json', filename: 'docs.json', code: 'docsJson.navigation.pages' },
				{ id: 'components-diagrams-heading', type: 'heading', level: 2, text: 'Diagrams' },
				{ id: 'components-diagrams-copy', type: 'callout', variant: 'info', title: 'Mermaid is disabled', body: 'Interactive Mermaid diagrams are intentionally disabled in this editor MVP. This content boundary is reserved for a future editor-safe implementation.' },
				{ id: 'components-code-groups', type: 'heading', level: 2, text: 'Code groups' },
				{ id: 'components-code-groups-copy', type: 'paragraph', text: 'Several code blocks can be bound as tabs with one copy control for the active tab.' },
				{ id: 'components-code-groups-tabs', type: 'tabs', items: [
					{ id: 'components-group-curl', title: 'cURL', body: 'curl https://api.productclient.com/v1/users -H "Authorization: Bearer $TOKEN"' },
					{ id: 'components-group-js', title: 'JavaScript', body: "await fetch('https://api.productclient.com/v1/users', { headers: { Authorization: 'Bearer ' + token } })" },
					{ id: 'components-group-python', title: 'Python', body: "import requests\nrequests.get('https://api.productclient.com/v1/users', headers={'Authorization': f'Bearer {token}'})" }
				] },
				{ id: 'components-copy', type: 'callout', variant: 'tip', title: 'Copy', body: 'Use the copy button on the active language — the group keeps one control per tab and respects the current tab selection.' },
				{ id: 'components-images', type: 'heading', level: 2, text: 'Images with captions' },
				{ id: 'components-images-copy', type: 'paragraph', text: 'Use Frame for images that need a caption. Replace the placeholder with your screenshot.' },
				{ id: 'components-images-frame', type: 'frame', caption: 'ProductClient docs shell in light and dark', body: 'Image placeholder — replace with your screenshot' },
				{ id: 'components-more', type: 'heading', level: 2, text: 'More' },
				{ id: 'components-more-copy', type: 'list', items: ['Authentication — parameters and token details', 'Pagination — list parameters and cursors', 'Errors — standard error codes'] }
			]
		),
		starterPage(
			'mcp',
			'mcp',
			'Use with agents',
			'Connect Cursor, Claude, or any MCP client to your docs.',
			'Every docs site hosts a Reader MCP server on its own host. Point your agent at that host — it will search and read only that tenant’s pages.\n\n> Server URL\n> https://YOUR_TENANT.productclient.com/mcp — also available at /_mcp. Replace YOUR_TENANT with your docs subdomain. For the default site use https://docs.productclient.com/mcp.\n\n## Cursor\n\nAdd the tenant MCP URL to your Cursor configuration.\n\n## Claude Code\n\nAdd the tenant MCP URL to Claude Code using the HTTP transport.\n\n## Tools\n\n- search — searches titles, headings, and body of published pages for this host.\n- fetch — fetches a page as markdown with title and source citation.\n\n## Skill and llms.txt\n\nEvery hosted tenant exposes an llms.txt index and a skill.md guide.',
			'starter-guides',
			3,
			[
				{ id: 'mcp-intro', type: 'paragraph', text: 'Every docs site hosts a Reader MCP server on its own host. Point your agent at that host — it will search and read only that tenant’s pages.' },
				{ id: 'mcp-server-url', type: 'callout', variant: 'info', title: 'Server URL', body: 'https://YOUR_TENANT.productclient.com/mcp — also available at /_mcp. Replace YOUR_TENANT with your docs subdomain. For the default site use https://docs.productclient.com/mcp.' },
				{ id: 'mcp-cursor', type: 'heading', level: 2, text: 'Cursor' },
				{ id: 'mcp-cursor-copy', type: 'paragraph', text: 'Add to .cursor/mcp.json:' },
				{ id: 'mcp-cursor-code', type: 'code', language: 'json', filename: '.cursor/mcp.json', code: '{\n  "mcpServers": {\n    "productclient-docs": {\n      "url": "https://YOUR_TENANT.productclient.com/mcp"\n    }\n  }\n}' },
				{ id: 'mcp-claude', type: 'heading', level: 2, text: 'Claude Code' },
				{ id: 'mcp-claude-copy', type: 'paragraph', text: 'Add the tenant MCP URL to Claude Code using the HTTP transport.' },
				{ id: 'mcp-claude-code', type: 'code', language: 'bash', code: 'claude mcp add --transport http productclient-docs https://YOUR_TENANT.productclient.com/mcp' },
				{ id: 'mcp-tools', type: 'heading', level: 2, text: 'Tools' },
				{ id: 'mcp-tools-list', type: 'list', items: ['search — searches titles, headings, and body of published pages for this host. Returns title, url, and snippet.', 'fetch — fetches a page as markdown with title and Source: https://... citation. Use a path like /quickstart or a full URL.', 'Results cite the page URL. Search uses the same index as site search.'] },
				{ id: 'mcp-skill', type: 'heading', level: 2, text: 'Skill and llms.txt' },
				{ id: 'mcp-skill-list', type: 'list', items: ['https://YOUR_TENANT.productclient.com/llms.txt — index', 'https://YOUR_TENANT.productclient.com/skill.md — how to use these docs', 'Public sites need no key. Private sites will require auth for MCP.'] }
			]
		),
		starterPage(
			'settings',
			'settings',
			'Settings',
			'Name, branding, and navigation for your docs site.',
			'Each docs site is driven by its tenant config, the docs.json file at the repo root, plus the page files in src/content.\n\n> One file per site\n> Edit docs.json and add a page file, then rebuild.\n\n## Product name and logo\n\nSet name, logo text, and site URL in docs.json. The header, sidebar, footer, and browser tab follow these values.\n\n## Colors and favicon\n\nSet primary, light, and dark colors plus the favicon path in docs.json. New tenants look complete with the defaults.\n\n## Navigation\n\nList groups and pages under navigation.pages in docs.json. Each entry points at a page file: index renders at the root path, quickstart at /quickstart, and nested paths like api/authentication render under their folder.',
			'starter-guides',
			4,
			[
				{ id: 'settings-intro', type: 'paragraph', text: 'Each docs site is driven by its tenant config, the docs.json file at the repo root, plus the page files in src/content.' },
				{ id: 'settings-file', type: 'callout', variant: 'tip', title: 'One file per site', body: 'Edit docs.json and add a page file, then rebuild. No dashboard or page editor is needed for this pass.' },
				{ id: 'settings-brand', type: 'heading', level: 2, text: 'Product name and logo' },
				{ id: 'settings-brand-copy', type: 'paragraph', text: 'Set name, logo text, and site URL in docs.json. The header, sidebar, footer, and browser tab follow these values.' },
				{ id: 'settings-colors', type: 'heading', level: 2, text: 'Colors and favicon' },
				{ id: 'settings-colors-copy', type: 'paragraph', text: 'Set primary, light, and dark colors plus the favicon path in docs.json. New tenants look complete with the defaults.' },
				{ id: 'settings-navigation', type: 'heading', level: 2, text: 'Navigation' },
				{ id: 'settings-navigation-copy', type: 'paragraph', text: 'List groups and pages under navigation.pages in docs.json. Each entry points at a page file: index renders at the root path, quickstart at /quickstart, and nested paths like api/authentication render under their folder.' },
				{ id: 'settings-next', type: 'paragraph', text: 'Continue to the Components page to see what building blocks you can use inside each page, or go back to Introduction for the overview.' }
			]
		),
		starterPage(
			'authentication',
			'api/authentication',
			'Authentication',
			'Authenticate with Bearer tokens and manage API keys.',
			'Authenticate every request with a Bearer token.\n\n> Base URL\n> All API requests go to https://api.productclient.com/v1.\n\n## Bearer token\n\nSend the token as Authorization: Bearer YOUR_TOKEN. Get your key from Settings — API keys.\n\n## Example\n\nUse the Authorization header on every request.\n\n## Errors\n\n- 401 — Missing or invalid token.\n- 403 — Token lacks scope for this resource.',
			'starter-api',
			5,
			[
				{ id: 'auth-intro', type: 'paragraph', text: 'Authenticate every request with a Bearer token.' },
				{ id: 'auth-base', type: 'callout', variant: 'info', title: 'Base URL', body: 'All API requests go to https://api.productclient.com/v1.' },
				{ id: 'auth-bearer', type: 'heading', level: 2, text: 'Bearer token' },
				{ id: 'auth-authorization', type: 'property', name: 'Authorization', dataType: 'string', required: true, value: 'Bearer token. Send as Authorization: Bearer YOUR_TOKEN. Get your key from Settings — API keys. Required. Example: Bearer pc_sk_123...' },
				{ id: 'auth-token-properties', type: 'expandable', title: 'Token properties', defaultOpen: false, body: 'Token values are scoped to the tenant and should be kept private.', properties: [
					{ id: 'auth-token', name: 'token', dataType: 'string', required: true, value: 'Your secret key, prefixed with pc_sk_.' },
					{ id: 'auth-expires', name: 'expiresAt', dataType: 'string', value: 'ISO timestamp or null if non-expiring.' }
				] },
				{ id: 'auth-example', type: 'heading', level: 2, text: 'Example' },
				{ id: 'auth-example-bash', type: 'code', language: 'bash', code: 'curl https://api.productclient.com/v1/users -H "Authorization: Bearer $TOKEN"' },
				{ id: 'auth-example-ts', type: 'code', language: 'typescript', code: "await fetch('https://api.productclient.com/v1/users', { headers: { Authorization: 'Bearer ' + token } });" },
				{ id: 'auth-errors', type: 'heading', level: 2, text: 'Errors' },
				{ id: 'auth-401', type: 'property', name: '401', dataType: 'error', value: 'Missing or invalid token.' },
				{ id: 'auth-403', type: 'property', name: '403', dataType: 'error', value: 'Token lacks scope for this resource.' }
			]
		),
		starterPage(
			'pagination',
			'api/pagination',
			'Pagination',
			'Cursor-based pagination for large collections.',
			'All list endpoints return cursor pagination.\n\n> Default limit\n> limit defaults to 20, max 100. Use cursor for stable iteration.\n\n## Parameters\n\n- limit — items per page, from 1 to 100.\n- cursor — opaque cursor from the previous nextCursor value.\n- order — asc or desc by createdAt.\n\n## Response\n\n- data — array of resources for this page.\n- nextCursor — pass as cursor for the next page, or null when done.',
			'starter-api',
			6,
			[
				{ id: 'pagination-intro', type: 'paragraph', text: 'All list endpoints return cursor pagination.' },
				{ id: 'pagination-default', type: 'callout', variant: 'tip', title: 'Default limit', body: 'limit defaults to 20, max 100. Use cursor for stable iteration.' },
				{ id: 'pagination-params', type: 'heading', level: 2, text: 'Parameters' },
				{ id: 'pagination-limit', type: 'property', name: 'limit', dataType: 'integer', value: 'Items per page. 1–100.' },
				{ id: 'pagination-cursor', type: 'property', name: 'cursor', dataType: 'string', value: 'Opaque cursor from previous nextCursor.' },
				{ id: 'pagination-order', type: 'property', name: 'order', dataType: 'string', value: 'asc or desc by createdAt.' },
				{ id: 'pagination-response', type: 'heading', level: 2, text: 'Response' },
				{ id: 'pagination-data', type: 'property', name: 'data', dataType: 'array', value: 'Array of resources for this page.' },
				{ id: 'pagination-next', type: 'property', name: 'nextCursor', dataType: 'string | null', value: 'Pass as cursor for next page, null when done.' },
				{ id: 'pagination-example', type: 'heading', level: 2, text: 'Example' },
				{ id: 'pagination-example-code', type: 'code', language: 'bash', code: 'curl "https://api.productclient.com/v1/docs?limit=20&cursor=eyJpZCI6IjEyMyJ9" -H "Authorization: Bearer $TOKEN"' }
			]
		),
		starterPage(
			'errors',
			'api/errors',
			'Errors',
			'Standard error shape and codes.',
			'ProductClient uses conventional HTTP codes.\n\n> Error shape\n> error: { code, message, requestId } — always JSON, even for 4xx.\n\n## Codes\n\n- 400 — Bad request.\n- 401 — Unauthorized.\n- 404 — Not found.\n- 429 — Rate limited; retry after Retry-After seconds.\n- 500 — Internal error; contact support with requestId.\n\n## Request ID\n\nInclude x-request-id from the response when opening support tickets.',
			'starter-api',
			7,
			[
				{ id: 'errors-intro', type: 'paragraph', text: 'ProductClient uses conventional HTTP codes.' },
				{ id: 'errors-shape', type: 'callout', variant: 'warning', title: 'Error shape', body: 'error: { code, message, requestId } — always JSON, even for 4xx.' },
				{ id: 'errors-codes', type: 'heading', level: 2, text: 'Codes' },
				{ id: 'errors-400', type: 'property', name: '400', dataType: 'error', value: 'Bad request — check body or query.' },
				{ id: 'errors-401', type: 'property', name: '401', dataType: 'error', value: 'Unauthorized — see Authentication.' },
				{ id: 'errors-404', type: 'property', name: '404', dataType: 'error', value: 'Not found — resource or docs page missing.' },
				{ id: 'errors-429', type: 'property', name: '429', dataType: 'error', value: 'Rate limited — retry after Retry-After seconds.' },
				{ id: 'errors-500', type: 'property', name: '500', dataType: 'error', value: 'Internal — contact support with requestId.' },
				{ id: 'errors-request-id', type: 'heading', level: 2, text: 'Request ID' },
				{ id: 'errors-request-id-copy', type: 'paragraph', text: 'Include x-request-id from the response when opening support tickets.' }
			]
		),
		starterPage(
			'get-users',
			'api/reference/get-users',
			'GET /users',
			'Retrieve a list of users. Supports pagination via limit and cursor.',
			'> GET /users\n> Retrieve a list of users. Supports pagination via limit and cursor.\n\n## Parameters\n\n- limit — items per page.\n\n## Responses\n\n### 200\n\nA list of users is returned with the next cursor when more results are available.',
			'starter-reference',
			8,
			[
				{ id: 'get-users-callout', type: 'callout', variant: 'info', title: 'GET /users', body: 'Retrieve a list of users. Supports pagination via limit and cursor.' },
				{ id: 'get-users-params', type: 'heading', level: 2, text: 'Parameters' },
				{ id: 'get-users-limit', type: 'property', name: 'limit', dataType: 'integer', value: 'Items per page.' },
				{ id: 'get-users-responses', type: 'heading', level: 2, text: 'Responses' },
				{ id: 'get-users-200', type: 'heading', level: 3, text: '200' },
				{ id: 'get-users-200-copy', type: 'paragraph', text: 'A list of users' },
				{ id: 'get-users-200-code', type: 'code', language: 'json', code: '[\n  {\n    "id": 1,\n    "name": "Ada Lovelace"\n  }\n]' },
				{ id: 'get-users-try', type: 'heading', level: 2, text: 'Try it' },
				{ id: 'get-users-try-copy', type: 'callout', variant: 'tip', title: 'GET /users', body: 'Try this request against https://jsonplaceholder.typicode.com. The live editor will connect this action to the tenant API.' }
			]
		),
		starterPage(
			'get-user',
			'api/reference/get-users-id',
			'GET /users/{id}',
			'Retrieve a single user by ID.',
			'> GET /users/{id}\n> Retrieve a single user by ID.\n\n## Parameters\n\n- id — user ID.\n\n## Responses\n\n### 200\n\nThe user was found.\n\n### 404\n\nThe user was not found.',
			'starter-reference',
			9,
			[
				{ id: 'get-user-callout', type: 'callout', variant: 'info', title: 'GET /users/{id}', body: 'Retrieve a single user by ID.' },
				{ id: 'get-user-params', type: 'heading', level: 2, text: 'Parameters' },
				{ id: 'get-user-id', type: 'property', name: 'id', dataType: 'integer', required: true, value: 'User ID' },
				{ id: 'get-user-responses', type: 'heading', level: 2, text: 'Responses' },
				{ id: 'get-user-200', type: 'heading', level: 3, text: '200' },
				{ id: 'get-user-200-copy', type: 'paragraph', text: 'User found' },
				{ id: 'get-user-200-code', type: 'code', language: 'json', code: '{\n  "id": 1,\n  "name": "Ada Lovelace",\n  "email": "ada@example.com"\n}' },
				{ id: 'get-user-404', type: 'heading', level: 3, text: '404' },
				{ id: 'get-user-404-copy', type: 'paragraph', text: 'Not found' },
				{ id: 'get-user-try', type: 'heading', level: 2, text: 'Try it' },
				{ id: 'get-user-try-copy', type: 'callout', variant: 'tip', title: 'GET /users/{id}', body: 'Try this request against https://jsonplaceholder.typicode.com. The live editor will connect this action to the tenant API.' }
			]
		),
		starterPage(
			'post-users',
			'api/reference/post-users',
			'POST /users',
			'Create a new user.',
			'> POST /users\n> Create a new user.\n\n## Body\n\n- name — full name, required.\n- email — email address, required.\n\n## Responses\n\n### 201\n\nThe user was created.',
			'starter-reference',
			10,
			[
				{ id: 'post-users-callout', type: 'callout', variant: 'info', title: 'POST /users', body: 'Create a new user.' },
				{ id: 'post-users-params', type: 'heading', level: 2, text: 'Parameters' },
				{ id: 'post-users-none', type: 'paragraph', text: 'No parameters.' },
				{ id: 'post-users-body', type: 'heading', level: 2, text: 'Body' },
				{ id: 'post-users-name', type: 'property', name: 'name', dataType: 'string', required: true, value: 'Full name' },
				{ id: 'post-users-email', type: 'property', name: 'email', dataType: 'string', required: true, value: 'Email address' },
				{ id: 'post-users-responses', type: 'heading', level: 2, text: 'Responses' },
				{ id: 'post-users-201', type: 'heading', level: 3, text: '201' },
				{ id: 'post-users-201-copy', type: 'paragraph', text: 'Created' },
				{ id: 'post-users-201-code', type: 'code', language: 'json', code: '{\n  "id": 101,\n  "name": "Ada Lovelace"\n}' },
				{ id: 'post-users-try', type: 'heading', level: 2, text: 'Try it' },
				{ id: 'post-users-try-copy', type: 'callout', variant: 'tip', title: 'POST /users', body: 'Try this request with name and email against https://jsonplaceholder.typicode.com. The live editor will connect this action to the tenant API.' }
			]
		)
	]
};

export function cloneDocsDocument(document: DocsDocument): DocsDocument {
	return structuredClone(document);
}

export function normalizeSlug(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}

export function pagePath(slug: string): string {
	const normalized = normalizeSlug(slug);
	return normalized && normalized !== 'index' ? `/${normalized}` : '/';
}

export function validateDocsDocument(value: unknown): string[] {
	if (!value || typeof value !== 'object') return ['Document must be an object'];
	const document = value as Partial<DocsDocument>;
	if (document.schemaVersion !== 1) return ['Unsupported document schema'];
	if (!Array.isArray(document.dimensions) || document.dimensions.length > 0) return ['Dimensions are not enabled yet'];
	if (!Array.isArray(document.views) || !Array.isArray(document.pages)) return ['Document navigation is incomplete'];
	const issues: string[] = [];
	const slugs = new Set<string>();
	for (const page of document.pages as DocsPage[]) {
		if (!page || typeof page !== 'object') {
			issues.push('Every page must be an object');
			continue;
		}
		const slug = normalizeSlug(String(page.slug ?? ''));
		if (!slug) issues.push(`Page ${String(page.id ?? 'unknown')} needs a URL slug`);
		if (slugs.has(slug)) issues.push(`Duplicate page slug: ${slug}`);
		slugs.add(slug);
		if (!String(page.title ?? '').trim()) issues.push(`Page ${slug || 'unknown'} needs a title`);
		if (String(page.markdown ?? '').length > 200_000) issues.push(`Page ${slug || 'unknown'} is too large`);
	}
	return issues;
}

export function documentBytes(document: unknown): number {
	return new TextEncoder().encode(JSON.stringify(document ?? '')).byteLength;
}
