-- Incident command model.
--
-- Status Pages remain a published JSON projection for the public edge site.
-- These tables are the internal source of truth for response, updates, service
-- relationships, and post-incident work.

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  external_id text not null,
  title text not null,
  summary text not null,
  status text not null check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  severity text not null default 'Medium impact' check (severity in ('Critical', 'High impact', 'Medium impact')),
  mode text not null default 'Active' check (mode in ('Active', 'Retrospective', 'Test')),
  lead_user_id uuid references auth.users(id) on delete set null,
  lead_name text not null default 'Unassigned',
  coordination_channel text,
  public_message text,
  started_at timestamptz not null,
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, external_id)
);

create index if not exists incidents_tenant_status_idx on public.incidents(tenant_id, status, started_at desc);
create index if not exists incidents_tenant_updated_idx on public.incidents(tenant_id, updated_at desc);

create table if not exists public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  external_id text not null,
  status text not null check (status in ('investigating', 'identified', 'monitoring', 'resolved')),
  message text not null,
  published_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (incident_id, external_id)
);

create index if not exists incident_updates_incident_time_idx on public.incident_updates(incident_id, published_at desc);

create table if not exists public.incident_services (
  incident_id uuid not null references public.incidents(id) on delete cascade,
  service_id text not null,
  service_name text not null,
  created_at timestamptz not null default now(),
  primary key (incident_id, service_id)
);

create index if not exists incident_services_service_idx on public.incident_services(service_id);

create table if not exists public.incident_work_items (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  external_id text not null,
  work_type text not null default 'follow_up' check (work_type in ('follow_up', 'review_task')),
  title text not null,
  description text not null default '',
  kind text not null default 'Product work',
  phase text not null default 'Documenting' check (phase in ('Documenting', 'Reviewing')),
  status text not null default 'Open' check (status in ('Open', 'In progress', 'Done', 'Not doing')),
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_name text not null default 'Unassigned',
  due_label text not null default 'No due date',
  due_at timestamptz,
  destination_href text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (incident_id, external_id)
);

create index if not exists incident_work_items_queue_idx on public.incident_work_items(status, due_at, updated_at desc);
create index if not exists incident_work_items_incident_idx on public.incident_work_items(incident_id, phase, created_at);

alter table public.incidents enable row level security;
alter table public.incidents force row level security;
alter table public.incident_updates enable row level security;
alter table public.incident_updates force row level security;
alter table public.incident_services enable row level security;
alter table public.incident_services force row level security;
alter table public.incident_work_items enable row level security;
alter table public.incident_work_items force row level security;

drop policy if exists incidents_member_select on public.incidents;
create policy incidents_member_select on public.incidents for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
drop policy if exists incidents_manager_write on public.incidents;
create policy incidents_manager_write on public.incidents for all to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));

drop policy if exists incident_updates_member_select on public.incident_updates;
create policy incident_updates_member_select on public.incident_updates for select to authenticated
  using (exists (select 1 from public.incidents where incidents.id = incident_updates.incident_id and public.user_can_access_tenant(incidents.tenant_id)));
drop policy if exists incident_updates_manager_write on public.incident_updates;
create policy incident_updates_manager_write on public.incident_updates for all to authenticated
  using (exists (select 1 from public.incidents where incidents.id = incident_updates.incident_id and public.user_can_manage_tenant(incidents.tenant_id)))
  with check (exists (select 1 from public.incidents where incidents.id = incident_updates.incident_id and public.user_can_manage_tenant(incidents.tenant_id)));

drop policy if exists incident_services_member_select on public.incident_services;
create policy incident_services_member_select on public.incident_services for select to authenticated
  using (exists (select 1 from public.incidents where incidents.id = incident_services.incident_id and public.user_can_access_tenant(incidents.tenant_id)));
drop policy if exists incident_services_manager_write on public.incident_services;
create policy incident_services_manager_write on public.incident_services for all to authenticated
  using (exists (select 1 from public.incidents where incidents.id = incident_services.incident_id and public.user_can_manage_tenant(incidents.tenant_id)))
  with check (exists (select 1 from public.incidents where incidents.id = incident_services.incident_id and public.user_can_manage_tenant(incidents.tenant_id)));

drop policy if exists incident_work_items_member_select on public.incident_work_items;
create policy incident_work_items_member_select on public.incident_work_items for select to authenticated
  using (exists (select 1 from public.incidents where incidents.id = incident_work_items.incident_id and public.user_can_access_tenant(incidents.tenant_id)));
drop policy if exists incident_work_items_manager_write on public.incident_work_items;
create policy incident_work_items_manager_write on public.incident_work_items for all to authenticated
  using (exists (select 1 from public.incidents where incidents.id = incident_work_items.incident_id and public.user_can_manage_tenant(incidents.tenant_id)))
  with check (exists (select 1 from public.incidents where incidents.id = incident_work_items.incident_id and public.user_can_manage_tenant(incidents.tenant_id)));

grant select, insert, update, delete on public.incidents to authenticated;
grant select, insert, update, delete on public.incident_updates to authenticated;
grant select, insert, update, delete on public.incident_services to authenticated;
grant select, insert, update, delete on public.incident_work_items to authenticated;

-- Backfill existing public incidents into the internal model. Re-running is safe.
insert into public.incidents (tenant_id, external_id, title, summary, status, started_at)
select
  s.tenant_id,
  i->>'id',
  i->>'title',
  i->>'summary',
  coalesce(i->>'status', 'investigating'),
  case when (i->>'startedAt') ~ '^\\d{4}-\\d{2}-\\d{2}T' then (i->>'startedAt')::timestamptz else now() end
from public.status_pages s
cross join lateral jsonb_array_elements(s.incidents) i
where nullif(i->>'id', '') is not null
on conflict (tenant_id, external_id) do nothing;

insert into public.incident_updates (incident_id, external_id, status, message, published_at)
select
  inc.id,
  u->>'id',
  coalesce(u->>'status', 'investigating'),
  coalesce(u->>'message', ''),
  case when (u->>'publishedAt') ~ '^\\d{4}-\\d{2}-\\d{2}T' then (u->>'publishedAt')::timestamptz else now() end
from public.status_pages s
cross join lateral jsonb_array_elements(s.incidents) i
cross join lateral jsonb_array_elements(coalesce(i->'updates', '[]'::jsonb)) u
join public.incidents inc on inc.tenant_id = s.tenant_id and inc.external_id = i->>'id'
where nullif(u->>'id', '') is not null
on conflict (incident_id, external_id) do nothing;

insert into public.incident_services (incident_id, service_id, service_name)
select distinct inc.id, service_id, coalesce(service->>'name', service_id)
from public.status_pages s
cross join lateral jsonb_array_elements(s.incidents) i
cross join lateral jsonb_array_elements_text(coalesce(i->'affectedServices', '[]'::jsonb)) service_id
cross join lateral jsonb_array_elements(s.services) service
join public.incidents inc on inc.tenant_id = s.tenant_id and inc.external_id = i->>'id'
where service->>'id' = service_id
on conflict (incident_id, service_id) do nothing;
