-- Product-owned starter-kit provisioning and Cloudflare-first GitHub mirroring.
-- A tenant may own more than one product; each product gets one repository per kit.

alter table public.github_kit_repositories
  alter column installation_id drop not null,
  alter column repo_full_name drop not null;

alter table public.github_kit_repositories
  drop constraint if exists github_kit_repositories_tenant_id_kit_key;

create unique index if not exists github_kit_repositories_product_kit_idx
  on public.github_kit_repositories (product_id, kit);

alter table public.github_kit_repositories
  add column if not exists repository_id bigint,
  add column if not exists managed boolean not null default false,
  add column if not exists template_repo text,
  add column if not exists template_sha text,
  add column if not exists provision_status text not null default 'manual',
  add column if not exists provision_error text,
  add column if not exists provisioned_at timestamptz,
  add column if not exists last_cloudflare_release_id uuid,
  add column if not exists last_cloudflare_content_hash text,
  add column if not exists github_sync_status text not null default 'idle',
  add column if not exists github_sync_error text,
  add column if not exists github_sync_attempted_at timestamptz,
  add column if not exists github_synced_at timestamptz;

alter table public.github_kit_repositories
  drop constraint if exists github_kit_repositories_provision_status_check,
  drop constraint if exists github_kit_repositories_github_sync_status_check;

alter table public.github_kit_repositories
  add constraint github_kit_repositories_provision_status_check
    check (provision_status in ('manual', 'pending', 'awaiting_authorization', 'provisioning', 'ready', 'failed')),
  add constraint github_kit_repositories_github_sync_status_check
    check (github_sync_status in ('idle', 'pending', 'syncing', 'synced', 'failed'));

update public.github_kit_repositories
set managed = false,
    provision_status = 'manual'
where managed is null;

create index if not exists github_kit_repositories_product_status_idx
  on public.github_kit_repositories (product_id, provision_status, kit);
create index if not exists github_kit_repositories_sync_status_idx
  on public.github_kit_repositories (product_id, github_sync_status, updated_at);

create table if not exists public.github_kit_provision_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'provisioning', 'ready', 'failed', 'awaiting_authorization')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create unique index if not exists github_kit_provision_jobs_open_idx
  on public.github_kit_provision_jobs (product_id)
  where status in ('pending', 'provisioning', 'awaiting_authorization');
create index if not exists github_kit_provision_jobs_tenant_idx
  on public.github_kit_provision_jobs (tenant_id, status, updated_at);

alter table public.github_kit_provision_jobs enable row level security;
alter table public.github_kit_provision_jobs force row level security;
drop policy if exists github_kit_provision_jobs_member_select on public.github_kit_provision_jobs;
create policy github_kit_provision_jobs_member_select on public.github_kit_provision_jobs
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
revoke all on table public.github_kit_provision_jobs from anon, authenticated;
grant select on table public.github_kit_provision_jobs to authenticated;

-- Durable outbox: Cloudflare is the publish authority. GitHub mirroring is
-- retryable work keyed by the immutable Cloudflare release.
create table if not exists public.github_kit_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  kit text not null check (kit in ('docs', 'roadmap', 'status')),
  release_id uuid not null,
  content_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'syncing', 'succeeded', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (tenant_id, kit, release_id)
);

create index if not exists github_kit_sync_jobs_ready_idx
  on public.github_kit_sync_jobs (status, updated_at);
create index if not exists github_kit_sync_jobs_product_idx
  on public.github_kit_sync_jobs (product_id, kit, status);

alter table public.github_kit_sync_jobs enable row level security;
alter table public.github_kit_sync_jobs force row level security;
drop policy if exists github_kit_sync_jobs_member_select on public.github_kit_sync_jobs;
create policy github_kit_sync_jobs_member_select on public.github_kit_sync_jobs
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
revoke all on table public.github_kit_sync_jobs from anon, authenticated;
grant select on table public.github_kit_sync_jobs to authenticated;
