export type StateType = 'launch' | 'changelog' | 'incident' | 'fix' | 'event';

export type MakerProfile = {
	handle: string;
	name: string;
	avatar: string;
	banner?: string;
	bio: string;
	verified: boolean;
	website?: string;
	twitter?: string;
	github?: string;
	followers: number;
	following: number;
	products: number;
	totalReads: string;
	joinedAt: string;
	streak?: number;
};

export type Review = {
	id: string;
	productSlug: string;
	user: string;
	avatar: string;
	stars: number;
	text: string;
	postedAt: string;
	verified?: boolean;
};

export const reviews: Review[] = [
	{
		id: 'r1',
		productSlug: 'bento',
		user: 'Sarah Chen',
		avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Bento 0.4 feels like a big step forward. I used voice commands to fix a workflow in seconds, and it is easier to follow how each answer was made.',
		postedAt: '1 day ago',
		verified: true
	},
	{
		id: 'r2',
		productSlug: 'bento',
		user: 'Marcus Webb',
		avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
		stars: 4,
		text: 'Great upgrade. Voice commands feel natural now. I only wish the price was lower for small teams.',
		postedAt: '2 days ago',
		verified: false
	},
	{
		id: 'r3',
		productSlug: 'driftlog',
		user: 'Julia Park',
		avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
		stars: 5,
		text: 'The new changelogs are much easier to write and read. Keyboard shortcuts save me about 30 minutes a day.',
		postedAt: '3 days ago',
		verified: true
	},
	{
		id: 'r4',
		productSlug: 'quillpost',
		user: 'Dev Patel',
		avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Quillpost changed how we ship docs. We can go from a draft to a live page in two clicks. Our marketing team loves it.',
		postedAt: '1 day ago',
		verified: true
	},
	{
		id: 'r5',
		productSlug: 'inkwell',
		user: 'Alex Rivera',
		avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
		stars: 4,
		text: 'My drafts stay saved while I edit, which is a big help. The update fixes several problems, but suggestions still need work in long documents.',
		postedAt: '6 hours ago',
		verified: false
	},
	{
		id: 'r6',
		productSlug: 'hearth',
		user: 'Priya Sharma',
		avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Feedback imports can continue after a break, which is exactly what we needed. Search is also much faster for our team.',
		postedAt: '5 days ago',
		verified: true
	},
	{
		id: 'r7',
		productSlug: 'mossbit',
		user: 'Tom Fischer',
		avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
		stars: 3,
		text: 'The product works well most of the time, but we had two service interruptions this quarter. We need it to be more reliable.',
		postedAt: '1 week ago',
		verified: true
	},
	{
		id: 'r8',
		productSlug: 'lumen',
		user: 'Nina Volkov',
		avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
		stars: 5,
		text: 'The dashboard remembers our saved views and follows them more reliably. We spend less time rebuilding charts.',
		postedAt: '8 hours ago',
		verified: true
	},
	{
		id: 'r9',
		productSlug: 'papercrane',
		user: 'Jake Morrison',
		avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
		stars: 4,
		text: 'The delayed messages were frustrating, but the team explained what happened clearly. The help pages are also easy to follow.',
		postedAt: '2 days ago',
		verified: true
	},
	{
		id: 'r10',
		productSlug: 'windrose',
		user: 'Emily Zhang',
		avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Launcher history is now safer, and the app feels faster too.',
		postedAt: '1 day ago',
		verified: false
	}
];

export type PreLaunchProduct = {
	slug: string;
	name: string;
	avatar: string;
	tagline: string;
	category: string;
	launchDate: string;
	waitlistCount: number;
	makerHandle: string;
	makerName: string;
};

export const preLaunchProducts: PreLaunchProduct[] = [
	{
		slug: 'papertrail',
		name: 'Papertrail',
		avatar: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop',
		tagline: 'Audit logs you can actually read.',
		category: 'Developer Tools',
		launchDate: '2026-09-15',
		waitlistCount: 12400,
		makerHandle: 'lorenze',
		makerName: 'Lorenze'
	},
	{
		slug: 'nightjar',
		name: 'Nightjar',
		avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
		tagline: 'Cron jobs with a view.',
		category: 'Developer Tools',
		launchDate: '2026-09-22',
		waitlistCount: 8900,
		makerHandle: 'lorenze',
		makerName: 'Lorenze'
	},
	{
		slug: 'coldbrew',
		name: 'Coldbrew',
		avatar: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=100&h=100&fit=crop',
		tagline: 'Background jobs, steeped properly.',
		category: 'Developer Tools',
		launchDate: '2026-10-01',
		waitlistCount: 5600,
		makerHandle: 'lorenze',
		makerName: 'Lorenze'
	}
];

export const makers: MakerProfile[] = [
	{
		handle: 'lorenze',
		name: 'Lorenze',
		avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
		banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=400&fit=crop',
		bio: 'Indie maker. Building Bento, Driftlog, Quillpost, and a shelf of small tools that last.',
		verified: false,
		website: 'https://bento.dev',
		twitter: '@lorenze',
		followers: 3200,
		following: 210,
		products: 12,
		totalReads: '47.9K',
		joinedAt: 'Aug 2025',
		streak: 14
	}
];

export type MockState = {
	id: string;
	title: string;
	type: StateType;
	product: { name: string; slug: string; avatar: string; verified: boolean; category?: string; tags?: string[]; tagline?: string; website?: string };
	maker: { name: string; handle: string; avatar: string };
	thumbnail: string;
	screenshots?: string[];
	readTime: string;
	reads: string;
	postedAt: string;
	description: string;
};

export const stateTypes: { value: StateType | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'launch', label: 'Launches' },
	{ value: 'changelog', label: 'Product updates' },
	{ value: 'incident', label: 'Service problems' },
	{ value: 'fix', label: 'Fixes' },
	{ value: 'event', label: 'Events' }
];

const lorenzeAvatar = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop';

export const mockStates: MockState[] = [
	{
		id: '1',
		title: 'Bento 0.4: New voice commands, quick switching, and better answers',
		type: 'launch',
		product: {
			name: 'Bento',
			slug: 'bento',
			avatar: 'https://cdn.reicon.dev/logos/bento/original.svg',
			verified: false,
			category: 'AI tools',
			tags: ['AI', 'Personal Assistant', 'Productivity'],
			tagline: 'Personal intelligence hub. Not just a launcher.',
			website: 'https://bento.dev'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1684163761885-882b252b75dd?w=800&h=450&fit=crop'
		],
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&h=360&fit=crop',
		readTime: '12 min',
		reads: '9.4K',
		postedAt: '2 days ago',
		description: 'Bento 0.4 adds voice commands, quicker switching, and better answers. Here is what changed.'
	},
	{
		id: '2',
		title: 'Driftlog: Faster changelogs',
		type: 'changelog',
		product: {
			name: 'Driftlog',
			slug: 'driftlog',
			avatar: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop',
			verified: false,
			category: 'Developer tools',
			tags: ['Changelogs', 'Teams', 'Productivity'],
			tagline: 'Changelogs that write themselves from your git history.',
			website: 'https://driftlog.dev'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=450&fit=crop'
		],
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=640&h=360&fit=crop',
		readTime: '4 min',
		reads: '3.1K',
		postedAt: '1 week ago',
		description: 'Changelogs are faster to write, sync, and read.'
	},
	{
		id: '3',
		title: 'Mossbit: Service problem resolved',
		type: 'incident',
		product: {
			name: 'Mossbit',
			slug: 'mossbit',
			avatar: 'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=100&h=100&fit=crop',
			verified: false,
			category: 'Cloud services',
			tags: ['Hosting', 'Websites', 'Developer tools'],
			tagline: 'Deploy small apps without the ceremony.',
			website: 'https://mossbit.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop',
		readTime: '2 min',
		reads: '1.2K',
		postedAt: '5 hours ago',
		description: 'Some requests were slow in one region. The team fixed the problem.'
	},
	{
		id: '4',
		title: 'Windrose meetup: Building small tools that last',
		type: 'event',
		product: {
			name: 'Windrose',
			slug: 'windrose',
			avatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop',
			verified: false,
			category: 'Productivity',
			tags: ['Launcher', 'Productivity', 'Desktop'],
			tagline: 'A launcher that keeps your day on course.',
			website: 'https://windrose.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=640&h=360&fit=crop',
		readTime: '28 min',
		reads: '2.8K',
		postedAt: '3 days ago',
		description: 'Five makers show what they built with Windrose.'
	},
	{
		id: '5',
		title: 'Inkwell 0.9: Fixes for editing and export',
		type: 'fix',
		product: {
			name: 'Inkwell',
			slug: 'inkwell',
			avatar: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=100&fit=crop',
			verified: false,
			category: 'Writing',
			tags: ['Editor', 'Writing', 'Docs'],
			tagline: 'A quiet editor for release notes and docs.',
			website: 'https://inkwell.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
		readTime: '4 min',
		reads: '1.9K',
		postedAt: '6 hours ago',
		description: 'This update keeps your drafts saved and fixes an export problem.'
	},
	{
		id: '6',
		title: 'Quillpost: Turn one draft into docs and a newsletter',
		type: 'launch',
		product: {
			name: 'Quillpost',
			slug: 'quillpost',
			avatar: 'https://images.unsplash.com/photo-1545235617-7a424c1a7f14?w=100&h=100&fit=crop',
			verified: false,
			category: 'Docs & Publishing',
			tags: ['Docs', 'No-Code', 'Web Builder'],
			tagline: 'Docs and newsletters from a single draft.',
			website: 'https://quillpost.dev'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1545235617-7a424c1a7f14?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=450&fit=crop'
		],
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&h=360&fit=crop',
		readTime: '8 min',
		reads: '6.2K',
		postedAt: '1 day ago',
		description: 'Create and publish docs without leaving Quillpost.'
	},
	{
		id: '7',
		title: 'Tetra 1.4: Faster search and offline boards',
		type: 'changelog',
		product: {
			name: 'Tetra',
			slug: 'tetra',
			avatar: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=100&h=100&fit=crop',
			verified: false,
			category: 'Planning tools',
			tags: ['Planning', 'Teams', 'Productivity'],
			tagline: 'The task board that folds time into columns.',
			website: 'https://tetra.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=640&h=360&fit=crop',
		readTime: '6 min',
		reads: '2.4K',
		postedAt: '4 days ago',
		description: 'Search is faster, and you can plan without internet.'
	},
	{
		id: '8',
		title: 'Papercrane: Delivery delays resolved',
		type: 'incident',
		product: {
			name: 'Papercrane',
			slug: 'papercrane',
			avatar: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=100&h=100&fit=crop',
			verified: false,
			category: 'Email',
			tags: ['Email', 'API', 'Deliverability'],
			tagline: 'Transactional email without the mystery.',
			website: 'https://papercrane.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=640&h=360&fit=crop',
		readTime: '6 min',
		reads: '1.5K',
		postedAt: '9 hours ago',
		description: 'Some messages arrived late. The team found and fixed the cause.'
	},
	{
		id: '9',
		title: 'Lumen 1.2: A lighter analytics dashboard',
		type: 'launch',
		product: {
			name: 'Lumen',
			slug: 'lumen',
			avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
			verified: false,
			category: 'Analytics',
			tags: ['Analytics', 'Privacy', 'Dashboards'],
			tagline: 'Privacy-first analytics you can read at a glance.',
			website: 'https://lumen.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&h=360&fit=crop',
		readTime: '10 min',
		reads: '4.7K',
		postedAt: '12 hours ago',
		description: 'Lumen brings your traffic together in one place.'
	},
	{
		id: '10',
		title: 'Hearth launch: Better feedback imports and search',
		type: 'launch',
		product: {
			name: 'Hearth',
			slug: 'hearth',
			avatar: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=100&h=100&fit=crop',
			verified: false,
			category: 'Feedback',
			tags: ['Feedback', 'Inbox', 'Open source'],
			tagline: 'A feedback inbox that turns requests into decisions.',
			website: 'https://hearth.dev'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop'
		],
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=640&h=360&fit=crop',
		readTime: '9 min',
		reads: '7.8K',
		postedAt: '6 days ago',
		description: 'Feedback imports can resume after a break. Search is also improved.'
	},
	{
		id: '11',
		title: 'Kestrel: Safer webhook retries',
		type: 'fix',
		product: {
			name: 'Kestrel',
			slug: 'kestrel',
			avatar: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&h=100&fit=crop',
			verified: false,
			category: 'Developer tools',
			tags: ['Webhooks', 'API', 'Developer tools'],
			tagline: 'One gateway for every webhook you receive.',
			website: 'https://kestrel.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
		readTime: '3 min',
		reads: '1.6K',
		postedAt: '1 day ago',
		description: 'Webhook retries now back off, and performance is better.'
	},
	{
		id: '12',
		title: 'Signalfox 2.2: Better alerts and status history',
		type: 'changelog',
		product: {
			name: 'Signalfox',
			slug: 'signalfox',
			avatar: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop',
			verified: false,
			category: 'Monitoring',
			tags: ['Monitoring', 'Status page', 'Alerts'],
			tagline: 'Uptime monitoring with status pages people trust.',
			website: 'https://signalfox.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: lorenzeAvatar },
		thumbnail: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=640&h=360&fit=crop',
		readTime: '15 min',
		reads: '5.3K',
		postedAt: '8 hours ago',
		description: 'Signalfox alerts fire more reliably and status history is clearer.'
	}
];
