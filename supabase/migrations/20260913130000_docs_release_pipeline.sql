-- Documentation release pipeline.
-- Drafts remain mutable; releases are immutable and publication state is explicit.

alter table public.docs_documents
  add column if not exists publication_state text not null default 'unpublished',
  add column if not exists publication_error text,
  add column if not exists publication_attempted_at timestamptz,
  add column if not exists published_hash text,
  add column if not exists published_release_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'docs_documents_publication_state_check'
  ) then
    alter table public.docs_documents
      add constraint docs_documents_publication_state_check
      check (publication_state in ('unpublished', 'syncing', 'published', 'failed'));
  end if;
end $$;

update public.docs_documents
set publication_state = 'published'
where published is not null and publication_state = 'unpublished';

create table if not exists public.docs_releases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  version bigint not null,
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  published_at timestamptz not null,
  published_by uuid references auth.users(id),
  rollback_of_version bigint,
  created_at timestamptz not null default now(),
  unique (tenant_id, version)
);

create index if not exists docs_releases_tenant_created_idx on public.docs_releases(tenant_id, created_at desc);
create index if not exists docs_releases_tenant_hash_idx on public.docs_releases(tenant_id, content_hash);

create table if not exists public.docs_redirects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  from_path text not null,
  to_path text not null,
  release_id uuid references public.docs_releases(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, from_path),
  check (from_path like '/%' and from_path not like '//%'),
  check (to_path like '/%' and to_path not like '//%')
);

create index if not exists docs_redirects_tenant_idx on public.docs_redirects(tenant_id, created_at desc);

create table if not exists public.docs_publication_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  release_id uuid references public.docs_releases(id) on delete set null,
  version bigint not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('pending', 'succeeded', 'failed')),
  error_code text,
  error_message text,
  attempted_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (tenant_id, version, attempted_at)
);

create index if not exists docs_publication_attempts_tenant_idx on public.docs_publication_attempts(tenant_id, attempted_at desc);

create table if not exists public.docs_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  release_id uuid references public.docs_releases(id) on delete set null,
  version bigint,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists docs_audit_events_tenant_created_idx on public.docs_audit_events(tenant_id, created_at desc);

alter table public.docs_releases enable row level security;
alter table public.docs_releases force row level security;
alter table public.docs_publication_attempts enable row level security;
alter table public.docs_publication_attempts force row level security;

revoke all on table public.docs_releases from anon, authenticated;
revoke all on table public.docs_publication_attempts from anon, authenticated;
revoke all on table public.docs_redirects from anon, authenticated;
revoke all on table public.docs_audit_events from anon, authenticated;
grant select on table public.docs_releases to authenticated;
grant select on table public.docs_publication_attempts to authenticated;
grant select on table public.docs_redirects to authenticated;
grant select on table public.docs_audit_events to authenticated;

drop policy if exists docs_releases_member_select on public.docs_releases;
create policy docs_releases_member_select on public.docs_releases
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));

drop policy if exists docs_publication_attempts_member_select on public.docs_publication_attempts;
create policy docs_publication_attempts_member_select on public.docs_publication_attempts
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));

drop policy if exists docs_redirects_member_select on public.docs_redirects;
create policy docs_redirects_member_select on public.docs_redirects
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));

drop policy if exists docs_audit_events_member_select on public.docs_audit_events;
create policy docs_audit_events_member_select on public.docs_audit_events
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
