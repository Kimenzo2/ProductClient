/**
 * The public status page is a separate deployment from ProductClient.
 *
 * Keep this as the single integration point until tenant provisioning supplies
 * a per-tenant hostname from the workspace configuration.
 */
export const hostedStatusPage = {
	origin: 'https://status.productclient.com',
	href: 'https://status.productclient.com/'
} as const;

/**
 * The neutral hosted documentation preview is a separate deployment from
 * ProductClient. Tenant-specific hosts can replace this URL once a workspace
 * has a published documentation hostname.
 */
export const hostedDocsPage = {
	origin: 'https://docs.productclient.com',
	href: 'https://docs.productclient.com/'
} as const;

/**
 * Resolve the public documentation URL returned by a workspace record.
 *
 * Mock records use the neutral hosted preview above. A real publishing
 * response can provide either a tenant-specific absolute URL or a path on the
 * hosted documentation origin without requiring changes to the consuming UI.
 */
export function resolveHostedDocsHref(path?: string | null): string {
	if (!path) return hostedDocsPage.href;
	if (/^https?:\/\//i.test(path)) return path;

	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${hostedDocsPage.origin}${normalizedPath}`;
}
