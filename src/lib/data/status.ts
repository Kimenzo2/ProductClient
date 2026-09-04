import { incidents as workspaceIncidents, productBySlug, type IncidentRecord } from '$lib/data/workspace';

export type ServiceStatus = 'Operational' | 'Degraded' | 'Outage' | 'Maintenance';
export type UptimeBarStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';
export type PublicIncidentStatus = 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';

export type UptimeBar = {
	date: string;
	status: UptimeBarStatus;
	detail: string;
};

export type StatusComponent = {
	id: string;
	name: string;
	description: string;
	status: ServiceStatus;
	uptime: string;
	barHistory: UptimeBar[];
};

export type StatusIncidentUpdate = {
	id: string;
	status: PublicIncidentStatus;
	timestamp: string;
	message: string;
};

export type StatusIncident = IncidentRecord & {
	affectedComponentIds: string[];
	updates: StatusIncidentUpdate[];
};

export type MaintenanceWindow = {
	id: string;
	title: string;
	description: string;
	status: 'Scheduled' | 'In progress' | 'Complete';
	date: string;
	startsAt: string;
	endsAt: string;
	componentIds: string[];
};

export type StatusPageConfig = {
	productSlug: string;
	pageTitle: string;
	pageDescription: string;
	components: StatusComponent[];
	incidents: StatusIncident[];
	maintenanceWindows: MaintenanceWindow[];
};

const HISTORY_DAYS = 90;
const HISTORY_START = Date.UTC(2026, 5, 7);

function formatHistoryDate(index: number): string {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(new Date(HISTORY_START + index * 86_400_000));
}

function formatCalendarDate(date: Date): string {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(date);
}

function history(
	overrides: Record<number, UptimeBarStatus> = {},
	details: Record<number, string> = {}
): UptimeBar[] {
	return Array.from({ length: HISTORY_DAYS }, (_, index) => {
		const status = overrides[index] ?? 'operational';
		const detail = details[index] ?? (status === 'operational' ? 'No reported interruption' : 'Service health changed');
		return { date: formatHistoryDate(index), status, detail };
	});
}

function sourceIncident(id: string): IncidentRecord {
	const incident = workspaceIncidents.find((record) => record.id === id);
	if (!incident) throw new Error(`Status incident ${id} is missing from the workspace incident data.`);
	return incident;
}

function incidentWithUpdates(
	id: string,
	affectedComponentIds: string[],
	updates: StatusIncidentUpdate[]
): StatusIncident {
	return { ...sourceIncident(id), affectedComponentIds, updates };
}

const vercelSignInHistory = history(
	{ 89: 'outage' },
	{ 89: 'The sign-in service is unavailable' }
);

const vercelDashboardHistory = history(
	{ 63: 'degraded' },
	{ 63: 'A short increase in workspace loading time' }
);

const vercelRequestHistory = history(
	{ 63: 'degraded' },
	{ 63: 'A short increase in request latency' }
);

const vercelIncidents: StatusIncident[] = [
	incidentWithUpdates('inc-3', ['sign-in'], [
		{
			id: 'inc-3-update-1',
			status: 'Investigating',
			timestamp: 'Sep 2, 2026 at 1:58 PM GMT+3',
			message: 'We are investigating reports that some customers are being returned to the sign-in page.'
		},
		{
			id: 'inc-3-update-2',
			status: 'Identified',
			timestamp: 'Sep 2, 2026 at 2:07 PM GMT+3',
			message: 'The team identified an authentication issue and is applying a mitigation. Sign-in may continue to fail for some customers.'
		}
	]),
	incidentWithUpdates('inc-1', ['api-requests'], [
		{
			id: 'inc-1-update-1',
			status: 'Investigating',
			timestamp: 'Sep 1, 2026 at 8:14 AM GMT+3',
			message: 'We saw elevated request latency in one region and started investigating.'
		},
		{
			id: 'inc-1-update-2',
			status: 'Monitoring',
			timestamp: 'Sep 1, 2026 at 9:21 AM GMT+3',
			message: 'Latency has returned to normal. We are monitoring the service while we review the cause.'
		},
		{
			id: 'inc-1-update-3',
			status: 'Resolved',
			timestamp: 'Sep 1, 2026 at 10:02 AM GMT+3',
			message: 'The issue is resolved. Requests are responding normally again.'
		}
	])
];

const stripeIncidents: StatusIncident[] = [
	incidentWithUpdates('inc-2', ['message-delivery'], [
		{
			id: 'inc-2-update-1',
			status: 'Investigating',
			timestamp: 'Sep 2, 2026 at 7:32 AM GMT+3',
			message: 'We are investigating a backlog that delayed some message updates.'
		},
		{
			id: 'inc-2-update-2',
			status: 'Monitoring',
			timestamp: 'Sep 2, 2026 at 8:16 AM GMT+3',
			message: 'The backlog is clearing and message delivery is returning to normal. We are continuing to monitor it.'
		}
	])
];

export const statusPages: StatusPageConfig[] = [
	{
		productSlug: 'vercel',
		pageTitle: 'Vercel status',
		pageDescription: 'See what is working, what is being fixed, and what happened before.',
		components: [
			{ id: 'sign-in', name: 'Sign in', description: 'Authentication and account access.', status: 'Outage', uptime: '99.00%', barHistory: vercelSignInHistory },
			{ id: 'dashboard', name: 'Dashboard', description: 'Workspace loading and saved changes.', status: 'Operational', uptime: '100.00%', barHistory: vercelDashboardHistory },
			{ id: 'api-requests', name: 'API requests', description: 'API v1 and API v2 request handling.', status: 'Operational', uptime: '99.99%', barHistory: vercelRequestHistory },
			{ id: 'file-uploads', name: 'File uploads', description: 'Uploads and file processing.', status: 'Operational', uptime: '100.00%', barHistory: history() }
		],
		incidents: vercelIncidents,
		maintenanceWindows: [
			{
				id: 'maintenance-vercel-1',
				title: 'Authentication infrastructure maintenance',
				description: 'Planned work on authentication infrastructure. Sign in may be briefly unavailable.',
				status: 'Scheduled',
				date: '2026-09-14',
				startsAt: 'Sep 14, 2026 at 2:00 AM GMT+3',
				endsAt: 'Sep 14, 2026 at 2:30 AM GMT+3',
				componentIds: ['sign-in']
			}
		]
	},
	{
		productSlug: 'stripe',
		pageTitle: 'Stripe status',
		pageDescription: 'See what is working, what is being fixed, and what happened before.',
		components: [
			{ id: 'message-delivery', name: 'Message delivery', description: 'Updates and notifications sent to your team.', status: 'Degraded', uptime: '99.70%', barHistory: history({ 87: 'degraded', 88: 'degraded' }, { 87: 'Message delivery is slower than usual', 88: 'Message delivery is slower than usual' }) },
			{ id: 'payments', name: 'Payments', description: 'Payment processing and account activity.', status: 'Operational', uptime: '100.00%', barHistory: history() },
			{ id: 'dashboard', name: 'Dashboard', description: 'Workspace loading and saved changes.', status: 'Operational', uptime: '100.00%', barHistory: history() }
		],
		incidents: stripeIncidents,
		maintenanceWindows: []
	}
];

function defaultStatusPage(slug: string): StatusPageConfig {
	const product = productBySlug(slug);
	return {
		productSlug: slug,
		pageTitle: `${product?.name ?? slug} status`,
		pageDescription: 'See what is working, what is being fixed, and what happened before.',
		components: [
			{ id: 'product', name: product?.name ?? 'Product', description: 'Core product services.', status: 'Operational', uptime: '100.00%', barHistory: history() }
		],
		incidents: [],
		maintenanceWindows: []
	};
}

export function statusPageForProduct(slug: string): StatusPageConfig {
	return statusPages.find((page) => page.productSlug === slug) ?? defaultStatusPage(slug);
}

export function statusIncidentForId(slug: string, id: string): StatusIncident | undefined {
	return statusPageForProduct(slug).incidents.find((incident) => incident.id === id);
}

export function overallStatus(components: StatusComponent[]): ServiceStatus {
	if (components.some((component) => component.status === 'Outage')) return 'Outage';
	if (components.some((component) => component.status === 'Degraded')) return 'Degraded';
	if (components.some((component) => component.status === 'Maintenance')) return 'Maintenance';
	return 'Operational';
}

export function maintenanceCalendarDays(year = 2026, scheduledDates: string[] = []) {
	const firstDay = new Date(Date.UTC(year, 0, 1));
	const gridStart = new Date(firstDay);
	gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
	const scheduled = new Set(scheduledDates);
	const cells = Array.from({ length: 53 * 7 }, (_, index) => {
		const date = new Date(gridStart);
		date.setUTCDate(gridStart.getUTCDate() + index);
		const dateKey = date.toISOString().slice(0, 10);
		return {
			date: dateKey,
			label: formatCalendarDate(date),
			inYear: date.getUTCFullYear() === year,
			scheduled: scheduled.has(dateKey)
		};
	});
	const months = Array.from({ length: 12 }, (_, month) => {
		const date = new Date(Date.UTC(year, month, 1));
		const offset = Math.floor((date.getTime() - gridStart.getTime()) / 86_400_000 / 7);
		return { label: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date), column: offset + 1 };
	});
	return { cells, months };
}
