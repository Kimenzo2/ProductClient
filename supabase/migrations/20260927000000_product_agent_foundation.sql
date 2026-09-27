-- Product Agent — foundation tables + RLS + seed.
-- Contract: PRODUCT_AGENT_SPEC.md + AGENT_PROMPT_PRODUCT_AGENT.md.
-- Laws:
--   * every row carries product_id not null (FK -> products, on delete cascade)
--   * RLS maker = products.maker_id = auth.uid() (solo maker)
--   * public chat writes go through server routes (service_role); anon has NO direct
--     table writes. Anon gets narrow RPC reads only where the panel needs them.
--   * inbox_threads.subject_type gains 'agent' for handoff threads.
--   * No ranking writes anywhere in this file.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 0. inbox handoff type
-- ---------------------------------------------------------------------------
alter table public.inbox_threads drop constraint if exists inbox_threads_subject_type_check;
alter table public.inbox_threads
  add constraint inbox_threads_subject_type_check
  check (subject_type in ('feedback','message','release_comment','docs_comment','other','agent'));

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.product_contacts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  name text,
  fields jsonb not null default '{}'::jsonb,
  source text not null default 'agent' check (source in ('agent','form','follow','import')),
  consent_email boolean not null default true,
  changelog boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, email)
);
-- Case-insensitive email uniqueness per product (spec: unique product_id + lower(email)).
create unique index if not exists product_contacts_product_email_idx
  on public.product_contacts (product_id, lower(email));

create table if not exists public.product_contact_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  contact_id uuid references public.product_contacts(id) on delete set null,
  session_id uuid,
  name text not null check (name in ('session_started','visited','followed','lead_captured','waitlisted','demo_booked','handed_off','release_notified','feedback_filed','nudge_sent','offer_shown','declined')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists product_contact_events_product_idx
  on public.product_contact_events (product_id, created_at desc);
create index if not exists product_contact_events_session_idx
  on public.product_contact_events (session_id, created_at);

create table if not exists public.agent_settings (
  product_id uuid primary key references public.products(id) on delete cascade,
  enabled boolean not null default false,
  greeting text,
  max_nudge_per_contact integer not null default 1 check (max_nudge_per_contact >= 0 and max_nudge_per_contact <= 5)
);

create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  key text not null,
  label text not null,
  enabled boolean not null default true,
  pin text not null default 'both' check (pin in ('pinned','agent_only','both')),
  config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  unique (product_id, key)
);
create index if not exists agent_tools_product_idx
  on public.agent_tools (product_id, sort_order);

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  contact_id uuid references public.product_contacts(id) on delete set null,
  visitor_key text,
  stage text not null default 'curious' check (stage in ('curious','qualified','offer_on_table','waiting','handed_to_maker','closed')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_sessions_product_idx
  on public.agent_sessions (product_id, updated_at desc);
create index if not exists agent_sessions_visitor_idx
  on public.agent_sessions (product_id, visitor_key, updated_at desc);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.agent_sessions(id) on delete cascade,
  role text not null check (role in ('visitor','agent','system')),
  body text not null,
  parts jsonb not null default '[]'::jsonb,
  tool_calls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_messages_session_idx
  on public.agent_messages (session_id, created_at);

create table if not exists public.agent_automations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  trigger text not null,
  action text not null,
  enabled boolean not null default true,
  unique (product_id, trigger)
);

-- updated_at touch for sessions
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $function$
begin new.updated_at = now(); return new; end; $function$;
drop trigger if exists agent_sessions_touch on public.agent_sessions;
create trigger agent_sessions_touch before update on public.agent_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
alter table public.product_contacts enable row level security;
alter table public.product_contact_events enable row level security;
alter table public.agent_settings enable row level security;
alter table public.agent_tools enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_automations enable row level security;

-- Maker select/update on all agent tables (inserts for contacts/sessions go
-- through server routes with service_role; maker insert kept for tools/settings).
drop policy if exists agent_maker_select on public.product_contacts;
create policy agent_maker_select on public.product_contacts for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));
drop policy if exists agent_maker_update on public.product_contacts;
create policy agent_maker_update on public.product_contacts for update to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())))
  with check (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));

drop policy if exists agent_events_maker_select on public.product_contact_events;
create policy agent_events_maker_select on public.product_contact_events for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));

drop policy if exists agent_settings_maker_all on public.agent_settings;
create policy agent_settings_maker_all on public.agent_settings for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())))
  with check (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));

drop policy if exists agent_tools_maker_all on public.agent_tools;
create policy agent_tools_maker_all on public.agent_tools for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())))
  with check (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));

drop policy if exists agent_sessions_maker_select on public.agent_sessions;
create policy agent_sessions_maker_select on public.agent_sessions for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));

drop policy if exists agent_messages_maker_select on public.agent_messages;
create policy agent_messages_maker_select on public.agent_messages for select to authenticated
  using (exists (select 1 from public.agent_sessions s join public.products p on p.id = s.product_id
    where s.id = session_id and p.maker_id = (select auth.uid())));

drop policy if exists agent_automations_maker_all on public.agent_automations;
create policy agent_automations_maker_all on public.agent_automations for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())))
  with check (exists (select 1 from public.products p where p.id = product_id and p.maker_id = (select auth.uid())));

-- Public read of enabled tools + greeting for the panel (no contact/session reads).
drop policy if exists agent_tools_public_select on public.agent_tools;
create policy agent_tools_public_select on public.agent_tools for select to anon, authenticated
  using (exists (select 1 from public.agent_settings s where s.product_id = agent_tools.product_id and s.enabled = true));
drop policy if exists agent_settings_public_select on public.agent_settings;
create policy agent_settings_public_select on public.agent_settings for select to anon, authenticated
  using (enabled = true);

-- ---------------------------------------------------------------------------
-- 3. Grants — least privilege, no TRUNCATE
-- ---------------------------------------------------------------------------
revoke all on public.product_contacts from anon;
revoke truncate, delete, insert on public.product_contacts from authenticated;
revoke all on public.product_contact_events from anon;
revoke truncate, delete, insert on public.product_contact_events from authenticated;
revoke all on public.agent_sessions from anon;
revoke truncate, delete, insert, update on public.agent_sessions from authenticated;
revoke all on public.agent_messages from anon;
revoke truncate, delete, insert, update on public.agent_messages from authenticated;
revoke all on public.agent_automations from anon;
revoke truncate, delete, insert, update on public.agent_automations from authenticated;
revoke truncate on public.agent_settings from authenticated;
revoke all on public.agent_settings from anon;
revoke truncate on public.agent_tools from authenticated;
revoke insert, update, delete, truncate on public.agent_tools from anon;

-- ---------------------------------------------------------------------------
-- 4. Seed — defaults when Agent is first enabled
-- ---------------------------------------------------------------------------
create or replace function public.seed_agent_tools(p_product_id uuid)
returns integer language plpgsql security invoker set search_path = '' as $function$
declare n integer := 0; begin
  insert into public.agent_tools (product_id, key, label, enabled, pin, config, sort_order) values
    (p_product_id,'visit','Visit',true,'both','{}'::jsonb,10),
    (p_product_id,'follow_product','Follow',true,'both','{}'::jsonb,20),
    (p_product_id,'whats_new','What''s new',true,'both','{}'::jsonb,30),
    (p_product_id,'handoff_inbox','Ask the maker',true,'both','{}'::jsonb,40),
    (p_product_id,'show_pricing','Pricing',true,'agent_only','{}'::jsonb,50),
    (p_product_id,'show_status','Status',true,'agent_only','{}'::jsonb,60),
    (p_product_id,'show_release','Latest release',true,'agent_only','{}'::jsonb,70),
    (p_product_id,'capture_email','Get notified',true,'agent_only','{}'::jsonb,80),
    (p_product_id,'file_feedback','Share feedback',true,'agent_only','{}'::jsonb,90),
    (p_product_id,'book_slot','Book a demo',false,'agent_only','{}'::jsonb,100),
    (p_product_id,'open_url','Open link',false,'agent_only','{}'::jsonb,110),
    (p_product_id,'offer_checkout','Get offer',false,'agent_only','{}'::jsonb,120),
    (p_product_id,'request_access','Request access',false,'agent_only','{}'::jsonb,130),
    (p_product_id,'subscribe_changelog','Follow updates',false,'agent_only','{}'::jsonb,140),
    (p_product_id,'nudge','Follow-up nudge',false,'agent_only','{}'::jsonb,150),
    (p_product_id,'apply_coupon','Apply coupon',false,'agent_only','{}'::jsonb,160)
  on conflict (product_id, key) do nothing;
  get diagnostics n = row_count;
  insert into public.agent_automations (product_id, trigger, action, enabled) values
    (p_product_id,'lead_captured','send_lead_confirm',true),
    (p_product_id,'product.launched','notify_waitlist',true),
    (p_product_id,'release.published','notify_changelog',true),
    (p_product_id,'feedback.shipped','notify_shipped',true),
    (p_product_id,'idle_48h','nudge_once',false)
  on conflict (product_id, trigger) do nothing;
  return n;
end; $function$;

create or replace function public.agent_enable(p_product_id uuid, p_greeting text default null)
returns boolean language plpgsql security invoker set search_path = '' as $function$
declare v_uid uuid := (select auth.uid()); begin
  if not exists (select 1 from public.products p where p.id = p_product_id and p.maker_id = v_uid) then
    raise exception 'product not found';
  end if;
  insert into public.agent_settings (product_id, enabled, greeting)
  values (p_product_id, true, p_greeting)
  on conflict (product_id) do update set enabled = true, greeting = coalesce(excluded.greeting, public.agent_settings.greeting);
  perform public.seed_agent_tools(p_product_id);
  -- Coming-soon products (no live_url): visit stays disabled.
  update public.agent_tools t set enabled = false
  where t.product_id = p_product_id and t.key = 'visit'
    and not exists (select 1 from public.products p where p.id = p_product_id and nullif(p.live_url,'') is not null);
  return true;
end; $function$;

-- Maker RPC grants
revoke execute on function public.seed_agent_tools(uuid) from anon;
revoke execute on function public.agent_enable(uuid, text) from anon;
