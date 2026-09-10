import { browser } from '$app/environment';

export type AnalyticsRange = '7d' | '30d' | '90d';

let _range = $state<AnalyticsRange>('7d');

export const analyticsRange = {
	get value() { return _range; },
	set value(v: AnalyticsRange) {
		_range = v;
		if (browser) {
			try { localStorage.setItem('pc-analytics-range', v); } catch {}
		}
	}
};

if (browser) {
	try {
		const saved = localStorage.getItem('pc-analytics-range') as AnalyticsRange | null;
		if (saved && ['7d','30d','90d'].includes(saved)) _range = saved;
	} catch {}
}

export function rangeToDays(range: AnalyticsRange): number {
	return range === '7d' ? 7 : range === '30d' ? 30 : 90;
}

export function rangeLabel(range: AnalyticsRange): string {
	return range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days';
}
