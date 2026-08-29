<script lang="ts">
	import { Upload, Rocket, Sparkles, Calendar, Tag, Globe, ImagePlus, Check, ArrowRight } from 'reicon-svelte';
	import { Tabs } from 'bits-ui';
	import { goto } from '$app/navigation';
	import { Button, Card, Chip, Input, Label, Textarea } from '$lib/components/ui';

	let mode = $state<'update' | 'launch'>('update');

	let title = $state('');
	let type = $state('launch');
	let desc = $state('');

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
		'AI & Machine Learning', 'Developer Tools', 'Design & Creative',
		'Productivity', 'Cloud & Infrastructure', 'Finance & Payments',
		'Open Source', 'SaaS', 'Mobile', 'Other'
	];

	function submitLaunch() {
		const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		createdSlug = slug;
		submitted = true;
	}

	function goToLaunch() {
		goto(`/launch/${createdSlug}`);
	}

	const selectClass = 'mt-2 w-full rounded-[10px] bg-[var(--pc-surface)] px-3 py-2.5 text-[13px] outline-none appearance-none cursor-pointer transition-[background-color,box-shadow] duration-200 focus:ring-2 focus:ring-[var(--color-primary)]';
</script>

<svelte:head><title>Studio — Product Client</title></svelte:head>

<div class="w-full max-w-[883px] mx-auto px-6 max-sm:px-4">
	<h1 class="text-[22px] md:text-[26px] font-medium leading-none tracking-tight">Studio</h1>
	<p class="mt-2 text-[13px] text-[var(--pc-text-muted)] opacity-65">Post an update or launch a new product. Craft matters.</p>

	<!-- Mode tabs -->
	<Tabs.Root
		value={mode}
		onValueChange={(v) => { if (v) { mode = v as 'update' | 'launch'; submitted = false; } }}
		class="mt-5"
	>
		<Tabs.List class="inline-flex items-center gap-1 rounded-full bg-[var(--pc-surface-2)] p-1 w-fit">
			<Tabs.Trigger
				value="update"
				class="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--pc-text)] data-[state=active]:text-[var(--pc-bg)] data-[state=inactive]:text-[var(--pc-text-muted)] data-[state=inactive]:hover:text-[var(--pc-text)]"
			>
				<Sparkles size={14} weight="Outline" /> Post Update
			</Tabs.Trigger>
			<Tabs.Trigger
				value="launch"
				class="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-[background-color,color] duration-150 data-[state=active]:bg-[var(--pc-text)] data-[state=active]:text-[var(--pc-bg)] data-[state=inactive]:text-[var(--pc-text-muted)] data-[state=inactive]:hover:text-[var(--pc-text)]"
			>
				<Rocket size={14} weight="Outline" /> Launch Product
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	{#if mode === 'update'}
		<div class="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 pc-enter-stagger">
			<Card padding="lg">
				<Label for="pc-title">Title</Label>
				<Input id="pc-title" bind:value={title} placeholder="e.g., ChatGPT 6 – The most human launch yet" class="mt-2" />

				<div class="mt-4 grid grid-cols-2 gap-3">
					<div>
						<Label>Type (State)</Label>
						<select bind:value={type} class={selectClass}>
							<option value="launch">Launch</option>
							<option value="changelog">Changelog</option>
							<option value="incident">Incident</option>
							<option value="fix">Fix</option>
							<option value="event">Event</option>
						</select>
					</div>
					<div>
						<Label>Product</Label>
						<select class={selectClass}>
							<option>Bento</option><option>ChatGPT</option><option>Linear</option>
						</select>
					</div>
				</div>

				<div class="mt-4">
					<Label for="pc-desc">Description / Changelog (markdown)</Label>
					<Textarea id="pc-desc" bind:value={desc} rows={6} placeholder="Write a crafted changelog, incident note, or launch story..." class="mt-2" />
				</div>

				<div class="mt-4 rounded-[14px] border border-dashed border-[var(--pc-border-strong)] bg-[var(--pc-surface)] p-6 grid place-items-center text-center hover:border-[var(--pc-accent)] transition-colors">
					<Upload size={28} weight="Outline" class="opacity-50" />
					<p class="mt-2 text-[13px] font-medium">Attach media — drag & drop</p>
					<p class="text-xs text-[var(--pc-text-muted)] opacity-65">Images, video, or documents — max 50 MB</p>
					<Button variant="ghost" size="sm" class="mt-3">Select file</Button>
				</div>

				<div class="mt-6 flex gap-3">
					<Button variant="primary" class="flex-1 py-3">Publish update <ArrowRight size={14} weight="Outline" class="inline" /></Button>
					<Button variant="ghost" class="px-6 py-3">Save draft</Button>
				</div>
				<p class="mt-3 text-xs text-[var(--pc-text-faint)] opacity-50">Superforms + Zod validation will be wired to Supabase. This is UI-only preview.</p>
			</Card>

			<div class="space-y-4">
				<p class="text-xs font-medium tracking-widest uppercase text-[var(--pc-text-faint)] opacity-65">Preview</p>
				<Card padding="sm">
					<div class="aspect-[4/3] rounded-[10px] overflow-hidden bg-[var(--pc-surface)] grid place-items-center text-[var(--pc-text-muted)] text-[13px]">
						{#if title}{title}{:else}Your title preview{/if}
					</div>
					<p class="mt-3 text-[13px] font-medium line-clamp-2">{title || 'Untitled launch'}</p>
					<p class="text-xs text-[var(--pc-text-muted)] opacity-65">{type} — Just now — 0 reads</p>
				</Card>
				<Card padding="md">
					<h3 class="text-[13px] font-medium">Tips for craft</h3>
					<ul class="mt-2 text-xs leading-5 text-[var(--pc-text-muted)] opacity-65 list-disc pl-4">
						<li>Launch posts with clear changelogs perform 2.3x better.</li>
						<li>Use 16:9 thumbnail with bold type, 80ch max.</li>
						<li>Incidents: be transparent, include timeline + "resolved".</li>
					</ul>
				</Card>
			</div>
		</div>

	{:else if !submitted}
		<div class="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 pc-enter-stagger">
			<Card padding="lg">
				<Label for="pc-product-name">Product name</Label>
				<Input id="pc-product-name" bind:value={productName} placeholder="e.g., Bento" class="mt-2" />

				<div class="mt-4">
					<Label for="pc-tagline">Tagline</Label>
					<Input id="pc-tagline" bind:value={tagline} placeholder="e.g., Personal intelligence hub" class="mt-2" />
				</div>

				<div class="mt-4 grid grid-cols-2 gap-3">
					<div>
						<Label><Tag size={12} weight="Outline" class="inline" /> Category</Label>
						<select bind:value={category} class={selectClass}>
							<option value="">Select category...</option>
							{#each categories as cat, ci (ci)}<option value={cat}>{cat}</option>{/each}
						</select>
					</div>
					<div>
						<Label for="pc-date"><Calendar size={12} weight="Outline" class="inline" /> Launch date</Label>
						<input id="pc-date" type="date" bind:value={launchDate} class="{selectClass} !cursor-pointer" />
					</div>
				</div>

				<div class="mt-4">
					<Label for="pc-logo"><ImagePlus size={12} weight="Outline" class="inline" /> Logo URL</Label>
					<Input id="pc-logo" bind:value={logoUrl} placeholder="https://..." class="mt-2" />
				</div>

				<div class="mt-4">
					<Label for="pc-website"><Globe size={12} weight="Outline" class="inline" /> Website URL</Label>
					<Input id="pc-website" bind:value={websiteUrl} placeholder="https://..." class="mt-2" />
				</div>

				<div class="mt-4">
					<Label for="pc-launch-desc">Description</Label>
					<Textarea id="pc-launch-desc" bind:value={launchDesc} rows={4} placeholder="Tell people what you're building..." class="mt-2" />
				</div>

				<div class="mt-6 flex gap-3">
					<Button variant="primary" class="flex-1 py-3" onclick={submitLaunch}>Create pre-launch page <ArrowRight size={14} weight="Outline" class="inline" /></Button>
					<Button variant="ghost" class="px-6 py-3">Save draft</Button>
				</div>
				<p class="mt-3 text-xs text-[var(--pc-text-faint)] opacity-50">Creates a pre-launch waitlist page at /launch/{productName ? productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '{slug}'}</p>
			</Card>

			<div class="space-y-4">
				<p class="text-xs font-medium tracking-widest uppercase text-[var(--pc-text-faint)] opacity-65">Preview</p>
				<Card padding="lg" class="text-center">
					{#if logoUrl}
						<img src={logoUrl} alt="logo" class="size-16 rounded-[14px] object-cover mx-auto" />
					{:else}
						<div class="size-16 rounded-[14px] bg-[var(--pc-surface)] mx-auto grid place-items-center">
							<ImagePlus size={20} weight="Outline" class="opacity-40" />
						</div>
					{/if}
					<p class="mt-3 text-base font-medium">{productName || 'Your product'}</p>
					<p class="mt-1 text-xs text-[var(--pc-text-muted)] opacity-65">{tagline || 'Your tagline goes here'}</p>
					{#if category}
						<Chip variant="accent" size="xs" class="mt-2">{category}</Chip>
					{/if}
					{#if launchDate}
						<p class="mt-2 text-xs text-[var(--pc-text-faint)] opacity-55">Launches {new Date(launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
					{/if}
				</Card>

				<Card padding="md">
					<h3 class="text-[13px] font-medium">Launch checklist</h3>
					<ul class="mt-2 space-y-2">
						{#each [
							{ label: 'Product name', done: productName.length > 0 },
							{ label: 'Tagline', done: tagline.length > 0 },
							{ label: 'Category', done: category.length > 0 },
							{ label: 'Logo', done: logoUrl.length > 0 },
							{ label: 'Launch date', done: launchDate.length > 0 },
							{ label: 'Description', done: launchDesc.length > 0 }
						] as item, ci (ci)}
							<li class="flex items-center gap-2 text-xs">
								<span class={[
									'size-4 rounded-full grid place-items-center text-[10px] shrink-0',
									item.done ? 'bg-[var(--pc-accent)] text-white' : 'bg-[var(--pc-surface)] text-[var(--pc-text-faint)]'
								].join(' ')}>{#if item.done}<Check size={10} weight="Outline" />{/if}</span>
								<span class={item.done ? 'text-[var(--pc-text)]' : 'text-[var(--pc-text-muted)] opacity-65'}>{item.label}</span>
							</li>
						{/each}
					</ul>
				</Card>
			</div>
		</div>

	{:else}
		<div class="mt-6 max-w-[480px] mx-auto text-center pc-enter">
			<Card padding="lg" class="p-8">
				<div class="grid size-14 place-items-center rounded-full mx-auto" style:background="rgba(119, 152, 18, 0.12)">
					<span style:color="rgb(119, 152, 18)"><Rocket size={24} weight="Outline" /></span>
				</div>
				<h2 class="mt-4 text-lg font-medium">Pre-launch page created!</h2>
				<p class="mt-2 text-sm text-[var(--pc-text-muted)]">
					<strong>{productName}</strong> now has a waitlist page. Share the link to start collecting signups.
				</p>

				<div class="mt-6 p-3 rounded-[14px] bg-[var(--pc-surface)] text-left">
					<p class="text-xs font-medium uppercase tracking-wide text-[var(--pc-text-faint)] opacity-65">Embed badge for your site</p>
					<pre class="mt-2 text-xs leading-4 text-[var(--pc-text-muted)] break-all whitespace-pre-wrap overflow-hidden">{`<iframe src="/badge/${createdSlug}" width="300" height="65" frameborder="0" sandbox="allow-scripts" style="border:none;border-radius:12px;overflow:hidden;"></iframe>`}</pre>
				</div>

				<div class="mt-6 flex flex-col gap-2">
					<Button variant="primary" class="py-3" onclick={goToLaunch}>View pre-launch page <ArrowRight size={14} weight="Outline" class="inline" /></Button>
					<Button variant="ghost" class="py-3" onclick={() => { submitted = false; mode = 'update'; }}>Post an update instead</Button>
				</div>
			</Card>
		</div>
	{/if}
</div>
