/**
 * Lightweight dark mode — replaces mode-watcher to avoid SvelteKit 3 SSR conflict
 * where mode-watcher's inline <script> swallows CSS <link> tags during server render.
 */
export type Theme = 'dark' | 'light' | 'system';

export function getTheme(): Theme {
	if (typeof window === 'undefined') return 'dark';
	return (localStorage.getItem('theme') as Theme) || 'dark';
}

export function setTheme(theme: Theme): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem('theme', theme);
	applyTheme(theme);
}

export function toggleTheme(): void {
	const current = getTheme();
	const next: Theme = current === 'dark' ? 'light' : 'dark';
	setTheme(next);
}

function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') return;
	let resolved = theme;
	if (theme === 'system') {
		resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	document.documentElement.className = resolved;
	document.documentElement.style.colorScheme = resolved;
}
