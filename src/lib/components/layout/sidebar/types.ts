export type PanelLink = { label: string; href: string; icon?: any; badge?: number | string; external?: boolean };
export type PanelRecent = { label: string; href: string; subtitle?: string };

export type PanelDef = {
	label: string;
	// reicon-svelte icons are Svelte components — keep loose to avoid strict Component<> mismatch
	icon: any;
	description: string;
	links: PanelLink[];
	recent: PanelRecent[];
	action?: { label: string; href: string };
};
