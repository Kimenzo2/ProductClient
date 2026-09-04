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
		Play
	} from 'reicon-svelte';
	import ProductClientLogo from '$lib/components/brand/ProductClientLogo.svelte';
	import { authHref } from '$lib/auth/urls';

	const areas = [
		{
			icon: Rocket,
			title: 'Releases',
			desc: 'Versioned changelogs your users actually read. Timestamped, linkable, searchable.',
		},
		{
			icon: Message,
			title: 'Feedback',
			desc: 'Structured input from users, routed to the right people. No spreadsheets, no lost threads.',
		},
		{
			icon: BookOpen,
			title: 'Docs',
			desc: 'Self-serve documentation tied directly to your product. Always current, never stale.',
		},
		{
			icon: AlertCircle,
			title: 'Incidents',
			desc: 'Status communication that builds trust. Real-time updates, resolved timelines.',
		}
	];

	const capabilities = [
		{ icon: Globe, title: 'SEO-ready pages', desc: 'Every launch, update, and doc page is built for search engines and AI crawlers.' },
		{ icon: Cpu, title: 'AI-readable listings', desc: 'Structured data that AI agents can parse, index, and surface in answers.' },
		{ icon: Code2, title: 'API access', desc: 'Programmatic access to everything. Build on top of Product Client.' },
		{ icon: Shield, title: 'Enterprise security', desc: 'SOC 2 compliant. SSO, role-based access, audit logs.' },
		{ icon: Chart3, title: 'Analytics', desc: 'Understand how users engage with your releases and docs.' },
		{ icon: Link, title: 'Webhooks', desc: 'Real-time event delivery to your endpoints. Slack, Discord, custom.' },
		{ icon: LockKeyhole, title: 'SSO & RBAC', desc: 'SAML, OIDC. Team permissions at every level.' },
		{ icon: Clock, title: '99.99% uptime', desc: 'Infrastructure that doesn\'t go down when your product ships.' }
	];

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
							el.style.transform = 'translateY(0) blur(0)';
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
	<title>Product Client — Follow products, not algorithms</title>
	<meta name="description" content="A calm product operating system. Releases, feedback, docs, and incidents — in one place, built for humans and machines." />
</svelte:head>

<!-- ─── Floating nav ─── -->
<nav class="fixed top-0 left-0 z-50 flex w-full justify-center pt-5" aria-label="Landing navigation">
	<div class="nav-glass flex items-center gap-1 px-2 py-2">
		<a href="/" class="flex items-center gap-2.5 rounded-full px-3.5 py-2 transition-colors hover:bg-white/[0.06]" aria-label="Product Client home">
			<ProductClientLogo size={28} />
			<span class="text-[13px] font-medium tracking-tight text-white">Product Client</span>
		</a>

		<div class="mx-1 h-4 w-px bg-white/[0.08]"></div>

		<a href="/feed" class="nav-link">Discover</a>
		<a href="/products" class="nav-link">Products</a>
		<a href="/launchpad" class="nav-link">Launches</a>

		<div class="mx-1 h-4 w-px bg-white/[0.08]"></div>

		<a href={authHref('sign-up')} class="ml-1 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:opacity-85 active:scale-[0.96]">
			Get started
			<ArrowRight size={13} weight="Outline" />
		</a>
	</div>
</nav>

<!-- ─── Hero ─── -->
<section class="relative z-10 flex h-dvh flex-col items-center justify-start px-6 text-center" style="padding-top: min(28vh, 220px);">
	<div class="mb-8" data-animate data-delay="0">
	<div class="hero-badge">
		<span class="inline-block size-1.5 rounded-full bg-[var(--pc-accent)]"></span>
		Now available
	</div>
	</div>

	<h1
		class="mx-auto max-w-[15ch] text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-white"
		data-animate
		data-delay="80"
	>
		Follow products, not algorithms.
	</h1>

	<p
		class="mx-auto mt-7 max-w-[48ch] text-[clamp(1rem,1.5vw,1.15rem)] leading-relaxed text-[var(--pc-text-muted)]"
		data-animate
		data-delay="160"
	>
		A calm product operating system. Releases, feedback, docs, and incidents — built for the people who build products.
	</p>

	<div class="mt-12 flex items-center gap-4" data-animate data-delay="240">
		<a href="/feed" class="hero-cta-primary">
			<Play size={15} weight="Outline" />
			Explore products
		</a>
		<a href="/feed" class="hero-cta-ghost">
			View launch feed
			<ArrowRight size={14} weight="Outline" />
		</a>
	</div>
</section>

<!-- ─── Product areas ─── -->
<section class="relative z-10 mx-auto w-full max-w-[1200px] px-6" style="padding-top: 12rem; padding-bottom: 16rem;">
	<div class="mb-28 mx-auto max-w-[52ch] text-center" data-animate>
		
		<h2 class="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
			Everything your product needs.<br />Nothing it doesn't.
		</h2>
		<p class="mt-5 max-w-[42ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			Four surfaces, one system. Each one purpose-built for a specific product function.
		</p>
	</div>		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
		{#each areas as area, i (area.title)}
			<div
				class="area-card group"
				data-animate
				data-delay={String(i * 60)}
			>
				<div class="flex items-start gap-4">
					<div class="grid size-12 shrink-0 place-items-center rounded-[14px] bg-white/[0.04] transition-colors group-hover:bg-[var(--pc-accent)]/12">
						<area.icon size={20} weight="Outline" class="text-[var(--pc-text-muted)] transition-colors group-hover:text-[var(--pc-accent-light)]" />
					</div>
					<div class="min-w-0 flex-1">
					<h3 class="text-[17px] font-medium text-white">{area.title}</h3>
					<p class="mt-2 text-[14px] leading-relaxed text-[var(--pc-text-muted)]">{area.desc}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ─── Capabilities ─── -->
<section class="relative z-10 mx-auto w-full max-w-[1200px] px-6" style="padding-top: 12rem; padding-bottom: 16rem;">
	<div class="mb-28 mx-auto max-w-[52ch] text-center" data-animate>
		
		<h2 class="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
			Enterprise-grade from day one.
		</h2>
		<p class="mt-5 max-w-[42ch] text-base leading-relaxed text-[var(--pc-text-muted)]">
			The infrastructure layer that makes product communication reliable, discoverable, and fast.
		</p>
	</div>

	<div class="cap-grid">
		{#each capabilities as cap, i (cap.title)}
			<div
				class="cap-card group"
				data-animate
				data-delay={String(i * 40)}
			>
				<div class="mb-5 grid size-11 place-items-center rounded-[12px] bg-white/[0.04] transition-all group-hover:bg-[var(--pc-accent)]/10">
					<cap.icon size={18} weight="Outline" class="text-[var(--pc-text-faint)] transition-colors group-hover:text-[var(--pc-accent-light)]" />
				</div>
				<h3 class="text-[15px] font-medium text-white">{cap.title}</h3>
				<p class="mt-2 text-[13px] leading-relaxed text-[var(--pc-text-muted)]">{cap.desc}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ─── Footer ─── -->
<footer class="relative z-10" style="border-top: 1px solid rgba(255,255,255,0.05);">
	<div class="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-6 py-16 sm:flex-row sm:justify-between sm:items-center">
		<div class="flex items-center gap-2.5">
			<ProductClientLogo size={28} />
			<span class="text-[13px] font-medium tracking-tight text-white">Product Client</span>
		</div>
		<div class="flex flex-wrap items-center justify-center gap-6 text-[13px] text-[var(--pc-text-muted)]">
			<a href="/feed" class="transition-colors hover:text-white">Discover</a>
			<a href="/products" class="transition-colors hover:text-white">Products</a>
			<a href="/launchpad" class="transition-colors hover:text-white">Launches</a>
		<a href={authHref('login')} class="transition-colors hover:text-white">Sign in</a>
		</div>
		<p class="text-[12px] text-[var(--pc-text-faint)]">&copy; 2026 Product Client</p>
	</div>
</footer>

<style>
	/* ── Floating glass nav ── */
	.nav-glass {
		background: rgba(12, 12, 12, 0.65);
		backdrop-filter: blur(20px) saturate(1.4);
		-webkit-backdrop-filter: blur(20px) saturate(1.4);
		border-radius: 999px;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.06),
			0 8px 32px rgba(0, 0, 0, 0.35);
	}

	.nav-link {
		padding: 8px 14px;
		border-radius: 999px;
		font-size: 13px;
		color: rgba(251, 251, 251, 0.55);
		transition: background-color 0.2s, color 0.2s;
	}
	.nav-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #fbfbfb;
	}

	/* ── Eyebrow tag ── */
	

	/* ── Hero ── */
	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 5px 14px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.06em;
		color: rgba(251, 251, 251, 0.55);
		background: rgba(255, 255, 255, 0.03);
		margin-bottom: 2rem;
	}

	.hero-cta-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 22px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		background: #fbfbfb;
		color: #070707;
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
		color: rgba(251, 251, 21, 0.7);
		background: rgba(255, 255, 255, 0.04);
		transition: background-color 0.2s, color 0.2s;
	}
	.hero-cta-ghost:hover {
		background: rgba(255, 255, 255, 0.07);
		color: #fbfbfb;
	}

	/* ── Area cards ── */
	.area-card {
		padding: 2rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.025);
		transition: background-color 0.3s;
	}
	.area-card:hover {
		background: rgba(255, 255, 255, 0.04);
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
		background: rgba(255, 255, 255, 0.025);
		transition: background-color 0.3s;
	}
	.cap-card:hover {
		background: rgba(255, 255, 255, 0.045);
	}

	/* ── Scroll reveal ── */
	[data-animate] {
		opacity: 0;
		transform: translateY(24px) blur(4px);
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
	}
</style>
