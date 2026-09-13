-- Repair the live runtime schema used by ProductClient.
--
-- The old public products policy queried events while the authenticated
-- events policy queried products. PostgreSQL detects that mutual dependency
-- as infinite policy recursion. Keep the public event check in a private,
-- security-definer helper so the products policy no longer traverses the
-- events policy.

create schema if not exists private;

create or replace function private.product_has_published_event(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.product_id = p_product_id
      and e.published_at <= now()
      and e.deleted_at is null
      and e.hidden_at is null
  );
$$;

revoke all on function private.product_has_published_event(uuid) from public;
grant execute on function private.product_has_published_event(uuid) to anon, authenticated;

drop policy if exists v3_products_public_select on public.products;

create policy v3_products_public_select
on public.products
for select
to anon, authenticated
using (
  deleted_at is null
  and private.product_has_published_event(id)
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  path text,
  query text,
  value text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_product_created_idx
  on public.analytics_events (product_id, created_at desc);

alter table public.analytics_events enable row level security;
alter table public.analytics_events force row level security;
revoke all on table public.analytics_events from anon, authenticated;
grant select, insert on table public.analytics_events to authenticated;

drop policy if exists analytics_events_owner_select on public.analytics_events;
create policy analytics_events_owner_select
on public.analytics_events
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists analytics_events_owner_insert on public.analytics_events;
create policy analytics_events_owner_insert
on public.analytics_events
for insert
to authenticated
with check (user_id = auth.uid());

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists feedback_reports_user_created_idx
  on public.feedback_reports (user_id, created_at desc);

alter table public.feedback_reports enable row level security;
alter table public.feedback_reports force row level security;
revoke all on table public.feedback_reports from anon, authenticated;
grant select, insert on table public.feedback_reports to authenticated;

drop policy if exists feedback_reports_owner_select on public.feedback_reports;
create policy feedback_reports_owner_select
on public.feedback_reports
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists feedback_reports_owner_insert on public.feedback_reports;
create policy feedback_reports_owner_insert
on public.feedback_reports
for insert
to authenticated
with check (user_id = auth.uid());

alter table public.tenants
  add column if not exists docs_access_mode text not null default 'public',
  add column if not exists docs_password_hash text,
  add column if not exists docs_agent_blurb text,
  add column if not exists docs_primary_color text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_docs_access_mode_check'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_docs_access_mode_check
      check (docs_access_mode in ('public', 'password', 'private'));
  end if;
end
$$;
