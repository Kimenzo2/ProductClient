// Agent surface is an MVP: everything agentic (nav, hover panel, Agent page,
// agent Inbox threads) only exists when the visitor has opted in with `?v2`.
// The normal dashboard never shows anything agentic.
//
// The tag must survive navigation: the sidebar links to plain hrefs, so a
// URL-only gate made the Agent item vanish the moment you clicked it (arrive
// at /workspace/agent without ?v2 → gate closed → item filtered out again).
// Opt-in therefore sticks for the tab (sessionStorage). Removing `?v2` from
// any URL while the flag is set KEEPS it — use `?v2=0` to leave V2.

const KEY = 'pc-agent-v2';

function flagStorage(): Storage | null {
	try {
		return typeof window === 'undefined' ? null : window.sessionStorage;
	} catch {
		return null; // storage blocked: URL tag still works every navigation
	}
}

/** True when the current URL carries `?v2` (value other than `0`). */
function urlHasV2(url: URL): boolean {
	const value = url.searchParams.get('v2');
	return url.searchParams.has('v2') && value !== '0';
}

/**
 * Gate for every agentic surface. Reads the URL first — `?v2` opts in and
 * remembers; `?v2=0` opts out and forgets — then falls back to the remembered
 * opt-in so plain links (`/workspace/agent`, `/workspace/inbox`) keep the
 * surface visible for the rest of the tab session.
 */
export function isAgentV2(url: URL): boolean {
	const storage = flagStorage();
	if (urlHasV2(url)) {
		storage?.setItem(KEY, '1');
		return true;
	}
	if (url.searchParams.get('v2') === '0') {
		storage?.removeItem(KEY);
		return false;
	}
	return storage?.getItem(KEY) === '1';
}
