-- GitHub App installation and repository-link contract.
-- These tables are server-owned: browser clients must use the authenticated
-- ProductClient API routes, which enforce maker/product ownership.

create table if not exists public.github_installations (
  installation_id bigint primary key,
  account_login text not null,
  account_type text not null default 'User',
  account_id bigint,
  maker_id uuid not null references auth.users(id) on delete cascade,
  raw jsonb,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_installations_account_type_check
    check (account_type in ('User', 'Organization'))
);

create index if not exists github_installations_maker_idx
  on public.github_installations (maker_id, updated_at desc);

create table if not exists public.github_repo_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  installation_id bigint not null references public.github_installations(installation_id) on delete cascade,
  repo_full_name text not null,
  role text not null default 'source',
  branch text not null default 'main',
  docs_path text not null default '/',
  last_sha text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_repo_links_role_check check (role in ('source')),
  constraint github_repo_links_product_role_key unique (product_id, role)
);

create index if not exists github_repo_links_installation_idx
  on public.github_repo_links (installation_id);
create index if not exists github_repo_links_repo_idx
  on public.github_repo_links (repo_full_name, branch);

create table if not exists public.github_sync_runs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  event text not null,
  sha text,
  ok boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists github_sync_runs_product_created_idx
  on public.github_sync_runs (product_id, created_at desc);

alter table public.github_installations enable row level security;
alter table public.github_repo_links enable row level security;
alter table public.github_sync_runs enable row level security;

revoke all on table public.github_installations from anon, authenticated;
revoke all on table public.github_repo_links from anon, authenticated;
revoke all on table public.github_sync_runs from anon, authenticated;
grant all on table public.github_installations to service_role;
grant all on table public.github_repo_links to service_role;
grant all on table public.github_sync_runs to service_role;
