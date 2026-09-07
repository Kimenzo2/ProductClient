export type AppSurface = 'workspace' | 'auth';

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

export function surfaceForPath(pathname: string): AppSurface {
	if (isAuthPath(pathname)) return 'auth';
	return 'workspace';
}
