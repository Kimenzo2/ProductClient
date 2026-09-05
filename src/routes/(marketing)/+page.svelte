<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Rocket,
		Message,
		BookOpen,
		AlertCircle,
		Globe,
		Cpu,
		Code2,
		Shield,
		Chart3,
		Link,
		LockKeyhole,
		Clock,
		ArrowRight,
		Play,
		Home,
		Check,
		CloseCircle,
		Feed,
		ChatDots,
		DocumentText,
		Pulse,
		Mic,
		Send,
		Pen,
		BellRing,
		Bolt,
		Eye,
		Sparkles,
		Users2,
		Verified,
		Plus
	} from 'reicon-svelte';
	import ProductClientLogo from '$lib/components/brand/ProductClientLogo.svelte';
	import { authHref } from '$lib/auth/urls';

	type Area = { icon: typeof Rocket; title: string; desc: string };
	type Capability = { icon: typeof Globe; title: string; desc: string };
	type Feature = {
		id: string;
		icon: typeof Rocket;
		eyebrow: string;
		title: string;
		desc: string;
		points: string[];
		href: string;
		linkLabel: string;
	};
	type PreviewRow = { title: string; meta: string; desc: string; badge: string; bullets?: string[]; stat?: string };

	const areas: Area[] = [
		{
			icon: Rocket,
			title: 'Releases',
			desc: 'Interactive launches on permanent, rank-ready URLs — self-updating distribution that gets seen and keeps ranking as you ship toward AGI.'
		},
		{
			icon: Message,
			title: 'Feedback',
			desc: 'Voted feedback that drives user engagement — every request rises by votes and links to the release that ships it.'
		},
		{
			icon: BookOpen,
			title: 'Docs',
			desc: 'Beautiful documentation, agent-native and self-updating — beautiful defaults that stay current beside your releases, with interactive API playgrounds.'
		},
		{
			icon: AlertCircle,
			title: 'Incidents',
			desc: 'Status pages that keep customers in the loop — live timelines and post-mortems to investigate, respond and prevent, maintaining trust when it matters.'
		}
	];

	const features: Feature[] = [
		{
			id: 'releases',
			icon: Feed,
			eyebrow: 'Releases',
			title: 'Ship the story that gets seen.',
			desc: 'Every release is an interactive, permanent page — what changed, why it matters, who asked for it — with self-updating distribution that ranks on Google and gets cited by AI. Ship often as we pace toward AGI.',
			points: [
				'Permanent URLs that rank long after launch day',
				'Interactive follows, shares and ranking that drive turnover',
				'Structured pages for search and AI citation'
			],
			href: '/launchpad',
			linkLabel: 'Explore launches'
		},
		{
			id: 'feedback',
			icon: ChatDots,
			eyebrow: 'Feedback',
			title: 'Hear users and ship what converts.',
			desc: 'Requests, bugs and praise land on a voted board and rise by engagement. Triage happens in the open, every fix closes publicly and notifies voters — turning user engagement into conversion.',
			points: [
				'Voted board with public statuses, New to Resolved',
				'Every shipped fix links back and notifies voters',
				'Interactive ranking that encourages builders to ship more'
			],
			href: '/feed',
			linkLabel: 'See the feedback loop'
		},
		{
			id: 'docs',
			icon: DocumentText,
			eyebrow: 'Docs',
			title: 'Beautiful docs that stay current with the product.',
			desc: 'Agent-native and self-updating documentation with beautiful defaults and interactive API playgrounds. When the product ships, the doc is right there — accessible and beautiful to build on.',
			points: [
				'Beautiful documentation that stays current beside releases',
				'Linked from the exact release or incident that changed them',
				'Self-updating knowledge that brings back the beauty of building'
			],
			href: '/products',
			linkLabel: 'Browse products'
		},
		{
			id: 'incidents',
			icon: Pulse,
			eyebrow: 'Incidents',
			title: 'Keep customers in the loop when things break.',
			desc: 'Severity, live timeline and resolution — investigate, respond and prevent with post-mortems linked to docs and fixes. Users follow the timeline instead of flooding support.',
			points: [
				'Public timelines, Investigating to Resolved',
				'Post-mortems tied to docs and fixes',
				'Transparent updates that maintain trust and reduce inbound support'
			],
			href: '/feed',
			linkLabel: 'How status works'
		}
	];

	const capabilities: Capability[] = [
		{ icon: Globe, title: 'Rank and get seen', desc: 'Launch and doc pages built to rank on Google — visibility that compounds as you ship toward AGI.' },
		{ icon: Cpu, title: 'Agent-native and self-updating', desc: 'Structured pages for AI answers — agent-native knowledge that keeps your docs accessible and current.' },
		{ icon: Code2, title: 'API access', desc: 'Programmatic access to launches, feedback and docs.' },
		{ icon: Shield, title: 'Enterprise trust', desc: 'SOC 2, SSO, RBAC and audit logs to keep trust high.' },
		{ icon: Chart3, title: 'Analytics', desc: 'Understand how users engage with releases and docs — distribution and conversion in one view.' },
		{ icon: Link, title: 'Webhooks', desc: 'Real-time delivery to Slack, Discord and your stack.' },
		{ icon: LockKeyhole, title: 'SSO & RBAC', desc: 'SAML, OIDC — team permissions that keep building secure as you accelerate toward AGI.' },
		{ icon: Clock, title: '99.99% uptime', desc: 'Infrastructure that stays up when you ship.' }
	];

	const whyCards = [
		{
			icon: Users2,
			title: 'Built for builders racing toward AGI',
			desc: 'An interactive surface that encourages you to ship more — launches and voted feedback bring back the beauty of building.'
		},
		{
			icon: Sparkles,
			title: 'Beautiful docs, reliable status',
			desc: 'Beautiful, self-updating documentation and status pages that keep customers in the loop — so you investigate, respond and prevent faster.'
		},
		{
			icon: Verified,
			title: 'Get seen, stay trusted',
			desc: 'Interactive ranking, public timelines and resolved histories — distribution and visibility without losing trust.'
		}
	];

	const loopSteps = [
		{
			icon: Mic,
			step: '01',
			title: 'Listen',
			desc: 'Users vote what is broken and what is next — openly ranked by engagement.'
		},
		{
			icon: Send,
			step: '02',
			title: 'Ship',
			desc: 'Each release is an interactive, permanent page that gets seen and ranks.'
		},
		{
			icon: Pen,
			step: '03',
			title: 'Document',
			desc: 'Beautiful documentation stays current beside the release — self-updating knowledge, not a stale wiki.'
		},
		{
			icon: BellRing,
			step: '04',
			title: 'Inform',
			desc: 'Status pages keep customers in the loop with live timelines — investigate, respond and prevent.'
		}
	];

	const oldWay = [
		'Launches that spike then vanish',
		'Feedback scattered in threads',
		'Docs drifting from the product they describe',
		'Status updates lost in silence'
	];

	const newWay = [
		'Every release is an interactive page that ranks and gets seen',
		'Every ask is voted, answered and linked to the fix',
		'Beautiful documentation that stays current beside the product',
		'Status pages that keep customers in the loop'
	];

	const audiences = [
		{
			icon: Bolt,
			title: 'For builders racing toward AGI',
			hook: 'Ship more. Get seen.',
			points: [
				'Interactive launches that rank and drive distribution',
				'Voted feedback that turns engagement into what to ship next',
				'Bring back the beauty of building'
			],
			cta: 'Start building free',
			href: 'signup'
		},
		{
			icon: Eye,
			title: 'For people who follow innovation',
			hook: 'Never miss a change that matters.',
			points: [
				'Follow products interactively',
				'Beautiful changelogs, clear and accessible',
				'Live status that keeps you in the loop'
			],
			cta: 'Explore products',
			href: '/feed'
		}
	];

	const previewContent: Record<string, PreviewRow[]> = {
		releases: [
			{ title: 'Acme v2.4 — Dark mode ships', meta: 'Live · 2h ago', desc: 'System-wide dark mode, 40% faster cold start, and 12 fixes straight from user feedback.', badge: 'v2.4', bullets: ['System-wide dark mode, synced across devices', 'Cold start 40% faster on every plan', '12 fixes shipped from voted feedback'], stat: '1.2k reads · 214 follows · 48 shares' },
			{ title: 'Mobile offline mode', meta: 'Beta · Yesterday', desc: 'Keep working without signal. Everything syncs when you reconnect.', badge: 'Beta', stat: '860 reads · 96 follows' }
		],
		feedback: [
			{ title: 'Add a way to compare two releases', meta: 'Request · Reviewed · 18 min ago', desc: '“I want to see what changed between versions without opening five tabs.” — Maya O.', badge: 'Reviewed', stat: '128 votes · 14 comments · linked to v2.5' },
			{ title: 'Sign-in loop on Safari', meta: 'Bug · New · 42 min ago', desc: 'Two users bounced back to sign-in. Reproduced, fix in progress.', badge: 'New', stat: '31 votes · maker replied' }
		],
		docs: [
			{ title: 'Getting started', meta: 'Start here · Updated today', desc: 'From account creation to first useful result in under five minutes.', badge: 'Guide', stat: '4 min read · cited by AI answers' },
			{ title: 'How feedback becomes a release', meta: 'Team guide · Updated Aug 22', desc: 'The loop: ask → decide → ship → follow up. With links at every step.', badge: 'Guide', stat: '6 min read · linked from 3 releases' }
		],
		incidents: [
			{ title: 'Elevated API latency', meta: 'Monitoring · Medium impact', desc: 'P99 back under 400ms. Watching for 30 min before resolving.', badge: 'Monitoring', bullets: ['14:02 — Investigating elevated P99 latency', '14:21 — Fix deployed, errors back to baseline', '14:35 — Monitoring before resolving'], stat: 'Updated 6 min ago · subscribe for updates' },
			{ title: 'Webhook retries delayed', meta: 'Resolved · Aug 26', desc: 'Resolved in 47 min. Post-mortem linked below.', badge: 'Resolved', stat: '47 min to resolve · post-mortem published' }
		]
	};

	const faqs = [
		{
			q: 'What is Product Client, exactly?',
			a: 'An interactive product management surface — launches, voted feedback, beautiful documentation and status pages that keep customers in the loop. Built so you get seen, ship more and bring back the beauty of building.'
		},
		{
			q: 'How is this different from posting updates on social media?',
			a: 'Social posts decay and reach whoever the algorithm picks. ProductClient pages are interactive, permanent and ranked — built for visibility and distribution so you stay discoverable.'
		},
		{
			q: 'Do I have to migrate my docs and changelog on day one?',
			a: 'No. Start with launches — most teams do — and connect feedback, beautiful documentation and status pages as you go. Each surface stands alone and compounds when connected.'
		},
		{
			q: 'How do discovery and distribution work?',
			a: 'Every public page is built to rank with structured data for AI and search. Add webhooks and the API to push updates to Slack, Discord and your stack.'
		},
		{
			q: 'Is Product Client free to start?',
			a: 'ProductClient is an interactive surface — you can explore launches and products free, and start publishing as a maker.'
		},
		{
			q: 'How fast can I get my product live?',
			a: 'Minutes. Publish your first interactive release and get seen — then add voted feedback, beautiful documentation and status pages as you ship more.'
		},
		{
			q: 'What about security and reliability?',
			a: 'Enterprise-grade from day one: SSO, RBAC, audit logs and 99.99% uptime.'
		},
		{
			q: 'How do you handle ranking and visibility?',
			a: 'Every launch is a permanent, interactive page designed to rank — voted feedback and beautiful documentation keep it discoverable as you ship toward AGI.'
		},
		{
			q: 'How does feedback help conversion?',
			a: 'Voted feedback links directly to releases and docs — so engagement turns into what to ship next and users see you act.'
		},
		{
			q: 'Can this replace our docs site?',
			a: 'For product docs — guides, release notes, service docs — yes, with beautiful, self-updating documentation that stays current beside releases. Keep your API reference stack if you need interactive playgrounds and SDK generation.'
		},
		{
			q: 'Do we still need a separate status page tool?',
			a: 'If you need status pages that keep customers in the loop — live timelines, severity and post-mortems linked to docs — no. It handles the communication layer so you can investigate, respond and prevent.'
		},
		{
			q: 'How does this help on the way to AGI?',
			a: 'By encouraging builders to ship more and get seen — interactive launches and shared visibility turn every release into momentum.'
		}
	];

	let openFaq = $state<number | null>(null);

	const faqsIndexed = faqs.map((f, idx) => ({ ...f, idx }));
	const faqHalf = Math.ceil(faqsIndexed.length / 2);
	const faqColumns = [faqsIndexed.slice(0, faqHalf), faqsIndexed.slice(faqHalf)];

	function toggleFaq(idx: number) {
		openFaq = openFaq === idx ? null : idx;
	}

	onMount(() => {
		const els = document.querySelectorAll<HTMLElement>('[data-animate]');
		if (!els.length) return;

		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) {
			els.forEach((el) => {
				el.style.opacity = '1';
				el.style.transform = 'none';
			});
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const el = entry.target as HTMLElement;
						const delay = el.dataset.delay || '0';
						setTimeout(() => {
							el.style.opacity = '1';
							el.style.transform = 'translateY(0)';
						}, parseInt(delay));
						observer.unobserve(el);
					}
				});
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
		);

		els.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>ProductClient — Interactive launches, roadmaps, docs & incident tracking</title>
	<meta
		name="description"
		content="Boost distribution, conversion, ranking, accessibility & turnover with interactive launches, engaging roadmaps & automated docs. Get seen, ship more toward AGI."
	/>
	<link rel="canonical" href="https://productclient.com/" />
	<meta property="og:url" content="https://productclient.com/" />
	<meta property="og:title" content="ProductClient — Interactive launches, roadmaps & incident tracking" />
	<meta property="og:description" content="Interactive product management to boost distribution, conversion & ranking — with launches, engaging roadmaps & automated docs. Get seen, ship more." />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="ProductClient — Interactive launches, roadmaps & incident tracking" />
	<meta name="twitter:description" content="Boost distribution, conversion & ranking with interactive launches, engaging roadmaps & automated docs. Get seen toward AGI." />
	{@html `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'ProductClient', url: 'https://productclient.com', logo: 'https://productclient.com/favicon.svg', description: 'ProductClient is an interactive product management surface to boost distribution, conversion, ranking, accessibility, turnover and user engagement with interactive launches, feedback, engaging roadmaps, beautiful automated documentation and incident tracking status pages. Get seen, ship more, bring back the beauty of building as we pace toward AGI and boost Innovation.', sameAs: ['https://x.com/productclient', 'https://github.com/productclient'] }).replace(/</g, '\\u003c')}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'ProductClient', url: 'https://productclient.com', potentialAction: { '@type': 'SearchAction', target: 'https://productclient.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' } }).replace(/</g, '\\u003c')}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }).replace(/</g, '\\u003c')}</script>`}
</svelte:head>

<!-- ─── Floating nav ─── -->
<nav class="landing-bar" aria-label="Landing navigation">
	<div class="landing-bar-inner">
		<a href="/" class="flex items-center gap-2.5 rounded-full px-3 py-2 transition-colors hover:bg-[var(--pc-surface-2)]" aria-label="Product Client home">
			<ProductClientLogo size={28} />
			<span class="text-[13px] font-medium tracking-tight text-[var(--pc-text)]">Product Client</span>
		</a>

		<div class="hidden items-center gap-1 sm:flex">
			<a href="#product" class="nav-link">Product</a>
			<a href="/feed" class="nav-link">Discover</a>
			<a href="/products" class="nav-link">Products</a>
			<a href="/launchpad" class="nav-link">Launches</a>
		</div>

		<div class="flex items-center gap-1">
			<a href={authHref('login')} class="nav-link hidden sm:block">Sign in</a>
			<a href={authHref('sign-up')} class="ml-1 flex items-center gap-1.5 rounded-full bg-[var(--pc-text)] px-4 py-2 text-[13px] font-medium text-[var(--pc-bg)] transition-all hover:opacity-85 active:scale-[0.96]">
				Get started
				<ArrowRight size={13} weight="Outline" />
			</a>
		</div>
	</div>
</nav>

<!-- ─── Hero ─── -->
<header class="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-center justify-start px-6 text-center" style="padding-top: min(24vh, 190px); padding-bottom: 5rem;">
	<h1
		class="hero-h1 mx-auto max-w-[18ch] font-medium text-balance"
		data-animate
		data-delay="80"
	>
		Build beautifully.<br />Ship often. Get seen.
	</h1>

	<p
		class="mx-auto mt-7 max-w-[62ch] text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-[var(--pc-text-muted)]"
		data-animate
		data-delay="160"
	>
		ProductClient is an interactive product management surface to boost distribution, conversion, ranking, accessibility, turnover and user engagement with interactive launches, feedback, engaging roadmaps, beautiful automated documentation and incident tracking status pages. Get seen, ship more, bring back the beauty of building as we pace toward AGI and boost Innovation.
	</p>

	<!-- Hero product shot -->
	<div class="feature-visual hero-card" data-animate data-delay="240">
		<div class="feature-visual-head">
			<Home size={18} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
			<span class="text-[13px] font-medium text-[var(--pc-text)]">Workspace</span>
		</div>
		<img
			src="/images/hero-workspace.png"
			alt="Product Client workspace showing releases, feedback, docs, and incidents in one home"
			class="feature-shot"
			loading="eager"
			decoding="async"
		/>
		<p class="mt-4 text-[12px] text-[var(--pc-text-faint)]">Releases, feedback, docs, and incidents — one home.</p>
	</div>
</header>

<!-- ─── Product areas ─── -->
<section id="product" class="relative z-10 mx-auto w-full max-w-[1200px] scroll-mt-28 px-6" style="padding-top: 6rem; padding-bottom: 8rem;" aria-labelledby="product-heading">
	<div class="mx-auto mb-16 max-w-[52ch] text-center" data-animate>
		<h2 id="product-heading" class="section-h2 mt-4 font-medium">
			Interactive product management.<br />Built for distribution.
		</h2>
		<p class="mx-auto mt-5 max-w-[42ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			Launches, voted feedback, beautiful documentation and status pages that keep customers in the loop.
		</p>
	</div>
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
		{#each areas as area, i (area.title)}
			<div
				class="area-card group"
				data-animate
				data-delay={String(i * 60)}
			>
				<div class="flex items-start gap-4">
					<div class="grid size-12 shrink-0 place-items-center rounded-[14px] bg-[var(--pc-surface-2)] transition-colors group-hover:bg-[var(--pc-accent)]/12">
						<area.icon size={20} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="card-title font-medium">{area.title}</h3>
						<p class="mt-2 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">{area.desc}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ─── The loop ─── -->
<section id="loop" class="relative z-10 mx-auto w-full max-w-[1200px] scroll-mt-28 px-6" style="padding-bottom: 8rem;" aria-labelledby="loop-heading">
	<div class="mx-auto mb-16 max-w-[56ch] text-center" data-animate>
		<h2 id="loop-heading" class="section-h2 mt-4 font-medium">
			Every signal becomes momentum.
		</h2>
		<p class="mx-auto mt-5 max-w-[48ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			Voted feedback becomes a release, documentation and status — run the loop weekly and turn engagement into distribution.
		</p>
	</div>
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
		{#each loopSteps as step, i (step.title)}
			<div class="loop-card" data-animate data-delay={String(i * 70)}>
				<div class="flex items-center justify-between">
					<div class="grid size-11 place-items-center rounded-[12px] bg-[var(--pc-surface-2)]">
						<step.icon size={18} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
					</div>
					<span class="text-[13px] font-semibold tracking-widest text-[var(--pc-text-faint)]">{step.step}</span>
				</div>
				<h3 class="card-title mt-5 font-medium">{step.title}</h3>
				<p class="mt-2 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">{step.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ─── Feature deep-dives ─── -->
<section class="relative z-10 mx-auto w-full max-w-[1200px] px-6" style="padding-bottom: 8rem;" aria-label="Product deep dive">
	{#each features as feature, i (feature.id)}
		<article id={feature.id} class="feature-row scroll-mt-28" data-animate>
			<div class="feature-copy">
				<h3 class="feature-h3 font-medium">
					{feature.title}
				</h3>
				<p class="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[var(--pc-text-muted)]">
					{feature.desc}
				</p>
				<ul class="mt-6 space-y-3">
					{#each feature.points as point (point)}
						<li class="flex items-start gap-2.5 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">
							<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--pc-accent)]/15">
								<Check size={12} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
							</span>
							{point}
						</li>
					{/each}
				</ul>
				<a href={feature.href} class="feature-link">
					{feature.linkLabel}
					<ArrowRight size={14} weight="Outline" aria-hidden="true" />
				</a>
			</div>
			<div class="feature-visual" aria-hidden="true">
				<div class="feature-visual-head">
					<feature.icon size={18} weight="Outline" class="text-[var(--pc-accent-strong)]" />
					<span class="text-[13px] font-medium text-[var(--pc-text)]">{feature.eyebrow}</span>
				</div>
				{#if feature.id === 'incidents'}
					<img
						src="/images/incidents-status.png"
						alt="Product Client status page showing component uptime bars at 100 percent"
						class="feature-shot"
						loading="lazy"
						decoding="async"
					/>
				{:else if feature.id === 'releases'}
					<img
						src="/images/releases-page.png"
						alt="Product Client release page preview"
						class="feature-shot"
						loading="lazy"
						decoding="async"
					/>
				{:else}
					<div class="mt-4 space-y-3">
						{#each previewContent[feature.id] as row (row.title)}
							<div class="preview-row">
								<div class="flex flex-wrap items-center gap-2">
									<span class="preview-badge">{row.badge}</span>
									<p class="text-[13px] font-medium text-[var(--pc-text)]">{row.title}</p>
								</div>
								<p class="mt-1 text-[12px] text-[var(--pc-text-faint)]">{row.meta}</p>
							</div>
						{/each}
					</div>
				{/if}
				<p class="mt-4 text-[12px] text-[var(--pc-text-faint)]">0{i + 1} — boost {feature.eyebrow.toLowerCase()} visibility & ranking</p>
			</div>
		</article>
	{/each}
</section>

<!-- ─── Old way vs Product Client way ─── -->
<section class="relative z-10 mx-auto w-full max-w-[1200px] px-6" style="padding-bottom: 8rem;" aria-labelledby="switch-heading">
	<div class="mx-auto mb-16 max-w-[52ch] text-center" data-animate>
		<h2 id="switch-heading" class="section-h2 mt-4 font-medium">
			Stop scattering your story.
		</h2>
		<p class="mx-auto mt-5 max-w-[42ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			Launches, threads, stale docs and silent incidents — visibility dies when your product story is scattered.
		</p>
	</div>
	<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
		<div class="compare-col" data-animate>
			<p class="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--pc-text-faint)]">Scattered story</p>
			<ul class="mt-6 space-y-4">
				{#each oldWay as pain (pain)}
					<li class="flex items-start gap-2.5 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">
						<CloseCircle size={16} weight="Outline" class="mt-0.5 shrink-0 text-[var(--pc-accent-strong)]" aria-hidden="true" />
						{pain}
					</li>
				{/each}
			</ul>
		</div>
		<div class="compare-col compare-highlight" data-animate data-delay="100">
			<p class="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--pc-accent-strong)]">Connected loop</p>
			<ul class="mt-6 space-y-4">
				{#each newWay as gain (gain)}
					<li class="flex items-start gap-2.5 text-[14px] leading-relaxed text-[var(--pc-text)]">
						<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--pc-accent)]/15">
							<Check size={12} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
						</span>
						{gain}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<!-- ─── Why Product Client ─── -->
<section id="why" class="relative z-10 mx-auto w-full max-w-[1200px] scroll-mt-28 px-6" style="padding-bottom: 8rem;" aria-labelledby="why-heading">
	<div class="mx-auto mb-16 max-w-[52ch] text-center" data-animate>
		<h2 id="why-heading" class="section-h2 mt-4 font-medium">
			Built for builders racing toward AGI.
		</h2>
		<p class="mx-auto mt-5 max-w-[42ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			Bring back the beauty of building — an interactive surface where shipping more gets you seen.
		</p>
	</div>
	<div class="grid grid-cols-1 gap-5 md:grid-cols-3">
		{#each whyCards as card, i (card.title)}
			<div class="area-card" data-animate data-delay={String(i * 70)}>
				<div class="mb-5 grid size-11 place-items-center rounded-[12px] bg-[var(--pc-surface-2)]">
					<card.icon size={18} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
				</div>
				<h3 class="card-title font-medium">{card.title}</h3>
				<p class="mt-2 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">{card.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ─── For makers / for followers ─── -->
<section class="relative z-10 mx-auto w-full max-w-[1200px] px-6" style="padding-bottom: 8rem;" aria-labelledby="audience-heading">
	<div class="mx-auto mb-16 max-w-[52ch] text-center" data-animate>
		<h2 id="audience-heading" class="section-h2 mt-4 font-medium">
			Ship it. Boost it. Both compound.
		</h2>
	</div>
	<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
		{#each audiences as audience, i (audience.title)}
			<div class="split-card" data-animate data-delay={String(i * 80)}>
				<div class="mb-5 grid size-11 place-items-center rounded-[12px] bg-[var(--pc-surface-2)]">
					<audience.icon size={18} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
				</div>
				<p class="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--pc-text-faint)]">{audience.title}</p>
				<h3 class="feature-h3 mt-2 font-medium">{audience.hook}</h3>
				<ul class="mt-6 space-y-3">
					{#each audience.points as point (point)}
						<li class="flex items-start gap-2.5 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">
							<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--pc-accent)]/15">
								<Check size={12} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
							</span>
							{point}
						</li>
					{/each}
				</ul>
				{#if audience.href === 'signup'}
					<a href={authHref('sign-up')} class="feature-link">
						{audience.cta}
						<ArrowRight size={14} weight="Outline" aria-hidden="true" />
					</a>
				{:else}
					<a href={audience.href} class="feature-link">
						{audience.cta}
						<ArrowRight size={14} weight="Outline" aria-hidden="true" />
					</a>
				{/if}
			</div>
		{/each}
	</div>
</section>

<!-- ─── Capabilities ─── -->
<section id="capabilities" class="relative z-10 mx-auto w-full max-w-[1200px] scroll-mt-28 px-6" style="padding-bottom: 8rem;" aria-labelledby="capabilities-heading">
	<div class="mx-auto mb-16 max-w-[52ch] text-center" data-animate>
		<h2 id="capabilities-heading" class="section-h2 mt-4 font-medium">
			Distribution and reliability from day one.
		</h2>
		<p class="mx-auto mt-5 max-w-[42ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			Interactive infrastructure to get seen and stay reliable as you pace toward AGI.
		</p>
	</div>

	<div class="cap-grid">
		{#each capabilities as cap, i (cap.title)}
			<div
				class="cap-card group"
				data-animate
				data-delay={String(i * 40)}
			>
				<div class="mb-5 grid size-11 place-items-center rounded-[12px] bg-[var(--pc-surface-2)] transition-all group-hover:bg-[var(--pc-accent)]/10">
					<cap.icon size={18} weight="Outline" class="text-[var(--pc-accent-strong)]" aria-hidden="true" />
				</div>
				<h3 class="card-title-sm font-medium">{cap.title}</h3>
				<p class="mt-2 text-[13px] leading-relaxed text-[var(--pc-text-muted)]">{cap.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ─── Trial CTA ─── -->
<section class="relative z-10 mx-auto w-full max-w-[1200px] px-6" style="padding-bottom: 8rem;" aria-labelledby="trial-heading">
	<div class="trial-band" data-animate>
		<h2 id="trial-heading" class="section-h2 mx-auto mt-4 max-w-[24ch] font-medium">
			Build beautifully. Get seen on the way to AGI.
		</h2>
		<p class="mx-auto mt-4 max-w-[48ch] text-[15px] leading-relaxed text-[var(--pc-text-muted)]">
			Interactive — launches, voted feedback, beautiful documentation and status pages that keep customers in the loop. Ship more and bring back the beauty of building.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-4">
			<a href={authHref('sign-up')} class="hero-cta-primary">
				Get started
				<ArrowRight size={14} weight="Outline" />
			</a>
			<a href="/launchpad" class="hero-cta-ghost">
				View launch feed
			</a>
		</div>
	</div>
</section>

<!-- ─── FAQ ─── -->
<section id="faq" class="relative z-10 mx-auto w-full max-w-[1040px] scroll-mt-28 px-6" style="padding-bottom: 8rem;" aria-labelledby="faq-heading">
	<div class="mx-auto mb-12 max-w-[52ch] text-center" data-animate>
		<h2 id="faq-heading" class="section-h2 mt-4 font-medium">
			Questions, answered.
		</h2>
	</div>
	<div class="faq-grid">
		{#each faqColumns as col (col[0]?.idx ?? col.length)}
			<div class="faq-col">
				{#each col as faq (faq.q)}
					<div class="faq" data-animate data-delay={String(faq.idx * 40)}>
						<button
							type="button"
							class="faq-btn"
							aria-expanded={openFaq === faq.idx}
							onclick={() => toggleFaq(faq.idx)}
						>
							<span class="faq-plus-wrap" aria-hidden="true">
								<Plus size={16} weight="Outline" />
							</span>
							<span class="faq-question">{faq.q}</span>
						</button>
						<div class="faq-answer {openFaq === faq.idx ? 'faq-answer-open' : ''}">
							<p>{faq.a}</p>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</section>

<!-- ─── Footer ─── -->
<footer class="relative z-10" style="border-top: 1px solid var(--pc-border-strong);">
	<div class="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-16 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
		<div>
			<div class="flex items-center gap-2.5">
				<ProductClientLogo size={28} />
				<span class="text-[13px] font-medium tracking-tight text-[var(--pc-text)]">Product Client</span>
			</div>
			<p class="mt-4 max-w-[30ch] text-[13px] leading-relaxed text-[var(--pc-text-muted)]">
				Interactive product management surface — launches, voted feedback, beautiful documentation and status pages that keep customers in the loop.
			</p>
		</div>
		<nav aria-label="Product">
			<p class="footer-heading">Product</p>
			<ul class="footer-list">
				<li><a href="#releases">Releases</a></li>
				<li><a href="#feedback">Feedback</a></li>
				<li><a href="#docs">Docs</a></li>
				<li><a href="#incidents">Incidents</a></li>
			</ul>
		</nav>
		<nav aria-label="Discover">
			<p class="footer-heading">Discover</p>
			<ul class="footer-list">
				<li><a href="/feed">Discover</a></li>
				<li><a href="/products">Products</a></li>
				<li><a href="/launchpad">Launches</a></li>
			</ul>
		</nav>
		<nav aria-label="Account">
			<p class="footer-heading">Account</p>
			<ul class="footer-list">
				<li><a href={authHref('sign-up')}>Get started</a></li>
				<li><a href={authHref('login')}>Sign in</a></li>
				<li><a href="#faq">FAQ</a></li>
			</ul>
		</nav>
	</div>
	<div class="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-6 pb-10 sm:flex-row">
		<p class="text-[12px] text-[var(--pc-text-faint)]">&copy; 2026 Product Client</p>
	</div>
</footer>

<style>
	/* ── Top bar (flat, solid — no blur, same in every browser) ── */
	.landing-bar {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 50;
		width: 100%;
		background: var(--pc-bg);
	}
	.landing-bar-inner {
		margin-inline: auto;
		width: 100%;
		max-width: 1200px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 1.5rem;
	}

	.nav-link {
		padding: 8px 14px;
		border-radius: 999px;
		font-size: 13px;
		color: var(--pc-text-muted);
		transition: background-color 0.2s, color 0.2s;
		white-space: nowrap;
	}
	.nav-link:hover {
		background: var(--pc-surface-2);
		color: var(--pc-text);
	}

	/* ── Landing display type ──
	   Component-scoped classes beat the global unlayered h1–h6 rules in
	   app.css (unlayered CSS wins over Tailwind's layered utilities, so
	   text-[clamp()] on a heading silently loses). Standard scale:
	   hero 44→96px, section 32→52px, feature 24→36px. */
	.hero-h1 {
		font-size: clamp(2.75rem, 1.5rem + 5vw, 6rem);
		line-height: 0.95;
		letter-spacing: -0.045em;
		color: var(--pc-text);
	}
	.section-h2 {
		font-size: clamp(2rem, 1.5rem + 2.5vw, 3.25rem);
		line-height: 1.08;
		letter-spacing: -0.03em;
		color: var(--pc-text);
	}
	.feature-h3 {
		font-size: clamp(1.5rem, 1.25rem + 1.5vw, 2.25rem);
		line-height: 1.12;
		letter-spacing: -0.025em;
		color: var(--pc-text);
	}
	.card-title {
		font-size: 17px;
		line-height: 1.35;
		letter-spacing: -0.01em;
		color: var(--pc-text);
	}
	.card-title-sm {
		font-size: 15px;
		line-height: 1.4;
		letter-spacing: -0.005em;
		color: var(--pc-text);
	}

	/* ── Hero ── */
	.hero-cta-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 22px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		background: var(--pc-text);
		color: var(--pc-bg);
		transition: opacity 0.2s, transform 0.2s;
	}
	.hero-cta-primary:hover { opacity: 0.88; }
	.hero-cta-primary:active { transform: scale(0.96); }

	.hero-cta-ghost {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 12px 18px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		color: var(--pc-text-muted);
		background: var(--pc-surface);
		transition: background-color 0.2s, color 0.2s;
	}
	.hero-cta-ghost:hover {
		background: var(--pc-surface-2);
		color: var(--pc-text);
	}

	/* ── Hero card ── */
	.hero-card {
		margin-top: 4rem;
		width: 100%;
		max-width: 1020px;
	}
	.preview-row {
		padding: 1rem 1.1rem;
		border-radius: 14px;
		background: var(--pc-bg);
	}
	.preview-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 9px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 600;
		background: color-mix(in srgb, var(--pc-accent) 16%, transparent);
		color: var(--pc-accent-light);
		filter: brightness(0.92);
	}
	:global(.light) .preview-badge {
		color: var(--pc-accent-strong);
	}

	/* ── Area cards ── */
	.area-card {
		padding: 2rem;
		border-radius: 20px;
		background: var(--pc-surface);
		transition: background-color 0.3s;
	}
	.area-card:hover {
		background: var(--pc-surface-2);
	}

	/* ── Feature rows ── */
	.feature-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		align-items: center;
		padding: 3.5rem 0;
	}
	.feature-row:first-child {
		padding-top: 0;
	}
	@media (min-width: 900px) {
		.feature-row {
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
		}
		.feature-row:nth-child(even) .feature-copy {
			order: 2;
		}
		.feature-row:nth-child(even) .feature-visual {
			order: 1;
		}
	}
	.feature-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 1.5rem;
		font-size: 14px;
		font-weight: 500;
		color: var(--pc-text);
		padding: 10px 16px;
		border-radius: 999px;
		background: var(--pc-surface);
		transition: background-color 0.2s;
	}
	.feature-link:hover {
		background: var(--pc-surface-2);
	}
	.feature-visual {
		padding: 1.5rem;
		border-radius: 20px;
		background: var(--pc-surface);
	}
	.feature-visual-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding-bottom: 1rem;
	}
	.feature-shot {
		display: block;
		width: 100%;
		height: auto;
		margin-top: 1rem;
		border-radius: 12px;
	}

	/* ── Loop cards ── */
	.loop-card {
		padding: 1.75rem;
		border-radius: 20px;
		background: var(--pc-surface);
		transition: background-color 0.3s;
	}
	.loop-card:hover {
		background: var(--pc-surface-2);
	}

	/* ── Compare ── */
	.compare-col {
		padding: 2.25rem;
		border-radius: 20px;
		background: var(--pc-surface);
	}
	.compare-highlight {
		background: var(--pc-surface-2);
	}

	/* ── Split cards ── */
	.split-card {
		padding: 2.5rem;
		border-radius: 24px;
		background: var(--pc-surface);
	}

	/* ── Capabilities grid ── */
	.cap-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		border-radius: 20px;
	}
	@media (max-width: 1024px) {
		.cap-grid { grid-template-columns: repeat(2, 1fr); }
	}
	@media (max-width: 640px) {
		.cap-grid { grid-template-columns: 1fr; }
	}
	.cap-card {
		padding: 2rem;
		border-radius: 16px;
		background: var(--pc-surface);
		transition: background-color 0.3s;
	}
	.cap-card:hover {
		background: var(--pc-surface-2);
	}

	/* ── Trial band ── */
	.trial-band {
		padding: 4.5rem 2rem;
		border-radius: 24px;
		text-align: center;
		background: var(--pc-surface);
	}
	@media (min-width: 640px) {
		.trial-band { padding: 5.5rem 3rem; }
	}

	/* ── FAQ (Genesis-style: flat cards, plus-to-close, indented answers) ── */
	.faq-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		width: 100%;
	}
	@media (max-width: 700px) {
		.faq-grid {
			grid-template-columns: 1fr;
		}
	}
	.faq-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.faq {
		border-radius: 20px;
		background: var(--pc-surface);
		overflow: hidden;
		transition: background-color 0.25s;
	}
	.faq:hover {
		background: var(--pc-surface-2);
	}
	.faq-btn {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 1.125rem 1.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: var(--pc-text);
	}
	.faq-question {
		flex: 1;
		font-size: 15px;
		font-weight: 500;
		line-height: 1.6;
		letter-spacing: -0.01em;
		color: var(--pc-text);
		text-wrap: pretty;
		overflow-wrap: break-word;
	}
	.faq-plus-wrap {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		color: var(--pc-accent-strong);
	}
	.faq-plus-wrap :global(svg) {
		transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
	}
	.faq-btn[aria-expanded='true'] .faq-plus-wrap :global(svg) {
		transform: rotate(45deg);
	}
	.faq-answer {
		max-height: 0;
		opacity: 0;
		overflow: hidden;
		transition:
			max-height 0.35s cubic-bezier(0.23, 1, 0.32, 1),
			opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1);
	}
	.faq-answer-open {
		max-height: 500px;
		opacity: 1;
	}
	.faq-answer p {
		margin: 0;
		padding: 0 1.25rem 1.25rem 3.25rem;
		font-size: 14px;
		line-height: 1.7;
		color: var(--pc-text-muted);
		text-wrap: pretty;
		overflow-wrap: break-word;
	}

	/* ── Footer ── */
	.footer-heading {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--pc-text-faint);
		margin-bottom: 1rem;
	}
	.footer-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.65rem;
		font-size: 13.5px;
	}
	.footer-list a {
		color: var(--pc-text-muted);
		transition: color 0.18s;
	}
	.footer-list a:hover {
		color: var(--pc-text);
	}

	/* ── Scroll reveal ── */
	[data-animate] {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
		will-change: opacity, transform;
	}

	@media (prefers-reduced-motion: reduce) {
		[data-animate] {
			opacity: 1 !important;
			transform: none !important;
			transition: none !important;
		}
		.faq-answer,
		.faq-plus-wrap :global(svg) {
			transition: none;
		}
	}
</style>
