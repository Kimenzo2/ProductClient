-- Tenant content foundation
--
-- This migration closes the gap between the original owner-only tenant model
-- and the hosted content surfaces. It is intentionally forward-only:
-- existing tenants and Roadmap documents are preserved, while existing
-- owners are enrolled as tenant members and missing Status Pages are seeded.

-- The application has always treated one tenant as the owner's workspace.
-- Make that invariant database-enforced after verifying existing data first.
do $$
begin
  if exists (
    select 1
    from public.tenants
    group by owner_id
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce one tenant per owner: duplicate tenant owners exist';
  end if;
end $$;

create unique index if not exists tenants_owner_id_key on public.tenants(owner_id);
drop index if exists public.tenants_owner_id_idx;

-- Membership is the future-proof access boundary. Existing owners are members
-- of their own tenant so this is immediately useful without changing current
-- user-facing behavior.
create table if not exists public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_members_user_id_idx on public.tenant_members(user_id);
create index if not exists tenant_members_tenant_role_idx on public.tenant_members(tenant_id, role);

insert into public.tenant_members (tenant_id, user_id, role)
select id, owner_id, 'owner'
from public.tenants
on conflict (tenant_id, user_id) do update
set role = 'owner', updated_at = now();

create or replace function public.user_can_access_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = p_tenant_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.user_can_manage_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members
    where tenant_id = p_tenant_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

-- Keep new tenants enrolled automatically, including tenants created by the
-- existing ensure_tenant_for_user() security-definer function.
create or replace function public.add_tenant_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenant_members (tenant_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (tenant_id, user_id) do update
    set role = 'owner', updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenants_owner_membership on public.tenants;
create trigger tenants_owner_membership
after insert or update of owner_id on public.tenants
for each row execute function public.add_tenant_owner_membership();

-- Return a tenant for both owners and future team members. Owners sort first,
-- preserving the current single-workspace behavior for existing users.
create or replace function public.get_my_tenant()
returns setof public.tenants
language sql
security definer
set search_path = public
as $$
  select t.*
  from public.tenants t
  join public.tenant_members m on m.tenant_id = t.id
  where m.user_id = (select auth.uid())
  order by (t.owner_id = (select auth.uid())) desc, t.created_at asc;
$$;

grant execute on function public.get_my_tenant() to authenticated;

alter table public.tenant_members enable row level security;
alter table public.tenant_members force row level security;
drop policy if exists tenant_members_select on public.tenant_members;
drop policy if exists tenant_members_insert on public.tenant_members;
drop policy if exists tenant_members_update on public.tenant_members;
drop policy if exists tenant_members_delete on public.tenant_members;
create policy tenant_members_select on public.tenant_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.user_can_manage_tenant(tenant_id));
create policy tenant_members_insert on public.tenant_members
  for insert to authenticated
  with check (public.user_can_manage_tenant(tenant_id));
create policy tenant_members_update on public.tenant_members
  for update to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));
create policy tenant_members_delete on public.tenant_members
  for delete to authenticated
  using (public.user_can_manage_tenant(tenant_id));

-- Tenant reads now follow membership; destructive/settings changes remain
-- owner-only until a dedicated team-settings surface exists.
drop policy if exists "Users can view own tenant" on public.tenants;
create policy "Users can view accessible tenant" on public.tenants
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.user_can_access_tenant(id));

-- Content policies use the same access boundary as the tenant itself.
drop policy if exists status_pages_owner_select on public.status_pages;
drop policy if exists status_pages_owner_insert on public.status_pages;
drop policy if exists status_pages_owner_update on public.status_pages;
drop policy if exists status_pages_owner_delete on public.status_pages;
create policy status_pages_member_select on public.status_pages
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
create policy status_pages_manager_insert on public.status_pages
  for insert to authenticated
  with check (public.user_can_manage_tenant(tenant_id));
create policy status_pages_manager_update on public.status_pages
  for update to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));
create policy status_pages_manager_delete on public.status_pages
  for delete to authenticated
  using (public.user_can_manage_tenant(tenant_id));
alter table public.status_pages force row level security;
grant select, insert, update, delete on public.status_pages to authenticated;

drop policy if exists "owners can select own roadmap" on public.roadmap_docs;
drop policy if exists "owners can upsert own roadmap" on public.roadmap_docs;
drop policy if exists "owners can update own roadmap" on public.roadmap_docs;
drop policy if exists "owners can delete own roadmap" on public.roadmap_docs;
create policy "members can select roadmap" on public.roadmap_docs
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
create policy "managers can insert roadmap" on public.roadmap_docs
  for insert to authenticated
  with check (public.user_can_manage_tenant(tenant_id));
create policy "managers can update roadmap" on public.roadmap_docs
  for update to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));
create policy "managers can delete roadmap" on public.roadmap_docs
  for delete to authenticated
  using (public.user_can_manage_tenant(tenant_id));
grant select, insert, update, delete on public.roadmap_docs to authenticated;

-- Keep the denormalized slug required by edge mirroring synchronized with the
-- canonical tenant slug.
create or replace function public.sync_status_page_tenant_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is distinct from old.slug then
    update public.status_pages
    set tenant_slug = new.slug, updated_at = now()
    where tenant_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_status_page_slug on public.tenants;
create trigger tenants_status_page_slug
after update of slug on public.tenants
for each row execute function public.sync_status_page_tenant_slug();

-- The unique constraint already provides the slug index; keep only useful
-- foreign-key indexes.
drop index if exists public.status_pages_slug_idx;
create index if not exists status_pages_updated_by_idx on public.status_pages(updated_by);
create index if not exists roadmap_docs_updated_by_idx on public.roadmap_docs(updated_by);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'status_pages_services_array_check'
      and conrelid = 'public.status_pages'::regclass
  ) then
    alter table public.status_pages
      add constraint status_pages_services_array_check
      check (jsonb_typeof(services) = 'array');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'status_pages_incidents_array_check'
      and conrelid = 'public.status_pages'::regclass
  ) then
    alter table public.status_pages
      add constraint status_pages_incidents_array_check
      check (jsonb_typeof(incidents) = 'array');
  end if;
end $$;

-- Provision the public Status Page for pre-existing tenants without touching
-- any existing content. New tenants are still provisioned lazily by the API.
insert into public.status_pages (
  tenant_id, tenant_slug, page_title, page_description, services, incidents
)
select
  t.id,
  t.slug,
  coalesce(nullif(t.name, ''), 'Example Company') || ' status',
  'Current service status and incident updates.',
  jsonb_build_array(
    jsonb_build_object('id', 'sign-in', 'name', 'Sign in', 'description', 'Authentication and account access.', 'status', 'operational', 'uptime', '100.00%'),
    jsonb_build_object('id', 'dashboard', 'name', 'Dashboard', 'description', 'Workspace loading and saved changes.', 'status', 'operational', 'uptime', '100.00%'),
    jsonb_build_object('id', 'api-requests', 'name', 'API requests', 'description', 'API v1 and API v2 request handling.', 'status', 'operational', 'uptime', '100.00%'),
    jsonb_build_object('id', 'file-uploads', 'name', 'File uploads', 'description', 'Uploads and file processing.', 'status', 'operational', 'uptime', '100.00%')
  ),
  '[]'::jsonb
from public.tenants t
where not exists (
  select 1 from public.status_pages s where s.tenant_id = t.id
);
