import { docsBlocksToMarkdown, pagePath, type DocsDocument, type DocsPage } from '$lib/data/docsEditor';
import { DOCS_CONTRACT_ID } from '$lib/data/docsEditor';

export type DocsArtifacts = {
	markdown: string;
	llmsTxt: string;
	skillMd: string;
	mcpJson: Record<string, unknown>;
	sitemapXml: string;
};

function originFor(slug: string): string {
	return `https://${slug}.productclient.com`;
}

function pageMarkdown(page: DocsPage): string {
	const body = page.markdown.trim() || (page.blocks?.length ? docsBlocksToMarkdown(page.blocks) : '');
	return body;
}

function sortedPages(document: DocsDocument): DocsPage[] {
	return [...document.pages].sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id));
}

function xml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function buildDocsArtifacts(document: DocsDocument, tenantSlug: string, version: number, contentDigest: string): DocsArtifacts {
	const origin = originFor(tenantSlug);
	const pages = sortedPages(document);
	const lines = [
		`# ${document.siteConfig?.name ?? 'Documentation'}`,
		'',
		`Contract: ${DOCS_CONTRACT_ID}`,
		`Release: v${version}`,
		`Digest: ${contentDigest}`,
		''
	];
	for (const page of pages) {
		const path = pagePath(page.slug);
		lines.push(`## ${page.title}`, '', `Source: ${origin}${path}`, page.description, '', pageMarkdown(page), '', '---', '');
	}
	const markdown = lines.join('\n').trim() + '\n';
	const llmsLines = [
		`# ${document.siteConfig?.name ?? 'Documentation'}`,
		'',
		`> Official documentation for ${document.siteConfig?.brand ?? 'this product'}.`,
		'',
		`- Contract: ${DOCS_CONTRACT_ID}`,
		`- Release: v${version}`,
		`- Digest: ${contentDigest}`,
		`- MCP: ${origin}/mcp`,
		`- Skill: ${origin}/skill.md`,
		`- Full Markdown: ${origin}/llms-full.txt`,
		''
	];
	for (const page of pages) {
		const path = pagePath(page.slug);
		llmsLines.push(`- [${page.title}](${origin}${path}): ${page.description} — Markdown: ${origin}${path === '/' ? '/index' : path}.md`);
	}
	const llmsTxt = llmsLines.join('\n').trim() + '\n';
	const skillMd = [
		`# ${document.siteConfig?.name ?? 'Documentation'} Skill`,
		'',
		`Use the official docs at ${origin}.`,
		'',
		`- Contract: ${DOCS_CONTRACT_ID}`,
		`- Release: v${version}`,
		`- Digest: ${contentDigest}`,
		`- Search: POST ${origin}/mcp with the search tool.`,
		`- Fetch: POST ${origin}/mcp with the fetch tool.`,
		`- Cite canonical URLs from the docs pages.`,
		''
	].join('\n');
	const mcpJson = {
		name: 'productclient-docs-mcp',
		contract: DOCS_CONTRACT_ID,
		version,
		contentDigest,
		endpoint: `${origin}/mcp`,
		tools: ['search', 'fetch']
	};
	const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((page) => `<url><loc>${xml(origin + pagePath(page.slug))}</loc></url>`).join('')}</urlset>`;
	return { markdown, llmsTxt, skillMd, mcpJson, sitemapXml };
}

export function docsArtifactFiles(document: DocsDocument, artifacts: DocsArtifacts): Array<{ path: string; content: string }> {
	return [
		{ path: 'productclient.docs.json', content: JSON.stringify(document, null, 2) + '\n' },
		{ path: 'llms.txt', content: artifacts.llmsTxt },
		{ path: 'skill.md', content: artifacts.skillMd },
		{ path: 'mcp.json', content: JSON.stringify(artifacts.mcpJson, null, 2) + '\n' },
		{ path: 'sitemap.xml', content: artifacts.sitemapXml },
		{ path: 'llms-full.txt', content: artifacts.markdown }
	];
}
