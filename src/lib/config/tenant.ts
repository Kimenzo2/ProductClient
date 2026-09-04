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
