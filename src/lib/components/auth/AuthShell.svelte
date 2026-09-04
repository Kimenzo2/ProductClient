<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { ArrowRight, BookOpen, Building, ChartBar, CheckCircle, MessageDots, Users } from 'reicon-svelte';

	let { children }: { children: Snippet } = $props();

	let pathname = $derived(page.url.pathname);
	let onboardingStep = $derived(
		pathname === '/onboarding/profile' ? 1 : pathname === '/onboarding/workspace' ? 2 : pathname === '/onboarding/role' ? 3 : pathname === '/onboarding/complete' ? 4 : 0
	);
	let storyKicker = $derived(onboardingStep ? `Setup step ${onboardingStep} of 4` : 'Product Client');
	let storyTitle = $derived(
		onboardingStep === 1
			? 'Start with the person doing the work.'
			: onboardingStep === 2
				? 'Give the work a clear home.'
				: onboardingStep === 3
					? 'Begin with the view that fits your day.'
					: onboardingStep === 4
						? 'A better product conversation starts here.'
						: 'A clear place for product work.'
	);
	let storyBody = $derived(
		onboardingStep === 1
			? 'Your name helps teammates know who is collecting feedback and making decisions.'
			: onboardingStep === 2
				? 'Keep customer requests, decisions, updates, and service work together.'
				: onboardingStep === 3
					? 'Product Client can start you with the work you handle most often.'
					: onboardingStep === 4
						? 'You can change these details later. The work stays connected as your team grows.'
						: 'Bring feedback, decisions, releases, docs, and service response into one working view.'
	);
</script>

<div class="auth-root">
	<div class="auth-frame">
		<section class="auth-form-pane">
			<main id="main" class="auth-form-content">
				{@render children()}
			</main>
		</section>

		<aside class="auth-story" aria-labelledby="auth-story-title">
			<div class="story-visual" aria-hidden="true">
				<div class="visual-topline"><span>Product Client</span><span class="visual-live"><span class="status-dot"></span>Live workspace</span></div>
				{#if !onboardingStep}
					<div class="flow-board">
						<div class="flow-board-heading"><span class="visual-icon"><MessageDots size={15} weight="Outline" /></span><span>Customer feedback</span><span class="visual-count">18</span></div>
						<div class="flow-line"><span class="flow-avatar avatar-one">M</span><span><b>Make exports easier to understand</b><small>Customer request · 2 hours ago</small></span><span class="flow-pill">Needs context</span></div>
						<div class="flow-line"><span class="flow-avatar avatar-two">R</span><span><b>Faster file uploads</b><small>Linked to a product update</small></span><span class="flow-check"><CheckCircle size={15} weight="Outline" /></span></div>
						<div class="flow-line"><span class="flow-avatar avatar-three">T</span><span><b>Clearer API examples</b><small>Ready for a decision</small></span><span class="flow-arrow"><ArrowRight size={15} weight="Outline" /></span></div>
					</div>
					<div class="flow-footer"><span><ChartBar size={14} weight="Outline" /> Product signal</span><span>One connected record</span></div>
				{:else if onboardingStep === 1}
					<div class="profile-board">
						<div class="profile-avatar"><Users size={24} weight="Outline" /></div>
						<div class="profile-name">Your name</div>
						<div class="profile-handle">Your product workspace</div>
						<div class="profile-rule"></div>
						<div class="profile-row"><MessageDots size={15} weight="Outline" /><span>Customer feedback</span></div>
						<div class="profile-row"><BookOpen size={15} weight="Outline" /><span>Help docs</span></div>
					</div>
				{:else if onboardingStep === 2}
					<div class="workspace-board">
						<div class="workspace-title"><span class="visual-icon"><Building size={15} weight="Outline" /></span><span>Your workspace</span></div>
						<div class="workspace-columns"><span></span><span></span><span></span></div>
						<div class="workspace-row"><span class="row-dot row-green"></span><span>Customer feedback</span><span class="row-number">06</span></div>
						<div class="workspace-row"><span class="row-dot row-blue"></span><span>Product decisions</span><span class="row-number">03</span></div>
						<div class="workspace-row"><span class="row-dot row-orange"></span><span>Product updates</span><span class="row-number">09</span></div>
					</div>
				{:else if onboardingStep === 3}
					<div class="role-board">
						<div class="role-title"><span class="visual-icon"><Users size={15} weight="Outline" /></span><span>Your starting view</span></div>
						<div class="role-selected"><span class="role-check"><CheckCircle size={15} weight="Outline" /></span><span><b>Product manager</b><small>Decisions, feedback, and progress</small></span></div>
						<div class="role-option"><span class="role-empty"></span><span><b>Builder</b><small>Work that is ready to ship</small></span></div>
						<div class="role-option"><span class="role-empty"></span><span><b>Customer support</b><small>Requests and service response</small></span></div>
					</div>
				{:else}
					<div class="ready-board">
						<div class="ready-icon"><CheckCircle size={23} weight="Outline" /></div>
						<div class="ready-title">Workspace ready</div>
						<div class="ready-subtitle">Feedback can now become a decision.</div>
						<div class="ready-line"><span></span><span></span><span></span></div>
						<div class="ready-line short"><span></span><span></span></div>
					</div>
				{/if}
			</div>

			<div class="auth-story-copy">
				
				<h2 id="auth-story-title">{storyTitle}</h2>
				<p>{storyBody}</p>
			</div>
		</aside>
	</div>

</div>

<style>
	:global(html:has(.auth-root)), :global(body:has(.auth-root)) { overflow: hidden; }
	.auth-root { width: 100%; height: 100dvh; min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr); overflow: hidden; background: radial-gradient(circle at 73% 12%, rgba(119, 152, 18, .08), transparent 28rem), var(--pc-bg); color: var(--pc-text); }
	.status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 999px; background: var(--pc-accent-light); box-shadow: 0 0 0 4px rgba(119, 152, 18, .12); }
	.auth-frame { width: 100%; min-height: 0; height: auto; margin: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); overflow: hidden; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
	.auth-form-pane { display: grid; place-items: center; min-width: 0; min-height: 0; overflow: hidden; background: rgba(7, 7, 7, .74); }
	.auth-form-content { display: flex; flex-direction: column; justify-content: center; width: min(100%, 520px); height: 100%; max-height: 100%; box-sizing: border-box; padding: clamp(20px, 5vh, 56px) clamp(22px, 6vw, 76px); overflow: hidden; }
	.auth-story { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; min-height: 0; padding: clamp(24px, 5vh, 64px) clamp(28px, 5vw, 72px); overflow: hidden; background: radial-gradient(circle at 55% 40%, rgba(251, 251, 251, .06), transparent 33rem), rgba(251, 251, 251, .025); }
	.auth-story::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18; background-image: radial-gradient(rgba(255, 255, 255, .24) .55px, transparent .55px); background-size: 5px 5px; mask-image: linear-gradient(to bottom, transparent, black 30%, transparent 82%); }
	.story-visual, .auth-story-copy { position: relative; z-index: 1; }
	.story-visual { min-height: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
	.visual-topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; color: var(--pc-text-faint); font-size: 11px; letter-spacing: .03em; }
	.visual-live { display: inline-flex; align-items: center; gap: 8px; }
	.flow-board, .profile-board, .workspace-board, .role-board, .ready-board { width: min(100%, 470px); margin-inline: auto; border: 1px solid rgba(251, 251, 251, .095); background: rgba(251, 251, 251, .045); box-shadow: inset 0 1px 0 rgba(251, 251, 251, .04), 0 22px 60px rgba(0, 0, 0, .18); }
	.flow-board { padding: 15px; border-radius: 20px; transform: rotate(-2deg); }
	.flow-board-heading, .workspace-title, .role-title { display: flex; align-items: center; gap: 9px; color: var(--pc-text); font-size: 12px; font-weight: 600; }
	.visual-icon { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 9px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .13); }
	.visual-count, .row-number { margin-inline-start: auto; color: var(--pc-text-faint); font: 11px var(--font-mono); }
	.flow-line { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; gap: 10px; margin-top: 11px; padding-top: 11px; border-top: 1px solid rgba(251, 251, 251, .07); }
	.flow-line b { display: block; overflow: hidden; color: var(--pc-text); font-size: 11px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
	.flow-line small, .role-board small { display: block; margin-top: 3px; overflow: hidden; color: var(--pc-text-faint); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
	.flow-avatar { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: #111; font-size: 10px; font-weight: 700; }
	.avatar-one { background: #d4c58d; }.avatar-two { background: #9ac7b8; }.avatar-three { background: #c2aed7; }
	.flow-pill { padding: 5px 7px; border-radius: 999px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .12); font-size: 9px; white-space: nowrap; }
	.flow-check { color: var(--pc-accent-light); }.flow-arrow { color: var(--pc-text-muted); }
	.flow-footer { display: flex; justify-content: space-between; gap: 12px; width: min(100%, 410px); margin: 20px auto 0; color: var(--pc-text-faint); font-size: 10px; }.flow-footer span { display: inline-flex; align-items: center; gap: 6px; }
	.profile-board { width: min(100%, 300px); padding: 28px; border-radius: 22px; text-align: center; transform: rotate(2deg); }.profile-avatar { display: grid; place-items: center; width: 62px; height: 62px; margin: 0 auto 14px; border: 1px solid rgba(198, 254, 30, .28); border-radius: 50%; color: var(--pc-accent-light); background: rgba(119, 152, 18, .14); }.profile-name { font-size: 16px; font-weight: 500; }.profile-handle { margin-top: 4px; color: var(--pc-text-faint); font-size: 11px; }.profile-rule { height: 1px; margin: 24px 0 15px; background: rgba(251, 251, 251, .08); }.profile-row { display: flex; align-items: center; gap: 9px; padding: 10px 0; color: var(--pc-text-muted); font-size: 11px; text-align: start; }.profile-row + .profile-row { border-top: 1px solid rgba(251, 251, 251, .06); }
	.workspace-board { width: min(100%, 360px); padding: 16px; border-radius: 20px; transform: rotate(-1.5deg); }.workspace-columns { display: grid; grid-template-columns: 1.4fr .8fr .55fr; gap: 8px; margin-top: 23px; }.workspace-columns span, .ready-line span { height: 5px; border-radius: 99px; background: rgba(251, 251, 251, .11); }.workspace-row { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; align-items: center; gap: 9px; padding: 16px 0 10px; color: var(--pc-text-muted); font-size: 11px; }.workspace-row + .workspace-row { border-top: 1px solid rgba(251, 251, 251, .06); }.row-dot { width: 8px; height: 8px; border-radius: 50%; }.row-green { background: #a8d86e; }.row-blue { background: #91bde4; }.row-orange { background: #d9a16d; }
	.role-board { width: min(100%, 360px); padding: 16px; border-radius: 20px; transform: rotate(1.5deg); }.role-selected, .role-option { display: grid; grid-template-columns: 25px minmax(0, 1fr); align-items: center; gap: 10px; margin-top: 12px; padding: 13px; border-radius: 13px; }.role-selected { border: 1px solid rgba(198, 254, 30, .2); background: rgba(119, 152, 18, .12); }.role-option { border: 1px solid rgba(251, 251, 251, .06); }.role-selected b, .role-option b { display: block; font-size: 11px; font-weight: 500; }.role-check { color: var(--pc-accent-light); }.role-empty { width: 15px; height: 15px; border: 1px solid rgba(251, 251, 251, .22); border-radius: 50%; }
	.ready-board { width: min(100%, 340px); padding: 31px; border-radius: 22px; text-align: center; transform: rotate(-1deg); }.ready-icon { display: grid; place-items: center; width: 54px; height: 54px; margin: 0 auto 17px; border-radius: 17px; color: var(--pc-accent-light); background: rgba(119, 152, 18, .14); }.ready-title { font-size: 16px; font-weight: 500; }.ready-subtitle { margin-top: 5px; color: var(--pc-text-faint); font-size: 11px; }.ready-line { display: flex; gap: 7px; margin: 24px auto 0; width: 150px; }.ready-line.short { margin-top: 8px; width: 103px; }.ready-line span { flex: 1; }
	.auth-story-copy { max-width: 470px; margin-inline: auto; padding-top: 28px; }.auth-story-copy h2 { max-width: 12ch; margin: 0; color: var(--pc-text); font-size: clamp(25px, 3vw, 39px); font-weight: 500; line-height: 1.06; letter-spacing: -.055em; }.auth-story-copy p:last-child { max-width: 43ch; margin: 15px 0 0; color: var(--pc-text-muted); font-size: 13px; line-height: 1.65; }
	@media (max-width: 820px) { .auth-frame { display: block; }.auth-form-pane { min-height: 0; }.auth-form-content { padding: 24px 20px 30px; }.auth-story { display: none; } }
	@media (max-height: 700px) and (min-width: 821px) { .auth-form-content { padding-block: 18px; }.auth-story { padding-block: 22px; }.auth-story-copy { padding-top: 16px; }.auth-story-copy h2 { font-size: clamp(24px, 3vw, 32px); }:global(.progress) { margin-bottom: 22px; }:global(.onboarding-intro) { margin-bottom: 18px; }:global(.auth-page) { gap: 16px; }:global(.auth-page form) { gap: 12px; } }
	@media (prefers-reduced-motion: reduce) { .flow-board, .profile-board, .workspace-board, .role-board, .ready-board { transform: none; } }
</style>
