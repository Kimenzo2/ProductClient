import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GitHub is the version-control workbench for starter kits. Hosted releases
 * are created by the surface publisher (`/api/docs/publish`, roadmap publish,
 * or status publish), which mirrors the canonical tenant document to the
 * matching Cloudflare Worker/D1 edge store.
 */
export const POST: RequestHandler = async () => json({
	ok: false,
	code: 'GITHUB_IS_VERSION_CONTROL_ONLY',
	message: 'GitHub is used for starter-kit version control. Use the surface Publish action to publish through Cloudflare.'
}, { status: 410 });
