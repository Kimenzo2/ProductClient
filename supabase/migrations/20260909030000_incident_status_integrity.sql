-- Incident status integrity and audit trail.
-- Resolution is terminal in the current response model. Older clients or
-- stale autosaves must never move a resolved incident backwards.

create table if not exists public.incident_status_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  from_status text check (from_status is null or from_status in ('investigating', 'identified', 'monitoring', 'resolved')),
  to_status text not null check (to_status in ('investigating', 'identified', 'monitoring', 'resolved')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text not null default 'status change',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists incident_status_events_incident_time_idx
  on public.incident_status_events(incident_id, changed_at desc);

create or replace function public.prevent_incident_status_regression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_rank integer;
  new_rank integer;
begin
  old_rank := case old.status
    when 'investigating' then 1
    when 'identified' then 2
    when 'monitoring' then 3
    when 'resolved' then 4
    else 0
  end;
  new_rank := case new.status
    when 'investigating' then 1
    when 'identified' then 2
    when 'monitoring' then 3
    when 'resolved' then 4
    else 0
  end;

  if new_rank < old_rank then
    raise exception using
      errcode = 'P0001',
      message = 'incident_status_regression_blocked',
      detail = format('Incident %s cannot move from %s to %s.', old.external_id, old.status, new.status);
  end if;

  return new;
end;
$$;

drop trigger if exists incident_status_regression_guard on public.incidents;
create trigger incident_status_regression_guard
before update of status on public.incidents
for each row execute function public.prevent_incident_status_regression();

create or replace function public.audit_incident_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.incident_status_events (
      incident_id,
      from_status,
      to_status,
      changed_by,
      reason,
      metadata
    ) values (
      new.id,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      new.updated_by,
      case when tg_op = 'INSERT' then 'incident created' else 'incident status changed' end,
      jsonb_build_object('external_id', new.external_id, 'source', 'database-trigger')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists incident_status_audit on public.incidents;
create trigger incident_status_audit
after insert or update of status on public.incidents
for each row execute function public.audit_incident_status_change();

alter table public.incident_status_events enable row level security;
alter table public.incident_status_events force row level security;

drop policy if exists incident_status_events_member_select on public.incident_status_events;
create policy incident_status_events_member_select on public.incident_status_events for select to authenticated
  using (exists (
    select 1 from public.incidents
    where incidents.id = incident_status_events.incident_id
      and public.user_can_access_tenant(incidents.tenant_id)
  ));

grant select on public.incident_status_events to authenticated;
