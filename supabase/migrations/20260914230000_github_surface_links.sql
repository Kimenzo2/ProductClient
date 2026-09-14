-- Optional GitHub issue links for product-scoped roadmap items and incidents.
-- The server still verifies maker/product ownership; RLS protects direct reads.

create table if not exists public.roadmap_github_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  item_key text not null,
  kind text not null default 'issue' check (kind = 'issue'),
  url text not null,
  repo_full_name text not null,
  number integer not null check (number > 0),
  title text,
  state text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, item_key)
);

create index if not exists roadmap_github_links_product_idx
  on public.roadmap_github_links (product_id, updated_at desc);

alter table public.roadmap_github_links enable row level security;
alter table public.roadmap_github_links force row level security;
drop policy if exists roadmap_github_links_member_select on public.roadmap_github_links;
create policy roadmap_github_links_member_select on public.roadmap_github_links
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
drop policy if exists roadmap_github_links_manager_write on public.roadmap_github_links;
create policy roadmap_github_links_manager_write on public.roadmap_github_links
  for all to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));
grant select, insert, update, delete on public.roadmap_github_links to authenticated;

alter table public.incident_github_links
  add column if not exists product_id uuid references public.products(id) on delete cascade;
create index if not exists incident_github_links_product_idx
  on public.incident_github_links (product_id, updated_at desc);
