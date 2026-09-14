-- Canonical GitHub contract across ProductClient surfaces.
-- One GitHub App installation may serve many products, but every write is
-- resolved through the active product's source/context link.

create table if not exists public.github_contract_meta (
  id boolean primary key default true check (id),
  contract_id text not null,
  schema_version integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.github_contract_meta (id, contract_id, schema_version)
values (true, 'productclient.github.v1', 1)
on conflict (id) do update set contract_id = excluded.contract_id,
  schema_version = excluded.schema_version,
  updated_at = now();

alter table public.github_repo_links
  add column if not exists deploy_branch text,
  add column if not exists sync_status text not null default 'idle',
  add column if not exists sync_error_code text;
alter table public.github_repo_links
  drop constraint if exists github_repo_links_role_check;
alter table public.github_repo_links
  add constraint github_repo_links_role_check check (role in ('source', 'context'));
alter table public.github_repo_links
  drop constraint if exists github_repo_links_product_role_key;

create unique index if not exists github_repo_links_one_source_per_product_idx
  on public.github_repo_links (product_id)
  where role = 'source';
create unique index if not exists github_repo_links_context_repo_idx
  on public.github_repo_links (product_id, repo_full_name)
  where role = 'context';

alter table public.github_sync_runs
  add column if not exists delivery_id text,
  add column if not exists details jsonb not null default '{}'::jsonb;
create unique index if not exists github_sync_runs_delivery_idx
  on public.github_sync_runs (delivery_id)
  where delivery_id is not null;

alter table public.feedback_items
  add column if not exists github_issue_url text,
  add column if not exists github_issue_number integer,
  add column if not exists github_repo_full_name text;
create index if not exists feedback_items_github_issue_idx
  on public.feedback_items (github_repo_full_name, github_issue_number)
  where github_issue_number is not null;

alter table public.products
  add column if not exists github_url text;
alter table public.products
  drop constraint if exists products_github_url_check;
alter table public.products
  add constraint products_github_url_check
  check (github_url is null or github_url ~ '^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$');

alter table public.releases
  add column if not exists github_release_id bigint,
  add column if not exists github_release_url text,
  add column if not exists github_repo_full_name text;
create unique index if not exists releases_github_release_idx
  on public.releases (github_repo_full_name, github_release_id)
  where github_release_id is not null;

create table if not exists public.incident_github_links (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  kind text not null check (kind in ('pull_request', 'issue')),
  url text not null,
  repo_full_name text not null,
  number integer not null check (number > 0),
  title text,
  state text,
  merged boolean,
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (incident_id, url)
);

create index if not exists incident_github_links_incident_idx
  on public.incident_github_links (incident_id, created_at desc);
create index if not exists incident_github_links_repo_number_idx
  on public.incident_github_links (repo_full_name, number);

alter table public.incident_github_links enable row level security;
alter table public.incident_github_links force row level security;
drop policy if exists incident_github_links_member_select on public.incident_github_links;
create policy incident_github_links_member_select on public.incident_github_links
  for select to authenticated
  using (exists (
    select 1 from public.incidents
    where incidents.id = incident_github_links.incident_id
      and public.user_can_access_tenant(incidents.tenant_id)
  ));
drop policy if exists incident_github_links_manager_write on public.incident_github_links;
create policy incident_github_links_manager_write on public.incident_github_links
  for all to authenticated
  using (exists (
    select 1 from public.incidents
    where incidents.id = incident_github_links.incident_id
      and public.user_can_manage_tenant(incidents.tenant_id)
  ))
  with check (exists (
    select 1 from public.incidents
    where incidents.id = incident_github_links.incident_id
      and public.user_can_manage_tenant(incidents.tenant_id)
  ));
grant select, insert, update, delete on public.incident_github_links to authenticated;

create table if not exists public.github_audit_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  repo_full_name text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists github_audit_events_product_created_idx
  on public.github_audit_events (product_id, created_at desc);

alter table public.github_installations enable row level security;
alter table public.github_repo_links enable row level security;
alter table public.github_sync_runs enable row level security;
alter table public.github_audit_events enable row level security;
revoke all on public.github_contract_meta from anon, authenticated;
revoke all on public.github_audit_events from anon, authenticated;
grant all on public.github_audit_events to service_role;

-- Immutable generated release artifacts. The Starter Kit consumes the same
-- canonical document and digest at the edge; these rows make the exact output
-- auditable and reproducible from ProductClient.
create table if not exists public.docs_release_artifacts (
  release_id uuid primary key references public.docs_releases(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  schema_version integer not null default 1,
  content_digest text not null check (content_digest ~ '^[0-9a-f]{64}$'),
  markdown text not null,
  llms_txt text not null,
  skill_md text not null,
  mcp_json jsonb not null check (jsonb_typeof(mcp_json) = 'object'),
  sitemap_xml text not null,
  created_at timestamptz not null default now()
);
create index if not exists docs_release_artifacts_tenant_created_idx
  on public.docs_release_artifacts (tenant_id, created_at desc);
alter table public.docs_release_artifacts enable row level security;
alter table public.docs_release_artifacts force row level security;
revoke all on public.docs_release_artifacts from anon, authenticated;
grant select on public.docs_release_artifacts to authenticated;
drop policy if exists docs_release_artifacts_member_select on public.docs_release_artifacts;
create policy docs_release_artifacts_member_select on public.docs_release_artifacts
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
