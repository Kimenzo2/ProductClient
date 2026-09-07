import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { validateRoadmapDoc } from '$lib/data/roadmapEditor';
import type { RequestHandler } from './$types';

// Platform publish seam. The editor POSTs the validated document here; once the
// provision pipeline is wired, this hands it to the tenant deploy service with
// platform-held credentials. Browser clients never see tokens or repos.
export const POST: RequestHandler = async ({ request, fetch }) => {
	let doc: unknown;
	try {
		doc = (await request.json())?.doc;
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}

	const issues = validateRoadmapDoc(doc);
	if (issues.length > 0) return json({ ok: false, code: 'INVALID', issues }, { status: 422 });

	const target = env.ROADMAP_PUBLISH_URL;
	const key = env.ROADMAP_PUBLISH_KEY;
	if (!target || !key) return json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 503 });

	const upstream = await fetch(target, {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
		body: JSON.stringify({ doc })
	}).catch(() => null);
	if (!upstream || !upstream.ok) return json({ ok: false, code: 'UPSTREAM_FAILED' }, { status: 502 });

	return json({ ok: true });
};
