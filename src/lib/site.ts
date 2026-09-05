// Site-wide SEO config — single source of truth for sitemap, canonical, OG.
// Per AGENTS.md theme: --pc-bg #0d0d0d default, icons reicon-svelte Outline only.

export const SITE_URL = 'https://productclient.com';
export const SITE_NAME = 'ProductClient';
export const SITE_TITLE = 'ProductClient — Interactive launches, roadmaps, docs & incident tracking';
export const SITE_DESCRIPTION =
	'Boost distribution, conversion, ranking, accessibility & turnover with interactive launches, engaging roadmaps & automated docs. Get seen, ship more toward AGI.';

// Static public routes — curated, indexable. Never include /workspace, /studio, /auth, /you, /notifications, /onboarding
// Mirrors docs: canonical versions only, no redirects, no noindex pages.
// Update when adding public surfaces.
export const STATIC_ROUTES: Array<{ path: string; changefreq?: 'daily' | 'weekly' | 'monthly'; priority?: number }> = [
	{ path: '/', changefreq: 'weekly', priority: 1.0 },
	{ path: '/feed', changefreq: 'daily', priority: 0.9 },
	{ path: '/products', changefreq: 'daily', priority: 0.8 },
	{ path: '/launchpad', changefreq: 'daily', priority: 0.8 },
	{ path: '/leaderboard', changefreq: 'daily', priority: 0.7 },
	{ path: '/search', changefreq: 'weekly', priority: 0.5 }
];

export const OG_IMAGE = `${SITE_URL}/og.png`; // TODO: place 1200x630 PNG at static/og.png or generate via src/routes/og.png/+server.ts; fallback favicon.svg avoids 404 until then
export const OG_IMAGE_FALLBACK = `${SITE_URL}/favicon.svg`;
export const TWITTER_HANDLE = '@productclient';
