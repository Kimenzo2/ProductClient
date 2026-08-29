export type OnboardingRole = 'Product manager' | 'Developer' | 'Builder' | 'Customer support' | 'Team lead';

export type OnboardingDraft = {
	name: string;
	workspaceName: string;
	role: OnboardingRole | '';
};

const storageKey = 'product-client:onboarding-draft';

export const emptyOnboardingDraft: OnboardingDraft = {
	name: '',
	workspaceName: '',
	role: ''
};

export function readOnboardingDraft(): OnboardingDraft {
	if (typeof localStorage === 'undefined') return { ...emptyOnboardingDraft };
	try {
		const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<OnboardingDraft>;
		return {
			name: typeof saved.name === 'string' ? saved.name : '',
			workspaceName: typeof saved.workspaceName === 'string' ? saved.workspaceName : '',
			role: saved.role ?? ''
		};
	} catch {
		return { ...emptyOnboardingDraft };
	}
}

export function saveOnboardingDraft(patch: Partial<OnboardingDraft>): OnboardingDraft {
	const next = { ...readOnboardingDraft(), ...patch };
	if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, JSON.stringify(next));
	return next;
}

export function clearOnboardingDraft(): void {
	if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey);
}
