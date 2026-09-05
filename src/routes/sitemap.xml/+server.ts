// SvelteKit sitemap endpoint — static-only (marketing pages) until real DB wired.
// Per https://svelte.dev/docs/kit/seo : folder sitemap.xml/+server.ts returns text/xml.
// A: Ship static marketing pages only. No mockStates — avoids indexing fake /p/[slug] /update/[id].
// When Supabase public products go live, swap to B: query where status='Live' and add dynamic locs.

import { SITE_URL, STATIC_ROUTES } from '$lib/site';

export const prerender = false;

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(): Promise<Response> {
	const now = new Date().toISOString();

	const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number }> = [];

	for (const r of STATIC_ROUTES) {
		urls.push({
			loc: `${SITE_URL}${r.path}`,
			lastmod: now,
			changefreq: r.changefreq ?? 'weekly',
			priority: r.priority ?? 0.7
		});
	}

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		urls
			.map(
				(u) =>
					`  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600, stale-while-revalidate=86400'
		}
	});
}
