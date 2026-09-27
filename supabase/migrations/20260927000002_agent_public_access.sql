-- Product Agent — public (anon) access. P-Landing has no server secret, so the
-- public panel endpoints run with the publishable key and these policies/RPCs.
-- Laws: anon touches ONLY sessions/messages/events for products whose Agent is
-- enabled; contacts + inbox go through SECURITY DEFINER functions that
-- re-validate enabled + product visibility. No ranking writes anywhere.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 0. Grounding callable by visitors (returns only that product's own chunks)
-- ---------------------------------------------------------------------------
alter function public.agent_grounding(uuid, text, integer) security definer;
revoke execute on function public.agent_grounding(uuid, text, integer) from anon;
grant execute on function public.agent_grounding(uuid, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Anon table privileges (RLS still gates every row)
-- ---------------------------------------------------------------------------
grant insert, select on public.agent_sessions to anon;
grant insert, select on public.agent_messages to anon;
grant insert, select on public.product_contact_events to anon;

-- ---------------------------------------------------------------------------
-- 2. Anon RLS policies — only when the product's Agent is enabled
-- ---------------------------------------------------------------------------
drop policy if exists agent_sessions_public_insert on public.agent_sessions;
create policy agent_sessions_public_insert on public.agent_sessions
  for insert to anon
  with check (exists (
    select 1 from public.agent_settings s
    where s.product_id = agent_sessions.product_id and s.enabled = true
  ));

drop policy if exists agent_sessions_public_select on public.agent_sessions;
create policy agent_sessions_public_select on public.agent_sessions
  for select to anon
  using (exists (
    select 1 from public.agent_settings s
    where s.product_id = agent_sessions.product_id and s.enabled = true
  ));

drop policy if exists agent_messages_public_insert on public.agent_messages;
create policy agent_messages_public_insert on public.agent_messages
  for insert to anon
  with check (exists (
    select 1 from public.agent_sessions se
    join public.agent_settings s on s.product_id = se.product_id
    where se.id = session_id and s.enabled = true
  ));

drop policy if exists agent_messages_public_select on public.agent_messages;
create policy agent_messages_public_select on public.agent_messages
  for select to anon
  using (exists (
    select 1 from public.agent_sessions se
    join public.agent_settings s on s.product_id = se.product_id
    where se.id = session_id and s.enabled = true
  ));

drop policy if exists agent_events_public_insert on public.product_contact_events;
create policy agent_events_public_insert on public.product_contact_events
  for insert to anon
  with check (exists (
    select 1 from public.agent_settings s
    where s.product_id = product_contact_events.product_id and s.enabled = true
  ));

-- ---------------------------------------------------------------------------
-- 3. Privileged writes as SECURITY DEFINER (validated, narrow)
-- ---------------------------------------------------------------------------
create or replace function public.agent_ensure_session(
  p_product_id uuid,
  p_visitor_key text default null,
  p_session_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare v_id uuid; begin
  if not exists (
    select 1 from public.products p
    join public.agent_settings s on s.product_id = p.id
    where p.id = p_product_id and p.deleted_at is null and s.enabled = true
  ) then raise exception 'agent is off'; end if;

  if p_session_id is not null then
    select id into v_id from public.agent_sessions
    where id = p_session_id and product_id = p_product_id;
    if v_id is not null then
      update public.agent_sessions set updated_at = now() where id = v_id;
      return v_id;
    end if;
  end if;

  insert into public.agent_sessions (product_id, visitor_key)
  values (p_product_id, left(coalesce(p_visitor_key, ''), 120))
  returning id into v_id;
  insert into public.product_contact_events (product_id, session_id, name, payload)
  values (p_product_id, v_id, 'session_started', '{}'::jsonb);
  return v_id;
end; $function$;

create or replace function public.agent_capture_email(
  p_product_id uuid,
  p_session_id uuid,
  p_email text,
  p_name text default null,
  p_consent boolean default true,
  p_event text default 'waitlisted'
)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare v_email text := lower(btrim(coalesce(p_email, ''))); v_id uuid; begin
  if not exists (
    select 1 from public.products p
    join public.agent_settings s on s.product_id = p.id
    where p.id = p_product_id and p.deleted_at is null and s.enabled = true
  ) then raise exception 'agent is off'; end if;
  if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid email is required';
  end if;
  if p_event not in ('lead_captured', 'waitlisted') then raise exception 'invalid event'; end if;

  insert into public.product_contacts (product_id, email, name, source, consent_email, last_seen_at)
  values (p_product_id, v_email, left(coalesce(p_name, ''), 120), 'agent', coalesce(p_consent, true), now())
  on conflict (product_id, email) do update
    set last_seen_at = now(),
        consent_email = public.product_contacts.consent_email or excluded.consent_email
  returning id into v_id;

  insert into public.product_contact_events (product_id, contact_id, session_id, name, payload)
  values (p_product_id, v_id, p_session_id, p_event, '{}'::jsonb);
  return v_id;
end; $function$;

create or replace function public.agent_handoff_create(
  p_product_id uuid,
  p_session_id uuid,
  p_message text
)
returns uuid language plpgsql security definer set search_path = '' as $function$
declare v_body text := left(btrim(coalesce(p_message, '')), 2000); v_thread uuid; begin
  if not exists (
    select 1 from public.products p
    join public.agent_settings s on s.product_id = p.id
    where p.id = p_product_id and p.deleted_at is null and s.enabled = true
  ) then raise exception 'agent is off'; end if;
  if v_body = '' then raise exception 'message is required'; end if;
  if not exists (select 1 from public.agent_sessions where id = p_session_id and product_id = p_product_id) then
    raise exception 'session not found';
  end if;

  select id into v_thread from public.inbox_threads
  where product_id = p_product_id and subject_type = 'agent' and subject_id = p_session_id;
  if v_thread is null then
    insert into public.inbox_threads
      (product_id, subject_type, subject_id, title, status, last_preview, unread_maker)
    values
      (p_product_id, 'agent', p_session_id, left(v_body, 120), 'open', left(v_body, 160), true)
    returning id into v_thread;
    insert into public.inbox_messages (thread_id, product_id, author_role, body)
    values (v_thread, p_product_id, 'visitor', v_body);
  end if;

  update public.agent_sessions set stage = 'handed_to_maker', updated_at = now() where id = p_session_id;
  insert into public.product_contact_events (product_id, session_id, name, payload)
  values (p_product_id, p_session_id, 'handed_off', jsonb_build_object('thread_id', v_thread));
  return v_thread;
end; $function$;

grant execute on function public.agent_ensure_session(uuid, text, uuid) to anon, authenticated;
grant execute on function public.agent_capture_email(uuid, uuid, text, text, boolean, text) to anon, authenticated;
grant execute on function public.agent_handoff_create(uuid, uuid, text) to anon, authenticated;
