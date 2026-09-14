import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabaseAdmin';
import { createIssue, commentOnIssue, getGithubIssue } from '$lib/server/githubApp';
import { getOwnedProductGithubLink, parseGithubReference, recordGithubAudit } from '$lib/server/githubCanonical';
import type { RequestHandler } from './$types';

async function getUserId(request: Request, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
	if (!token) return null;
	const { data } = await admin.auth.getUser(token);
	return data.user?.id ?? null;
}

async function feedbackContext(admin: ReturnType<typeof createAdminClient>, feedbackId: string, userId: string) {
	const { data } = await admin.from('feedback_items').select('id, product_id, title, body, kind, source_url, products(id, name, slug, maker_id)').eq('id', feedbackId).maybeSingle();
	const product = Array.isArray(data?.products) ? data.products[0] : data?.products;
	if (!data || !product || product.maker_id !== userId) return null;
	return { feedback: data, product };
}

export const POST: RequestHandler = async ({ request, url }) => {
	const admin = createAdminClient();
	const userId = await getUserId(request, admin);
	if (!userId) return json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
	let body: { feedback_id?: string; action?: 'create' | 'link'; reference?: string };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
	}
	const feedbackId = body.feedback_id?.trim();
	if (!feedbackId) return json({ ok: false, code: 'MISSING_FEEDBACK_ID' }, { status: 400 });
	const context = await feedbackContext(admin, feedbackId, userId);
	if (!context) return json({ ok: false, code: 'FEEDBACK_NOT_FOUND_OR_NOT_OWNER' }, { status: 404 });
	const owned = await getOwnedProductGithubLink(admin, context.product.id, userId, 'source');
	if (!owned?.link) return json({ ok: false, code: 'GITHUB_NOT_LINKED', message: 'Connect GitHub in Git settings before linking an issue.' }, { status: 409 });

	try {
		let reference = body.reference?.trim() ?? '';
		if (body.action === 'create') {
			const issue = await createIssue(
				owned.link.installation_id,
				owned.link.repo_full_name,
				context.feedback.title?.trim() || `${context.feedback.kind} from ProductClient`,
				`${context.feedback.body}\n\n— Reported through ProductClient\nProduct: ${context.product.name}\nProductClient: ${url.origin}/workspace/feedback/${feedbackId}`
			);
			reference = issue.html_url;
		}
		const parsed = parseGithubReference(reference);
		if (!parsed) return json({ ok: false, code: 'INVALID_GITHUB_REFERENCE', message: 'Use a GitHub issue URL or owner/repository#number.' }, { status: 422 });
		if (parsed.kind !== 'issue' || parsed.repo !== owned.link.repo_full_name) return json({ ok: false, code: 'WRONG_GITHUB_REPOSITORY', message: 'The issue must belong to this product source repository.' }, { status: 422 });
		const issue = await getGithubIssue(owned.link.installation_id, parsed.repo, parsed.number);
		const nextStatus = issue.state === 'closed' ? 'shipped' : undefined;
		const update: Record<string, unknown> = { github_issue_url: parsed.url, github_issue_number: parsed.number, github_repo_full_name: parsed.repo };
		if (nextStatus) update.status = nextStatus;
		const { error } = await admin.from('feedback_items').update(update).eq('id', feedbackId);
		if (error) return json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
		if (body.action === 'create') await commentOnIssue(owned.link.installation_id, parsed.repo, parsed.number, `ProductClient feedback: ${url.origin}/workspace/feedback/${feedbackId}`);
		await recordGithubAudit(admin, context.product.id, body.action === 'create' ? 'feedback.issue_created' : 'feedback.issue_linked', { feedbackId, issueUrl: parsed.url, issueNumber: parsed.number }, userId, parsed.repo);
		return json({ ok: true, issue: { url: parsed.url, number: parsed.number, repo: parsed.repo, state: issue.state, title: issue.title } });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await recordGithubAudit(admin, context.product.id, 'feedback.issue_failed', { feedbackId, message }, userId, owned.link.repo_full_name);
		return json({ ok: false, code: 'GITHUB_ERROR', message }, { status: 502 });
	}
};
