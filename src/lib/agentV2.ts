// Agent surface is an MVP: everything agentic (nav, hover panel, Agent page,
// agent Inbox threads) only exists under URLs tagged `?v2`. The normal
// dashboard never shows anything agentic.
export function isAgentV2(url: URL): boolean {
	return url.searchParams.has('v2');
}
