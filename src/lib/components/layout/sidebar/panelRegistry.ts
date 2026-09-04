import type { PanelDef } from './types';
import { docsPanel } from './panels/docs';
import { incidentsPanel } from './panels/incidents';
import { feedbackPanel } from './panels/feedback';
import { productsPanel } from './panels/products';
import { releasesPanel } from './panels/releases';
import { decisionsPanel } from './panels/decisions';
import { roadmapPanel } from './panels/roadmap';
import { proofPanel } from './panels/proof';
import { inboxPanel } from './panels/inbox';
import { analyticsPanel } from './panels/analytics';

// Central registry — Sidebar.svelte imports only this file.
// Each panel is a separate module so adding navigation for one route does not bloat the others.

export const panelRegistry: Record<string, PanelDef> = {
	'/workspace/docs': docsPanel,
	'/workspace/incidents': incidentsPanel,
	'/workspace/feedback': feedbackPanel,
	'/workspace/products': productsPanel,
	'/workspace/releases': releasesPanel,
	'/workspace/decisions': decisionsPanel,
	'/workspace/roadmap': roadmapPanel,
	'/workspace/proof': proofPanel,
	'/workspace/inbox': inboxPanel,
	'/workspace/analytics': analyticsPanel
};
