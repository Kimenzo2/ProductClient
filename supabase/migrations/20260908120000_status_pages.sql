-- Customer-facing status content.
-- Supabase is the authenticated source of truth; the Status Page Worker keeps
-- a D1 edge mirror for fast public reads.
create table if not exists public.status_pages (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  tenant_slug text not null unique,
  page_title text not null,
  page_description text not null,
  services jsonb not null default '[]'::jsonb,
  incidents jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);

create index if not exists status_pages_slug_idx on public.status_pages(tenant_slug);

alter table public.status_pages enable row level security;

drop policy if exists status_pages_owner_select on public.status_pages;
create policy status_pages_owner_select on public.status_pages
  for select to authenticated
  using (exists (
    select 1 from public.tenants
    where tenants.id = status_pages.tenant_id
      and tenants.owner_id = auth.uid()
  ));

drop policy if exists status_pages_owner_insert on public.status_pages;
create policy status_pages_owner_insert on public.status_pages
  for insert to authenticated
  with check (exists (
    select 1 from public.tenants
    where tenants.id = status_pages.tenant_id
      and tenants.owner_id = auth.uid()
  ));

drop policy if exists status_pages_owner_update on public.status_pages;
create policy status_pages_owner_update on public.status_pages
  for update to authenticated
  using (exists (
    select 1 from public.tenants
    where tenants.id = status_pages.tenant_id
      and tenants.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.tenants
    where tenants.id = status_pages.tenant_id
      and tenants.owner_id = auth.uid()
  ));
