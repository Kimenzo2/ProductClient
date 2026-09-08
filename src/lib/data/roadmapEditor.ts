import { z } from 'zod';

// Mirrors the Roadmap Starter Kit contract (roadmap.json + roadmap.schema.json).
// The editor surface edits this document, validates it, and exports it.

const isoDateTime = z.iso.datetime({ offset: true, message: 'Must be ISO 8601 timestamp' });

export const RoadmapItemSchema = z.object({
	stage: z.string().trim().min(1, 'Required'),
	title: z.string().trim().min(1, 'Required'),
	outcome: z.string().trim().min(1, 'Required'),
	themes: z.array(z.string().trim().min(1, 'No empty themes')).min(1, 'At least one theme'),
	confidence: z.string().trim().min(1, 'Required'),
	updatedAt: isoDateTime,
	live: z.boolean().optional()
});

export const RoadmapChapterSchema = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/, 'Kebab-case slug'),
	label: z.string().trim().min(1, 'Required'),
	hint: z.string().trim().min(1, 'Required'),
	items: z.array(RoadmapItemSchema).default([])
});

const urlOrPath = z.string().trim().min(1, 'Required').refine((v) => v.startsWith('/') || URL.canParse(v), 'Must be a valid URL or /path');

export const RoadmapDocSchema = z
	.object({
		$schema: z.string().optional(),
		docVersion: z.number().int().min(1).default(1),
		site: z.object({
			name: z.string().trim().min(1, 'Required').max(80),
			tagline: z.string().trim().min(1, 'Required'),
			description: z.string().trim().min(1, 'Required'),
			url: z.string().url('Must be a valid URL'),
			locale: z.string().trim().min(1, 'Required'),
			logo: z.object({ src: urlOrPath, alt: z.string().trim().min(1, 'Required') }),
			icon: urlOrPath,
			favicon: urlOrPath
		}),
		seo: z.object({
			titleTemplate: z.string().trim().min(1, 'Required').refine((v) => v.includes('{title}') && v.includes('{site}'), 'Must contain {title} and {site}'),
			defaultTitle: z.string().trim().min(1, 'Required'),
			description: z.string().trim().min(1, 'Required'),
			themeColor: z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$|^oklch\(.+\)$/, 'Must be hex or oklch'),
			ogImage: urlOrPath
		}),
		navigation: z.object({
			ariaLabel: z.string().trim().min(1, 'Required'),
			allLabel: z.string().trim().min(1, 'Required'),
			showCounts: z.boolean(),
			countSeparator: z.string().trim().min(1, 'Required')
		}),
		copy: z.object({
			heroSubtitle: z.string().trim().min(1, 'Required'),
			chapterSuffix: z.string().trim().min(1, 'Required'),
			skipLink: z.string().trim().min(1, 'Required'),
			emptyChapterTitle: z.string().trim().min(1, 'Required'),
			emptyChapterSummary: z.string().trim().min(1, 'Required')
		}),
		stages: z.record(z.string().trim().min(1), z.object({ label: z.string().trim().min(1, 'Required') })).refine((v) => Object.keys(v).length > 0, 'At least one stage'),
		confidence: z.record(z.string().trim().min(1), z.object({ label: z.string().trim().min(1, 'Required') })).refine((v) => Object.keys(v).length > 0, 'At least one confidence level'),
		chapters: z.array(RoadmapChapterSchema).min(1, 'At least one chapter'),
		theme: z.object({
			fonts: z.object({ sans: z.string().min(1), display: z.string().min(1) }),
			accent: z.object({
				hue: z.number(),
				colors: z.object({ '300': z.string().min(1), '500': z.string().min(1), '700': z.string().min(1) })
			}),
			glow: z.string().min(1, 'Required'),
			timeline: z.object({
				orientation: z.enum(['horizontal', 'vertical']),
				rail: z.string().min(1, 'Required'),
				liveGlow: z.boolean()
			}),
			motion: z.object({
				rise: z.string().min(1),
				fade: z.string().min(1),
				stagger: z.object({
					perChapter: z.number().nonnegative(),
					perItem: z.number().nonnegative(),
					max: z.number().nonnegative()
				})
			})
		}),
		footer: z.object({
			description: z.string().trim().min(1, 'Required'),
			links: z.array(z.object({ label: z.string().trim().min(1), href: z.string().trim().min(1).refine((v) => v.startsWith('/') || v.startsWith('https://'), 'Must be /path or https://') })),
			bottomTemplate: z.string().trim().min(1, 'Required')
		}),
		tenant: z.object({ domain: z.string().trim().min(1, 'Required').refine((v) => /^[a-z0-9.-]+$/.test(v), 'Invalid domain') })
	})
	.superRefine((v, ctx) => {
		const seen = new Map<string, number>();
		v.chapters.forEach((c, idx) => {
			if (seen.has(c.id)) {
				ctx.addIssue({ code: 'custom', path: ['chapters', idx, 'id'], message: `Duplicate chapter id "${c.id}"` });
			} else seen.set(c.id, idx);
		});
		v.chapters.forEach((ch, chIdx) => {
			ch.items.forEach((it, itIdx) => {
				if (!(it.stage in v.stages)) {
					ctx.addIssue({ code: 'custom', path: ['chapters', chIdx, 'items', itIdx, 'stage'], message: `"${it.title || 'Untitled'}" uses unknown stage "${it.stage}"` });
				}
				if (!(it.confidence in v.confidence)) {
					ctx.addIssue({ code: 'custom', path: ['chapters', chIdx, 'items', itIdx, 'confidence'], message: `"${it.title || 'Untitled'}" uses unknown confidence "${it.confidence}"` });
				}
			});
		});
	});

export type RoadmapDoc = z.infer<typeof RoadmapDocSchema>;
export type RoadmapDocChapter = RoadmapDoc['chapters'][number];
export type RoadmapDocItem = RoadmapDocChapter['items'][number];

export type DocIssue = { path: string; message: string };

export function validateRoadmapDoc(doc: unknown): DocIssue[] {
	const parsed = RoadmapDocSchema.safeParse(doc);
	if (parsed.success) return [];
	return parsed.error.issues.map((issue) => ({
		path: issue.path.join('.') || '(root)',
		message: issue.message
	}));
}

export function slugify(value: string): string {
	// Mirrors public.normalize_slug (lower, trim, replace [^a-z0-9]+ → -, dedupe, trim - , max 63)
	const s = value
		.toLowerCase()
		.trim()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '') // strip diacritics (JS unaccent)
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
	if (s.length > 63) return s.slice(0, 63).replace(/-+$/g, '');
	return s;
}

export function nowIso(): string {
	const d = new Date();
	d.setMilliseconds(0);
	return d.toISOString();
}

// Seed mirrors the starter kit's roadmap.json so the surface opens on real content.
export const roadmapDocSeed: RoadmapDoc = {
	$schema: './roadmap.schema.json',
	docVersion: 1,
	site: {
		name: 'ProductClient',
		tagline: 'Where the platform is heading.',
		description: "ProductClient's public roadmap. Current thinking, not promises.",
		url: 'https://roadmap.productclient.com',
		locale: 'en-US',
		logo: { src: '/brand-icon.svg', alt: 'ProductClient app icon' },
		icon: '/brand-icon.svg',
		favicon: '/favicon.svg'
	},
	seo: {
		titleTemplate: '{title} · {site} Roadmap',
		defaultTitle: 'ProductClient Roadmap',
		description: 'Where the platform is heading. Current thinking, not promises.',
		themeColor: '#101010',
		ogImage: '/og-roadmap.png'
	},
	navigation: {
		ariaLabel: 'Roadmap chapters',
		allLabel: 'All',
		showCounts: true,
		countSeparator: '·'
	},
	copy: {
		heroSubtitle: 'Where the platform is heading. Current thinking, not promises — things move.',
		chapterSuffix: 'Current thinking, not promises — things move.',
		skipLink: 'Skip to content',
		emptyChapterTitle: 'Nothing here yet',
		emptyChapterSummary: 'Items will appear in this horizon once they are planned.'
	},
	stages: {
		building: { label: 'Building' },
		testing: { label: 'Testing' },
		designed: { label: 'Designed' },
		planned: { label: 'Planned' },
		idea: { label: 'Idea' },
		exploring: { label: 'Exploring' }
	},
	confidence: {
		high: { label: 'High — in active build' },
		medium: { label: 'Medium — planned, order may shift' },
		directional: { label: 'Directional — an idea we like' }
	},
	chapters: [
		{
			id: 'now',
			label: 'Now',
			hint: 'In active build',
			items: [
				{ stage: 'building', title: 'Faster deploys', outcome: 'Ship updates in one click, no waiting on builds.', themes: ['Deploy'], confidence: 'high', updatedAt: '2026-09-03T10:00:00Z', live: true },
				{ stage: 'testing', title: 'Usage overview', outcome: 'See what each tenant uses at a glance.', themes: ['Dashboard'], confidence: 'high', updatedAt: '2026-09-01T10:00:00Z', live: true }
			]
		},
		{
			id: 'next',
			label: 'Next',
			hint: 'Planned, order may shift',
			items: [
				{ stage: 'designed', title: 'Custom domains', outcome: 'Point your own domain at any tenant.', themes: ['Domains'], confidence: 'medium', updatedAt: '2026-08-27T10:00:00Z' },
				{ stage: 'planned', title: 'Team invites', outcome: 'Bring teammates in with roles that make sense.', themes: ['Teams'], confidence: 'medium', updatedAt: '2026-08-24T10:00:00Z' }
			]
		},
		{
			id: 'later',
			label: 'Later',
			hint: 'Directions we like, not committed',
			items: [
				{ stage: 'idea', title: 'Usage limits', outcome: 'Set fair caps per tenant before overages surprise you.', themes: ['Limits'], confidence: 'directional', updatedAt: '2026-08-18T10:00:00Z' },
				{ stage: 'exploring', title: 'Audit log', outcome: 'See who changed what, when.', themes: ['Security'], confidence: 'directional', updatedAt: '2026-08-12T10:00:00Z' }
			]
		}
	],
	theme: {
		fonts: { sans: "'Inter', system-ui, arial, sans-serif", display: "'Inter', system-ui, arial, sans-serif" },
		accent: { hue: 265, colors: { '300': 'oklch(0.78 0.15 265)', '500': 'oklch(0.65 0.22 265)', '700': 'oklch(0.52 0.24 265)' } },
		glow: '0 0 40px rgb(99 102 241 / 0.35)',
		timeline: { orientation: 'vertical', rail: 'calc(var(--spacing) * 22)', liveGlow: true },
		motion: { rise: '0.6s ease-out', fade: '0.4s ease-out', stagger: { perChapter: 120, perItem: 70, max: 480 } }
	},
	footer: {
		description: 'A public roadmap for {site}.',
		links: [{ label: 'All', href: '/' }],
		bottomTemplate: '© {year} {site}.'
	},
	tenant: { domain: 'roadmap.productclient.com' }
};
