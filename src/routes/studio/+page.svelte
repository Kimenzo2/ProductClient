<script lang="ts">
	import { Upload, Rocket, Sparkles, Calendar, Tag, Link as LinkIcon, Globe, ImagePlus } from 'reicon-svelte';
	import { goto } from '$app/navigation';

	// Tabs
	let mode = $state<'update' | 'launch'>('update');

	// Update form
	let title = $state('');
	let type = $state('launch');
	let desc = $state('');

	// Launch form
	let productName = $state('');
	let tagline = $state('');
	let category = $state('');
	let logoUrl = $state('');
	let websiteUrl = $state('');
	let launchDate = $state('');
	let launchDesc = $state('');
	let submitted = $state(false);
	let createdSlug = $state('');

	const categories = [
		'AI & Machine Learning',
		'Developer Tools',
		'Design & Creative',
		'Productivity',
		'Cloud & Infrastructure',
		'Finance & Payments',
		'Open Source',
		'SaaS',
		'Mobile',
		'Other'
	];

	function submitLaunch() {
		// Generate slug from product name
		const slug = productName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
		createdSlug = slug;
		submitted = true;
	}

	function goToLaunch() {
		goto(`/launch/${createdSlug}`);
	}
</script>

<svelte:head><title>Studio — Product Client</title></svelte:head>

<div class="mx-auto max-w-[1100px] px-3 md:px-6 py-6">
	<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Studio</h1>
	<p class="text-sm text-[var(--pc-text-muted)]">Post an update or launch a new product. Craft matters.</p>

	<!-- Mode tabs -->
	<div class="mt-4 flex items-center gap-1 rounded-full border border-[var(--pc-border)] bg-[var(--pc-surface)] p-1 w-fit">
		<button
			onclick={() => { mode = 'update'; submitted = false; }}
			class={[
				'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-600 transition-colors',
				mode === 'update' ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]'
			].join(' ')}
		>
			<Sparkles size={14} weight="Outline" /> Post Update
		</button>
		<button
			onclick={() => { mode = 'launch'; submitted = false; }}
			class={[
				'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-600 transition-colors',
				mode === 'launch' ? 'bg-[var(--pc-text)] text-[var(--pc-bg)]' : 'text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]'
			].join(' ')}
		>
			<Rocket size={14} weight="Outline" /> Launch Product
		</button>
	</div>

	{#if mode === 'update'}
		<!-- ═══════ POST UPDATE ═══════ -->
		<div class="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 pc-enter-stagger">
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-5 bg-[var(--pc-surface)]">
					<label for="pc-title" class="block text-sm font-600">Title</label>
					<input id="pc-title" bind:value={title} placeholder="e.g., ChatGPT 6 – The most human launch yet" class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-all duration-200" />
					<div class="mt-4 grid grid-cols-2 gap-3">
						<label class="block">
							<span class="text-sm font-600">Type (State)</span>
							<select bind:value={type} class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm">
								<option value="launch">Launch</option>
								<option value="changelog">Changelog</option>
								<option value="incident">Incident</option>
								<option value="fix">Fix</option>
								<option value="event">Event</option>
							</select>
						</label>
						<label class="block">
							<span class="text-sm font-600">Product</span>
							<select class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm"><option>Bento</option><option>ChatGPT</option><option>Linear</option></select>
						</label>
					</div>
					<label for="pc-desc" class="mt-4 block text-sm font-600">Description / Changelog (markdown)</label>
					<textarea id="pc-desc" bind:value={desc} rows="6" placeholder="Write a crafted changelog, incident note, or launch story..." class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"></textarea>

					<div class="mt-4 rounded-[12px] border border-dashed border-[var(--pc-border-strong)] bg-[var(--pc-surface-2)] p-6 grid place-items-center text-center hover:border-[var(--pc-border)] transition-colors">
						<Upload size={28} weight="Outline" />
						<p class="mt-2 text-sm font-600">Attach media (Supabase Storage) — drag & drop</p>
						<p class="text-xs text-[var(--pc-text-muted)]">Images, video, or documents — max 50 MB</p>
						<button class="mt-3 pc-btn-ghost py-2">Select file</button>
					</div>

					<div class="mt-6 flex gap-3">
						<button class="flex-1 pc-btn-primary py-3">Publish update <span class="pc-btn-icon">→</span></button>
						<button class="pc-btn-ghost px-6 py-3">Save draft</button>
					</div>
					<p class="mt-3 text-xs text-[var(--pc-text-faint)]">Superforms + Zod validation will be wired to Supabase. This is UI-only preview.</p>
				</div>
			</div>

			<div class="space-y-4">
				<p class="text-xs font-medium tracking-widest uppercase text-[var(--pc-text-muted)]">Preview</p>
				<div class="pc-bezel p-1.5">
					<div class="pc-bezel-inner p-3 bg-[var(--pc-surface)]">
						<div class="aspect-[4/3] rounded-[10px] overflow-hidden bg-[var(--pc-surface-2)] border border-[var(--pc-border)] grid place-items-center text-[var(--pc-text-muted)] text-sm">
							{#if title}{title}{:else}Your title preview{/if}
						</div>
						<p class="mt-3 text-sm font-600 line-clamp-2 text-balance">{title || 'Untitled launch'}</p>
						<p class="text-xs text-[var(--pc-text-muted)] capitalize">{type} — Just now — 0 reads</p>
					</div>
				</div>
				<div class="pc-bezel p-1.5">
					<div class="pc-bezel-inner p-4 bg-[var(--pc-surface)]">
						<h3 class="text-sm font-medium tracking-tight">Tips for craft</h3>
						<ul class="mt-2 text-xs leading-5 text-[var(--pc-text-muted)] list-disc pl-4">
							<li>Launch posts with clear changelogs perform 2.3x better.</li>
							<li>Use 16:9 thumbnail with bold type, 80ch max.</li>
							<li>Incidents: be transparent, include timeline + "resolved".</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

	{:else if !submitted}
		<!-- ═══════ LAUNCH PRODUCT ═══════ -->
		<div class="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 pc-enter-stagger">
			<div class="pc-bezel p-1.5">
				<div class="pc-bezel-inner p-5 bg-[var(--pc-surface)]">
					<label for="pc-product-name" class="block text-sm font-600">Product name</label>
					<input id="pc-product-name" bind:value={productName} placeholder="e.g., Bento" class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-all duration-200" />

					<label for="pc-tagline" class="mt-4 block text-sm font-600">Tagline</label>
					<input id="pc-tagline" bind:value={tagline} placeholder="e.g., Personal intelligence hub — not just a launcher" class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-all duration-200" />

					<div class="mt-4 grid grid-cols-2 gap-3">
						<label class="block">
							<span class="text-sm font-600 flex items-center gap-1.5"><Tag size={12} weight="Outline" /> Category</span>
							<select bind:value={category} class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm">
								<option value="">Select category...</option>
								{#each categories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</label>
						<label class="block">
							<span class="text-sm font-600 flex items-center gap-1.5"><Calendar size={12} weight="Outline" /> Launch date</span>
							<input type="date" bind:value={launchDate} class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)]" />
						</label>
					</div>

					<label for="pc-logo" class="mt-4 block text-sm font-600 flex items-center gap-1.5"><ImagePlus size={12} weight="Outline" /> Logo URL</label>
					<input id="pc-logo" bind:value={logoUrl} placeholder="https://..." class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-all duration-200" />

					<label for="pc-website" class="mt-4 block text-sm font-600 flex items-center gap-1.5"><Globe size={12} weight="Outline" /> Website URL</label>
					<input id="pc-website" bind:value={websiteUrl} placeholder="https://..." class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-all duration-200" />

					<label for="pc-launch-desc" class="mt-4 block text-sm font-600">Description</label>
					<textarea id="pc-launch-desc" bind:value={launchDesc} rows="4" placeholder="Tell people what you're building and why they should care..." class="mt-2 w-full rounded-[10px] border border-[var(--pc-border)] bg-[var(--pc-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--pc-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"></textarea>

					<div class="mt-6 flex gap-3">
						<button onclick={submitLaunch} class="flex-1 pc-btn-primary py-3">
							Create pre-launch page <span class="pc-btn-icon">→</span>
						</button>
						<button class="pc-btn-ghost px-6 py-3">Save draft</button>
					</div>
					<p class="mt-3 text-xs text-[var(--pc-text-faint)]">Creates a pre-launch waitlist page at /launch/{productName ? productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '{slug}'}</p>
				</div>
			</div>

			<div class="space-y-4">
				<p class="text-xs font-medium tracking-widest uppercase text-[var(--pc-text-muted)]">Preview</p>
				<div class="pc-bezel p-1.5">
					<div class="pc-bezel-inner p-5 bg-[var(--pc-surface)] text-center">
						{#if logoUrl}
							<img src={logoUrl} alt="logo" class="size-16 rounded-[14px] object-cover mx-auto ring-2 ring-[var(--pc-border)]" />
						{:else}
							<div class="size-16 rounded-[14px] bg-[var(--pc-surface-2)] border border-[var(--pc-border)] mx-auto grid place-items-center">
								<ImagePlus size={20} weight="Outline" class="text-[var(--pc-text-faint)]" />
							</div>
						{/if}
						<p class="mt-3 text-[16px] font-700">{productName || 'Your product'}</p>
						<p class="mt-1 text-xs text-[var(--pc-text-muted)]">{tagline || 'Your tagline goes here'}</p>
						{#if category}
							<span class="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium" style:background="rgba(119, 152, 18, 0.15)" style:color="rgb(119, 152, 18)">{category}</span>
						{/if}
						{#if launchDate}
							<p class="mt-2 text-xs text-[var(--pc-text-faint)]">Launches {new Date(launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
						{/if}
					</div>
				</div>

				<div class="pc-bezel p-1.5">
					<div class="pc-bezel-inner p-4 bg-[var(--pc-surface)]">
						<h3 class="text-sm font-medium tracking-tight">Launch checklist</h3>
						<ul class="mt-2 space-y-2">
							{#each [
								{ label: 'Product name', done: productName.length > 0 },
								{ label: 'Tagline', done: tagline.length > 0 },
								{ label: 'Category', done: category.length > 0 },
								{ label: 'Logo', done: logoUrl.length > 0 },
								{ label: 'Launch date', done: launchDate.length > 0 },
								{ label: 'Description', done: launchDesc.length > 0 }
							] as item}
								<li class="flex items-center gap-2 text-xs">
									<span class={[
										'size-4 rounded-full grid place-items-center text-[10px] shrink-0',
										item.done ? 'bg-[var(--green-6)] text-white' : 'bg-[var(--pc-surface-2)] border border-[var(--pc-border)] text-[var(--pc-text-faint)]'
									].join(' ')}>
										{item.done ? '✓' : ''}
									</span>
									<span class={item.done ? 'text-[var(--pc-text)]' : 'text-[var(--pc-text-muted)]'}>{item.label}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		</div>

	{:else}
		<!-- ═══════ LAUNCH CREATED ═══════ -->
		<div class="mt-6 max-w-[480px] mx-auto text-center pc-enter">
			<div class="pc-bezel p-2">
				<div class="pc-bezel-inner p-8 bg-[var(--pc-surface)]">
					<div class="grid size-14 place-items-center rounded-full bg-[var(--green-6)]/15 mx-auto">
						<Rocket size={24} weight="Outline" color="var(--green-7)" />
					</div>
					<h2 class="mt-4 text-[20px] font-800 tracking-tight">Pre-launch page created!</h2>
					<p class="mt-2 text-sm text-[var(--pc-text-muted)]">
						<strong>{productName}</strong> now has a waitlist page. Share the link to start collecting signups.
					</p>

					<!-- Embed badge -->
					<div class="mt-6 p-3 rounded-[12px] border border-[var(--pc-border)] bg-[var(--pc-surface-2)] text-left">
						<p class="text-xs font-700 uppercase tracking-wide text-[var(--pc-text-faint)]">Embed badge for your site</p>
						<pre class="mt-2 text-xs leading-4 text-[var(--pc-text-muted)] break-all">&lt;iframe src="/badge/{createdSlug}" width="300" height="65" frameborder="0" style="border:none;border-radius:12px;overflow:hidden;"&gt;&lt;/iframe&gt;</pre>
					</div>

					<div class="mt-6 flex flex-col gap-2">
						<button onclick={goToLaunch} class="pc-btn-primary py-3">
							View pre-launch page <span class="pc-btn-icon">→</span>
						</button>
						<button onclick={() => { submitted = false; mode = 'update'; }} class="pc-btn-ghost py-3">
							Post an update instead
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
