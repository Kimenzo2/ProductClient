export type StateType = 'launch' | 'changelog' | 'incident' | 'fix' | 'event';

export type MockState = {
	id: string;
	title: string;
	type: StateType;
	product: { name: string; slug: string; avatar: string; verified: boolean };
	maker: { name: string; handle: string; avatar: string };
	thumbnail: string;
	videoUrl?: string;
	duration: string;
	views: string;
	postedAt: string;
	description: string;
};

export const stateTypes: { value: StateType | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'launch', label: 'Launches' },
	{ value: 'changelog', label: 'Changelogs' },
	{ value: 'incident', label: 'Incidents' },
	{ value: 'fix', label: 'Bug Fixes' },
	{ value: 'event', label: 'Events' }
];

export const mockStates: MockState[] = [
	{
		id: '1',
		title: 'ChatGPT 6 – The most human launch yet. Full breakdown + live demo',
		type: 'launch',
		product: {
			name: 'ChatGPT',
			slug: 'chatgpt',
			avatar: 'https://images.unsplash.com/photo-1674027326570-02f0a1ea0a1a?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'OpenAI', handle: 'openai', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&h=360&fit=crop',
		duration: '12:34',
		views: '2.4M',
		postedAt: '2 days ago',
		description: 'We are launching ChatGPT 6 with realtime vision, voice and reasoning. Watch the full keynote...'
	},
	{
		id: '2',
		title: 'Linear – How we shipped 40% faster changelogs in Q1',
		type: 'changelog',
		product: {
			name: 'Linear',
			slug: 'linear',
			avatar: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Linear', handle: 'linear', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=640&h=360&fit=crop',
		duration: '04:12',
		views: '89K',
		postedAt: '1 week ago',
		description: 'New changelog engine, instant sync and keyboard-first workflow.'
	},
	{
		id: '3',
		title: 'Vercel Incident Report – Edge Network degraded (resolved)',
		type: 'incident',
		product: {
			name: 'Vercel',
			slug: 'vercel',
			avatar: 'https://images.unsplash.com/photo-1633409361618-e64f06001ede?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Vercel', handle: 'vercel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop',
		duration: '02:18',
		views: '14K',
		postedAt: '5 hours ago',
		description: 'At 14:32 UTC edge functions in iad1 experienced elevated latency. Mitigated at 15:10 UTC.'
	},
	{
		id: '4',
		title: 'Perplexity Comet – Hackathon winners demo day',
		type: 'event',
		product: {
			name: 'Perplexity',
			slug: 'perplexity',
			avatar: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Aravind Srinivas', handle: 'aravind', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=640&h=360&fit=crop',
		duration: '28:40',
		views: '112K',
		postedAt: '3 days ago',
		description: 'Top 5 teams from our global hackathon present their Comet agents.'
	},
	{
		id: '5',
		title: 'Cursor 0.42 – Bug fixes: composer, autocomplete, and terminal',
		type: 'fix',
		product: {
			name: 'Cursor',
			slug: 'cursor',
			avatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Cursor', handle: 'cursor', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
		duration: '03:55',
		views: '46K',
		postedAt: '6 hours ago',
		description: 'Patch notes for 0.42 – composers now persistent, terminal timeout fixed.'
	},
	{
		id: '6',
		title: 'Figma Sites – Launch video: From canvas to live site in seconds',
		type: 'launch',
		product: {
			name: 'Figma',
			slug: 'figma',
			avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Figma', handle: 'figma', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&h=360&fit=crop',
		duration: '08:21',
		views: '310K',
		postedAt: '1 day ago',
		description: 'Announcing Figma Sites – design and ship without leaving the canvas.'
	},
	{
		id: '7',
		title: 'Notion Mail – Changelog: Super-fast search and offline mode',
		type: 'changelog',
		product: {
			name: 'Notion',
			slug: 'notion',
			avatar: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop',
			verified: false
		},
		maker: { name: 'Notion', handle: 'notion', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=640&h=360&fit=crop',
		duration: '06:10',
		views: '72K',
		postedAt: '4 days ago',
		description: 'Mail is now 3x faster with new Rust indexer.'
	},
	{
		id: '8',
		title: 'Stripe – Incident: Webhooks delayed for 18 mins (postmortem)',
		type: 'incident',
		product: {
			name: 'Stripe',
			slug: 'stripe',
			avatar: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Stripe', handle: 'stripe', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=640&h=360&fit=crop',
		duration: '05:44',
		views: '29K',
		postedAt: '9 hours ago',
		description: 'Webhooks at 03:11 UTC queued – root cause DNS failover.'
	},
	{
		id: '9',
		title: 'Bento 0.3 – Personal Intelligence hub rethink (Bento launch)',
		type: 'launch',
		product: {
			name: 'Bento',
			slug: 'bento',
			avatar: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop',
			verified: false
		},
		maker: { name: 'Lorenze', handle: 'lorenze', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&h=360&fit=crop',
		duration: '10:02',
		views: '18K',
		postedAt: '12 hours ago',
		description: 'Introducing Bento as cross-app intelligence – not just a launcher.'
	},
	{
		id: '10',
		title: 'Supabase Launch Week – Day 4: Storage v2 + vector updates',
		type: 'launch',
		product: {
			name: 'Supabase',
			slug: 'supabase',
			avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Supabase', handle: 'supabase', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1555066931-bf19f8fd6445?w=640&h=360&fit=crop',
		duration: '09:15',
		views: '203K',
		postedAt: '6 days ago',
		description: 'Storage v2 with TUS resumable uploads and pgvector 0.7.'
	},
	{
		id: '11',
		title: 'Raycast – Fix: Clipboard history leak fixed + perf win',
		type: 'fix',
		product: {
			name: 'Raycast',
			slug: 'raycast',
			avatar: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Raycast', handle: 'raycast', avatar: 'https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
		duration: '02:45',
		views: '33K',
		postedAt: '1 day ago',
		description: 'Clip history now encrypted with secure enclave isolation.'
	},
	{
		id: '12',
		title: 'Claude 4.1 – System prompts, memory, and tool use deep dive',
		type: 'changelog',
		product: {
			name: 'Claude',
			slug: 'claude',
			avatar: 'https://images.unsplash.com/photo-1675557009483-effe9a6c3ff0?w=100&h=100&fit=crop',
			verified: true
		},
		maker: { name: 'Anthropic', handle: 'anthropic', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
		thumbnail: 'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=640&h=360&fit=crop',
		duration: '15:22',
		views: '540K',
		postedAt: '8 hours ago',
		description: 'How we upgraded tool use and reduced hallucinations by 22%.'
	}
];
