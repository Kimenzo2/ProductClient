import { defineEnvVars } from '@sveltejs/kit/env';

// Explicit server secrets (Kit 3 explicit env). Empty-string fallback is
// intentional: every consumer throws its own "missing X" error at use-site,
// so a missing variable fails loudly where it matters instead of at boot.
export const variables = defineEnvVars({
	CLOUDFLARE_ACCOUNT_ID: { schema: (input) => input ?? '' },
	CLOUDFLARE_D1_DATABASE_ID: { schema: (input) => input ?? '' },
	CLOUDFLARE_API_TOKEN: { schema: (input) => input ?? '' },
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true },
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_DEV_AUTH_BYPASS: { public: true, schema: (input) => input ?? '' },
	SUPABASE_SECRET_KEY: { schema: (input) => input ?? '' },
	SUPABASE_SECRET_API_KEY: { schema: (input) => input ?? '' },
	SUPABASE_SERVICE_ROLE_KEY: { schema: (input) => input ?? '' },
	GITHUB_APP_ID: { schema: (input) => input ?? '' },
	GITHUB_APP_PRIVATE_KEY: { schema: (input) => input ?? '' },
	GITHUB_APP_WEBHOOK_SECRET: { schema: (input) => input ?? '' },
	GITHUB_APP_SLUG: { schema: (input) => input ?? '' },
	GITHUB_STATE_SECRET: { schema: (input) => input ?? '' },
	GITHUB_APP_INSTALL_URL: { schema: (input) => input ?? '' },
	GITHUB_KIT_TEMPLATE_INSTALLATION_ID: { schema: (input) => input ?? '' },
	GITHUB_KIT_TEMPLATE_DOCS: { schema: (input) => input ?? '' },
	GITHUB_KIT_TEMPLATE_ROADMAP: { schema: (input) => input ?? '' },
	GITHUB_KIT_TEMPLATE_STATUS: { schema: (input) => input ?? '' }
});
