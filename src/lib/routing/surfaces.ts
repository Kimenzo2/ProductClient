export type AppSurface = 'public' | 'workspace' | 'auth' | 'landing';

const workspacePrefixes = ['/workspace', '/studio', '/notifications', '/following', '/you'];
const authPrefixes = [
	'/auth',
	'/onboarding',
	'/log-in',
	'/sign-up',
	'/forgot-password',
	'/reset-password',
	'/callback',
	'/confirm'
];

function matchesPath(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isWorkspacePath(pathname: string): boolean {
	return workspacePrefixes.some((prefix) => matchesPath(pathname, prefix));
}

export function isAuthPath(pathname: string): boolean {
	return authPrefixes.some((prefix) => matchesPath(pathname, prefix));
}

export function isLandingPath(pathname: string): boolean {
	return pathname === '/';
}

export function surfaceForPath(pathname: string): AppSurface {
	if (isAuthPath(pathname)) return 'auth';
	if (isWorkspacePath(pathname)) return 'workspace';
	if (isLandingPath(pathname)) return 'landing';
	return 'public';
}

export function isWorkspaceHref(href: string): boolean {
	return isWorkspacePath(href.split(/[?#]/, 1)[0] || '/');
}
