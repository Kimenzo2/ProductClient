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
		productSlug: 'chatgpt',
		user: 'Sarah Chen',
		avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
		stars: 5,
		text: 'ChatGPT 6 feels like a big step forward. I used the camera feature to fix a website layout in seconds, and it is easier to follow how the answer was made.',
		postedAt: '1 day ago',
		verified: true
	},
	{
		id: 'r2',
		productSlug: 'chatgpt',
		user: 'Marcus Webb',
		avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
		stars: 4,
		text: 'Great upgrade. Voice mode feels natural now. I only wish the price was lower for small teams.',
		postedAt: '2 days ago',
		verified: false
	},
	{
		id: 'r3',
		productSlug: 'linear',
		user: 'Julia Park',
		avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
		stars: 5,
		text: 'The new product updates are much easier to write and read. Keyboard shortcuts save me about 30 minutes a day.',
		postedAt: '3 days ago',
		verified: true
	},
	{
		id: 'r4',
		productSlug: 'figma',
		user: 'Dev Patel',
		avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Figma Sites changed how we make landing pages. We can go from design to a live page in two clicks. Our marketing team loves it.',
		postedAt: '1 day ago',
		verified: true
	},
	{
		id: 'r5',
		productSlug: 'cursor',
		user: 'Alex Rivera',
		avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
		stars: 4,
		text: 'My work stays saved while I edit, which is a big help. The update fixes several problems, but suggestions still need work in large projects.',
		postedAt: '6 hours ago',
		verified: false
	},
	{
		id: 'r6',
		productSlug: 'supabase',
		user: 'Priya Sharma',
		avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
		stars: 5,
		text: 'File uploads can continue after a break, which is exactly what we needed. Search is also much faster for our team.',
		postedAt: '5 days ago',
		verified: true
	},
	{
		id: 'r7',
		productSlug: 'vercel',
		user: 'Tom Fischer',
		avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
		stars: 3,
		text: 'The product works well most of the time, but we had three service interruptions this quarter. We need it to be more reliable.',
		postedAt: '1 week ago',
		verified: true
	},
	{
		id: 'r8',
		productSlug: 'claude',
		user: 'Nina Volkov',
		avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Claude remembers more of our conversation and follows instructions more reliably. We spend less time repeating ourselves.',
		postedAt: '8 hours ago',
		verified: true
	},
	{
		id: 'r9',
		productSlug: 'stripe',
		user: 'Jake Morrison',
		avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
		stars: 4,
		text: 'The delayed messages were frustrating, but the team explained what happened clearly. The help pages are also easy to follow.',
		postedAt: '2 days ago',
		verified: true
	},
	{
		id: 'r10',
		productSlug: 'raycast',
		user: 'Emily Zhang',
		avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
		stars: 5,
		text: 'Clipboard history is now safer, and the app feels faster too.',
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
		slug: 'arc-browser',
		name: 'Arc Browser 2.0',
		avatar: 'https://cdn.reicon.dev/logos/arc-browser/original.svg',
		tagline: 'The internet computer. Rebuilt from scratch.',
		category: 'Developer Tools',
		launchDate: '2026-09-15',
		waitlistCount: 12400,
		makerHandle: 'browsercompany',
		makerName: 'The Browser Company'
	},
	{
		slug: 'rivet-ai',
		name: 'Rivet AI',
		avatar: 'https://cdn.reicon.dev/logos/perplexity/original.svg',
		tagline: 'AI agents you can see, edit, and ship.',
		category: 'AI & Machine Learning',
		launchDate: '2026-09-22',
		waitlistCount: 8900,
		makerHandle: 'rivet',
		makerName: 'Rivet'
	},
	{
		slug: 'luma-tabs',
		name: 'Luma Tabs',
		avatar: 'https://cdn.reicon.dev/logos/figma/original.svg',
		tagline: 'Memory for your browser. Never lose context again.',
		category: 'Productivity',
		launchDate: '2026-10-01',
		waitlistCount: 5600,
		makerHandle: 'luma',
		makerName: 'Luma'
	}
];

export const makers: MakerProfile[] = [
	{
		handle: 'openai',
		name: 'OpenAI',
		avatar: 'https://cdn.reicon.dev/logos/openai/original.svg',
		banner: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&h=400&fit=crop',
		bio: 'Building safe AGI that benefits all of humanity. Creators of ChatGPT, DALL·E, and GPT-4.',
		verified: true,
		website: 'https://openai.com',
		twitter: '@OpenAI',
		github: 'openai',
		followers: 284000,
		following: 12,
		products: 6,
		totalReads: '2.4M',
		joinedAt: 'Jan 2023',
		streak: 45
	},
	{
		handle: 'linear',
		name: 'Linear',
		avatar: 'https://cdn.reicon.dev/logos/linear/original.svg',
		banner: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1920&h=400&fit=crop',
		bio: 'Streamline issues, sprints, and product roadmaps with Linear. Built for speed.',
		verified: true,
		website: 'https://linear.app',
		twitter: '@linear',
		github: 'linearapp',
		followers: 98500,
		following: 34,
		products: 3,
		totalReads: '89K',
		joinedAt: 'Mar 2024',
		streak: 120
	},
	{
		handle: 'vercel',
		name: 'Vercel',
		avatar: 'https://cdn.reicon.dev/logos/vercel/original.svg',
		banner: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&h=400&fit=crop',
		bio: 'Develop. Preview. Ship. Creators of Next.js, the platform for web developers.',
		verified: true,
		website: 'https://vercel.com',
		twitter: '@vercel',
		github: 'vercel',
		followers: 156000,
		following: 8,
		products: 4,
		totalReads: '14K',
		joinedAt: 'Feb 2023',
		streak: 200
	},
	{
		handle: 'aravind',
		name: 'Aravind Srinivas',
		avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
		banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&h=400&fit=crop',
		bio: 'CEO @ Perplexity. Building the answer engine. Ex-Google, ex-OpenAI.',
		verified: true,
		website: 'https://perplexity.ai',
		twitter: '@raborecipe',
		followers: 67200,
		following: 89,
		products: 2,
		totalReads: '112K',
		joinedAt: 'Jun 2024',
		streak: 30
	},
	{
		handle: 'cursor',
		name: 'Cursor',
		avatar: 'https://cdn.reicon.dev/logos/cursor/original.svg',
		banner: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&h=400&fit=crop',
		bio: 'The AI-first code editor. Build software faster with AI pair programming.',
		verified: true,
		website: 'https://cursor.sh',
		twitter: '@cursor_ai',
		github: 'cursor-ai',
		followers: 134000,
		following: 5,
		products: 2,
		totalReads: '46K',
		joinedAt: 'Sep 2024',
		streak: 88
	},
	{
		handle: 'figma',
		name: 'Figma',
		avatar: 'https://cdn.reicon.dev/logos/figma/original.svg',
		banner: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920&h=400&fit=crop',
		bio: 'Where teams design together. The collaborative interface design tool.',
		verified: true,
		website: 'https://figma.com',
		twitter: '@figma',
		github: 'figma',
		followers: 210000,
		following: 15,
		products: 5,
		totalReads: '310K',
		joinedAt: 'Jan 2023',
		streak: 156
	},
	{
		handle: 'notion',
		name: 'Notion',
		avatar: 'https://cdn.reicon.dev/logos/notion/original.svg',
		banner: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=1920&h=400&fit=crop',
		bio: 'The connected workspace for your wiki, docs, and projects.',
		verified: false,
		website: 'https://notion.so',
		twitter: '@NotionHQ',
		followers: 178000,
		following: 22,
		products: 4,
		totalReads: '72K',
		joinedAt: 'May 2023',
		streak: 67
	},
	{
		handle: 'stripe',
		name: 'Stripe',
		avatar: 'https://cdn.reicon.dev/logos/stripe/original.svg',
		banner: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=400&fit=crop',
		bio: 'Financial infrastructure for the internet. Millions of businesses use Stripe.',
		verified: true,
		website: 'https://stripe.com',
		twitter: '@stripe',
		github: 'stripe',
		followers: 245000,
		following: 3,
		products: 8,
		totalReads: '29K',
		joinedAt: 'Jan 2023',
		streak: 310
	},
	{
		handle: 'lorenze',
		name: 'Lorenze',
		avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
		banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=400&fit=crop',
		bio: 'Indie maker building Bento, a simple home for your work.',
		verified: false,
		website: 'https://bento.dev',
		twitter: '@lorenze',
		followers: 3200,
		following: 210,
		products: 1,
		totalReads: '18K',
		joinedAt: 'Aug 2025',
		streak: 14
	},
	{
		handle: 'supabase',
		name: 'Supabase',
		avatar: 'https://cdn.reicon.dev/logos/supabase/original.svg',
		banner: 'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=1920&h=400&fit=crop',
		bio: 'The open source Firebase alternative. Auth, database, storage, and edge functions.',
		verified: true,
		website: 'https://supabase.com',
		twitter: '@supabase',
		github: 'supabase',
		followers: 89400,
		following: 42,
		products: 3,
		totalReads: '203K',
		joinedAt: 'Mar 2023',
		streak: 95
	},
	{
		handle: 'raycast',
		name: 'Raycast',
		avatar: 'https://cdn.reicon.dev/logos/raycast/original.svg',
		banner: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&h=400&fit=crop',
		bio: 'Supercharged productivity. Control your tools with a few keystrokes.',
		verified: true,
		website: 'https://raycast.com',
		twitter: '@raydotcast',
		github: 'raycast',
		followers: 56700,
		following: 18,
		products: 2,
		totalReads: '33K',
		joinedAt: 'Nov 2024',
		streak: 42
	},
	{
		handle: 'anthropic',
		name: 'Anthropic',
		avatar: 'https://cdn.reicon.dev/logos/anthropic/original.svg',
		banner: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=1920&h=400&fit=crop',
		bio: 'AI safety company. Creators of Claude. Building reliable, interpretable, steerable AI.',
		verified: true,
		website: 'https://anthropic.com',
		twitter: '@AnthropicAI',
		github: 'anthropics',
		followers: 198000,
		following: 6,
		products: 3,
		totalReads: '540K',
		joinedAt: 'Feb 2023',
		streak: 180
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

export const mockStates: MockState[] = [
	{
		id: '1',
		title: 'ChatGPT 6: New vision, voice, and reasoning',
		type: 'launch',
		product: {
			name: 'ChatGPT',
			slug: 'chatgpt',
			avatar: 'https://cdn.reicon.dev/logos/openai/original.svg',
			verified: true,
			category: 'AI tools',
			tags: ['AI', 'Writing help', 'Productivity'],
			tagline: 'A helpful assistant for writing, seeing, and talking.',
			website: 'https://chat.openai.com'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1676299081847-824916de030a?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1684163761885-882b252b75dd?w=800&h=450&fit=crop'
		],
		maker: { name: 'OpenAI', handle: 'openai', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&h=360&fit=crop',
		readTime: '12 min',
		reads: '2.4M',
		postedAt: '2 days ago',
		description: 'ChatGPT 6 adds live camera, voice, and better answers. Here is what changed.'
	},
	{
		id: '2',
		title: 'Linear: Faster product updates',
		type: 'changelog',
		product: {
			name: 'Linear',
			slug: 'linear',
			avatar: 'https://cdn.reicon.dev/logos/linear/original.svg',
			verified: true,
			category: 'Planning tools',
			tags: ['Planning', 'Teams', 'Productivity'],
			tagline: 'Plan, build, and ship great software. The issue tracker that keeps up.',
			website: 'https://linear.app'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=450&fit=crop'
		],
		maker: { name: 'Linear', handle: 'linear', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=640&h=360&fit=crop',
		readTime: '4 min',
		reads: '89K',
		postedAt: '1 week ago',
		description: 'Product updates are faster to write, sync, and read.'
	},
	{
		id: '3',
		title: 'Vercel: Service problem resolved',
		type: 'incident',
		product: {
			name: 'Vercel',
			slug: 'vercel',
			avatar: 'https://cdn.reicon.dev/logos/vercel/original.svg',
			verified: true,
			category: 'Cloud services',
			tags: ['Hosting', 'Websites', 'Developer tools'],
			tagline: 'Develop. Preview. Ship. The platform for frontend developers.',
			website: 'https://vercel.com'
		},
		maker: { name: 'Vercel', handle: 'vercel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop',
		readTime: '2 min',
		reads: '14K',
		postedAt: '5 hours ago',
		description: 'Some requests were slow in one region. The team fixed the problem.'
	},
	{
		id: '4',
		title: 'Perplexity Comet: Hackathon demos',
		type: 'event',
		product: {
			name: 'Perplexity',
			slug: 'perplexity',
			avatar: 'https://cdn.reicon.dev/logos/perplexity/original.svg',
			verified: true,
			category: 'AI tools',
			tags: ['AI', 'Search', 'Hackathon'],
			tagline: 'The answer engine. Ask anything, get cited answers.',
			website: 'https://perplexity.ai'
		},
		maker: { name: 'Aravind Srinivas', handle: 'aravind', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=640&h=360&fit=crop',
		readTime: '28 min',
		reads: '112K',
		postedAt: '3 days ago',
		description: 'Five winning teams show what they built with Comet.'
	},
	{
		id: '5',
		title: 'Cursor 0.42: Fixes for editing and terminal',
		type: 'fix',
		product: {
			name: 'Cursor',
			slug: 'cursor',
			avatar: 'https://cdn.reicon.dev/logos/cursor/original.svg',
			verified: true,
			category: 'Developer tools',
			tags: ['Code editor', 'AI', 'Developer tools'],
			tagline: 'A code editor with built-in help from AI.',
			website: 'https://cursor.sh'
		},
		maker: { name: 'Cursor', handle: 'cursor', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
		readTime: '4 min',
		reads: '46K',
		postedAt: '6 hours ago',
		description: 'This update keeps your work saved and fixes a terminal problem.'
	},
	{
		id: '6',
		title: 'Figma Sites: Turn a design into a live site',
		type: 'launch',
		product: {
			name: 'Figma',
			slug: 'figma',
			avatar: 'https://cdn.reicon.dev/logos/figma/original.svg',
			verified: true,
			category: 'Design & Creative',
			tags: ['Design', 'No-Code', 'Web Builder'],
			tagline: 'Where teams design together. The collaborative interface design tool.',
			website: 'https://figma.com'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1545235617-7a424c1a7f14?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&h=450&fit=crop'
		],
		maker: { name: 'Figma', handle: 'figma', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&h=360&fit=crop',
		readTime: '8 min',
		reads: '310K',
		postedAt: '1 day ago',
		description: 'Create and publish a website without leaving Figma.'
	},
	{
		id: '7',
		title: 'Notion Mail: Faster search and offline mode',
		type: 'changelog',
		product: {
			name: 'Notion',
			slug: 'notion',
			avatar: 'https://cdn.reicon.dev/logos/notion/original.svg',
			verified: false,
			category: 'Productivity',
			tags: ['Productivity', 'Note-taking', 'Workspace'],
			tagline: 'The connected workspace for your wiki, docs, and projects.',
			website: 'https://notion.so'
		},
		maker: { name: 'Notion', handle: 'notion', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=640&h=360&fit=crop',
		readTime: '6 min',
		reads: '72K',
		postedAt: '4 days ago',
		description: 'Search is faster, and you can read mail without internet.'
	},
	{
		id: '8',
		title: 'Stripe: Webhook delays resolved',
		type: 'incident',
		product: {
			name: 'Stripe',
			slug: 'stripe',
			avatar: 'https://cdn.reicon.dev/logos/stripe/original.svg',
			verified: true,
			category: 'Finance & Payments',
			tags: ['Payments', 'API', 'Fintech'],
			tagline: 'Financial infrastructure for the internet. Accept payments globally.',
			website: 'https://stripe.com'
		},
		maker: { name: 'Stripe', handle: 'stripe', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=640&h=360&fit=crop',
		readTime: '6 min',
		reads: '29K',
		postedAt: '9 hours ago',
		description: 'Some messages arrived late. The team found and fixed the cause.'
	},
	{
		id: '9',
		title: 'Bento 0.3: A simpler home for your work',
		type: 'launch',
		product: {
			name: 'Bento',
			slug: 'bento',
			avatar: 'https://cdn.reicon.dev/logos/bento/original.svg',
			verified: false,
			category: 'AI & Machine Learning',
			tags: ['AI', 'Personal Assistant', 'Productivity'],
			tagline: 'Personal intelligence hub. Not just a launcher.',
			website: 'https://bento.dev'
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&h=360&fit=crop',
		readTime: '10 min',
		reads: '18K',
		postedAt: '12 hours ago',
		description: 'Bento brings your work together in one place.'
	},
	{
		id: '10',
		title: 'Supabase launch: Better file uploads and search',
		type: 'launch',
		product: {
			name: 'Supabase',
			slug: 'supabase',
			avatar: 'https://cdn.reicon.dev/logos/supabase/original.svg',
			verified: true,
			category: 'Cloud services',
			tags: ['Database', 'File storage', 'Open source'],
			tagline: 'The open source Firebase alternative. Auth, database, storage, edge functions.',
			website: 'https://supabase.com'
		},
		screenshots: [
			'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=800&h=450&fit=crop',
			'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop'
		],
		maker: { name: 'Supabase', handle: 'supabase', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=640&h=360&fit=crop',
		readTime: '9 min',
		reads: '203K',
		postedAt: '6 days ago',
		description: 'File uploads can resume after a break. Search is also improved.'
	},
	{
		id: '11',
		title: 'Raycast: Safer clipboard history',
		type: 'fix',
		product: {
			name: 'Raycast',
			slug: 'raycast',
			avatar: 'https://cdn.reicon.dev/logos/raycast/original.svg',
			verified: true,
			category: 'Developer tools',
			tags: ['Launcher', 'Productivity', 'macOS'],
			tagline: 'Supercharged productivity. Control your tools with a few keystrokes.',
			website: 'https://raycast.com'
		},
		maker: { name: 'Raycast', handle: 'raycast', avatar: 'https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
		readTime: '3 min',
		reads: '33K',
		postedAt: '1 day ago',
		description: 'Clipboard history is now encrypted, and performance is better.'
	},
	{
		id: '12',
		title: 'Claude 4.1: Better memory and tools',
		type: 'changelog',
		product: {
			name: 'Claude',
			slug: 'claude',
			avatar: 'https://cdn.reicon.dev/logos/claude/original.svg',
			verified: true,
			category: 'AI tools',
			tags: ['AI', 'Writing help', 'API'],
			tagline: 'Reliable, interpretable, steerable AI. Built by Anthropic.',
			website: 'https://claude.ai'
		},
		maker: { name: 'Anthropic', handle: 'anthropic', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=640&h=360&fit=crop',
		readTime: '15 min',
		reads: '540K',
		postedAt: '8 hours ago',
		description: 'Claude follows tools more reliably and makes fewer incorrect claims.'
	}
];
