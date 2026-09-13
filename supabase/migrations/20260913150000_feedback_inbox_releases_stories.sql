-- Feedback · Inbox · Releases · Customer Stories — product-scoped domains.
-- Inventory + reuse-vs-add map: see INTEGRATION_NOTES.md (repo root).
--
-- Laws implemented here:
--   * every new row carries product_id not null (FK -> products, on delete cascade)
--   * RLS = products.maker_id = auth.uid()  (solo maker; tenant helpers untouched)
--   * Inbox is a reply surface, not Notifications (no notifications table created)
--   * Releases are one table; the feed event is a view of them (events.payload->>'release_id')
--   * No workshop dialect in names.
--
-- Idempotent: safe to re-run. Remote is patched via the query API because this
-- project's schema was authored without migration history (see repo migration
-- header comments); this file is the durable record.

-- ---------------------------------------------------------------------------
-- 0. Active product foundation (client already calls these; they were missing)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists active_product_id uuid references public.products(id) on delete set null;

create or replace function public.get_my_products()
returns setof public.products
language sql
stable
security invoker
set search_path = ''
as $function$
  select p.*
  from public.products p
  where p.maker_id = (select auth.uid())
    and p.deleted_at is null
  order by p.created_at asc;
$function$;

create or replace function public.set_active_product(p_product_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_ok boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  select exists (
    select 1 from public.products p
    where p.id = p_product_id and p.maker_id = v_uid and p.deleted_at is null
  ) into v_ok;
  if not v_ok then
    return false;
  end if;
  update public.profiles
     set active_product_id = p_product_id
   where id = v_uid;
  return true;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 1. Feedback
-- ---------------------------------------------------------------------------

create table if not exists public.feedback_items (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  source       text not null check (source in ('launch','product','docs','status','roadmap','release','widget','other')),
  source_id    uuid,
  source_url   text,
  kind         text not null default 'idea' check (kind in ('idea','bug','question','praise')),
  title        text,
  body         text not null,
  status       text not null default 'new' check (status in ('new','reviewing','planned','in_progress','shipped','closed')),
  author_id    uuid references auth.users(id) on delete set null,
  author_email text,
  author_name  text,
  page_title   text,
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists feedback_items_product_created_idx
  on public.feedback_items (product_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists feedback_items_touch on public.feedback_items;
create trigger feedback_items_touch
  before update on public.feedback_items
  for each row execute function public.set_updated_at();

alter table public.feedback_items enable row level security;

-- Maker reads and manages own-product feedback. There is deliberately NO insert
-- policy: public + authed inserts go through feedback_create (see below), which
-- validates source/kind and product visibility. Anon gets no direct table path.
drop policy if exists feedback_items_maker_select on public.feedback_items;
create policy feedback_items_maker_select on public.feedback_items
  for select to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

drop policy if exists feedback_items_maker_update on public.feedback_items;
create policy feedback_items_maker_update on public.feedback_items
  for update to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- 2. Inbox (conversations; NOT notifications)
-- ---------------------------------------------------------------------------

create table if not exists public.inbox_threads (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  subject_type    text not null check (subject_type in ('feedback','message','release_comment','docs_comment','other')),
  subject_id      uuid,
  title           text,
  status          text not null default 'open' check (status in ('open','waiting','closed')),
  last_message_at timestamptz not null default now(),
  last_preview    text,
  unread_maker    boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists inbox_threads_product_recent_idx
  on public.inbox_threads (product_id, last_message_at desc);

create table if not exists public.inbox_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.inbox_threads(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  author_role text not null check (author_role in ('visitor','maker','system')),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  author_email text,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists inbox_messages_thread_idx
  on public.inbox_messages (thread_id, created_at);

alter table public.inbox_threads enable row level security;
alter table public.inbox_messages enable row level security;

drop policy if exists inbox_threads_maker_select on public.inbox_threads;
create policy inbox_threads_maker_select on public.inbox_threads
  for select to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

drop policy if exists inbox_threads_maker_update on public.inbox_threads;
create policy inbox_threads_maker_update on public.inbox_threads
  for update to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

drop policy if exists inbox_messages_maker_select on public.inbox_messages;
create policy inbox_messages_maker_select on public.inbox_messages
  for select to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

drop policy if exists inbox_messages_maker_insert on public.inbox_messages;
create policy inbox_messages_maker_insert on public.inbox_messages
  for insert to authenticated
  with check (
    author_role = 'maker'
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.maker_id = (select auth.uid())
    )
  );

-- V1 decision (documented): visitor replies are NOT enabled. No anon policy on
-- inbox_messages; the public thread-reply flow arrives with the public widget.

-- ---------------------------------------------------------------------------
-- 3. Releases (one row, many views; feed event optional + idempotent)
-- ---------------------------------------------------------------------------

-- release_publish runs as invoker, so the maker needs a scoped INSERT path into
-- the feed: events had SELECT-only policies. This adds exactly that — no
-- columns, no vocabulary, no rewrite of the events schema.
drop policy if exists v3_events_owner_insert on public.events;
create policy v3_events_owner_insert on public.events
  for insert to authenticated
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

create table if not exists public.releases (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  slug         text not null,
  title        text not null,
  body         text,
  version      text,
  status       text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  event_id     uuid references public.events(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, slug)
);

create index if not exists releases_product_published_idx
  on public.releases (product_id, published_at desc);

drop trigger if exists releases_touch on public.releases;
create trigger releases_touch
  before update on public.releases
  for each row execute function public.set_updated_at();

alter table public.releases enable row level security;

drop policy if exists releases_maker_all on public.releases;
create policy releases_maker_all on public.releases
  for all to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

-- Public read of published releases on live (launched, non-deleted) products.
drop policy if exists releases_public_select on public.releases;
create policy releases_public_select on public.releases
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.deleted_at is null and p.launched_at is not null
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Customer stories
-- ---------------------------------------------------------------------------

create table if not exists public.customer_stories (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  quote       text not null,
  author_name text,
  author_role text,
  company     text,
  url         text,
  logo_url    text,
  source      text not null default 'manual' check (source in ('manual','imported')),
  published   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists customer_stories_product_idx
  on public.customer_stories (product_id, sort_order);

drop trigger if exists customer_stories_touch on public.customer_stories;
create trigger customer_stories_touch
  before update on public.customer_stories
  for each row execute function public.set_updated_at();

alter table public.customer_stories enable row level security;

drop policy if exists customer_stories_maker_all on public.customer_stories;
create policy customer_stories_maker_all on public.customer_stories
  for all to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.maker_id = (select auth.uid())
  ));

drop policy if exists customer_stories_public_select on public.customer_stories;
create policy customer_stories_public_select on public.customer_stories
  for select to anon, authenticated
  using (
    published = true
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- 5. RPCs — feedback
-- ---------------------------------------------------------------------------

-- The one SECURITY DEFINER function in this set, and why: visitors submit
-- feedback without an account, but feedback_items has no anon insert policy and
-- must not get one (it would be an open write endpoint). This function is the
-- narrow, validated write path: it re-checks that the target product is public
-- (launched + not deleted), clamps input lengths, and writes the feedback plus
-- its inbox thread + first message atomically. search_path is pinned to ''
-- and every identifier is schema-qualified to prevent hijack.
create or replace function public.feedback_create(
  p_product_id  uuid,
  p_source      text,
  p_body        text,
  p_kind        text default 'idea',
  p_title       text default null,
  p_source_id   uuid default null,
  p_source_url  text default null,
  p_author_name text default null,
  p_author_email text default null,
  p_page_title  text default null,
  p_user_agent  text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid   uuid := (select auth.uid());
  v_body  text := left(btrim(coalesce(p_body, '')), 5000);
  v_title text := left(btrim(coalesce(p_title, '')), 200);
  v_id    uuid;
  v_thread uuid;
begin
  if v_body = '' then
    raise exception 'feedback body is required';
  end if;
  if p_source not in ('launch','product','docs','status','roadmap','release','widget','other') then
    raise exception 'invalid feedback source';
  end if;
  if p_kind not in ('idea','bug','question','praise') then
    raise exception 'invalid feedback kind';
  end if;

  -- Public insert is allowed only on live public products (launched, not deleted).
  if not exists (
    select 1 from public.products p
    where p.id = p_product_id and p.deleted_at is null and p.launched_at is not null
  ) then
    raise exception 'feedback is not open for this product';
  end if;

  insert into public.feedback_items
    (product_id, source, source_id, source_url, kind, title, body,
     author_id, author_email, author_name, page_title, user_agent)
  values
    (p_product_id, p_source, p_source_id, left(coalesce(p_source_url,''), 1024),
     p_kind, nullif(v_title,''), v_body,
     v_uid, left(coalesce(p_author_email,''), 254), left(coalesce(p_author_name,''), 120),
     left(coalesce(p_page_title,''), 300), left(coalesce(p_user_agent,''), 400))
  returning id into v_id;

  -- One thread per feedback item; body is canonical on feedback_items, the
  -- first message copies it so Inbox renders without joins.
  insert into public.inbox_threads
    (product_id, subject_type, subject_id, title, status, last_message_at, last_preview, unread_maker)
  values
    (p_product_id, 'feedback', v_id, nullif(v_title,''), 'open', now(), left(v_body, 160), true)
  returning id into v_thread;

  insert into public.inbox_messages
    (thread_id, product_id, author_role, author_id, author_name, author_email, body)
  values
    (v_thread, p_product_id, 'visitor', v_uid,
     left(coalesce(p_author_name,''), 120), left(coalesce(p_author_email,''), 254), v_body);

  return v_id;
end;
$function$;

create or replace function public.feedback_list(
  p_product_id uuid,
  p_status text default null,
  p_source text default null
)
returns setof public.feedback_items
language sql
stable
security invoker
set search_path = ''
as $function$
  select f.*
  from public.feedback_items f
  where f.product_id = p_product_id
    and (p_status is null or f.status = p_status)
    and (p_source is null or f.source = p_source)
  order by f.created_at desc
  limit 200;
$function$;

create or replace function public.feedback_set_status(
  p_feedback_id uuid,
  p_status text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_status not in ('new','reviewing','planned','in_progress','shipped','closed') then
    raise exception 'invalid feedback status';
  end if;
  update public.feedback_items f
     set status = p_status
   where f.id = p_feedback_id
     and exists (
       select 1 from public.products p
       where p.id = f.product_id and p.maker_id = (select auth.uid())
     );
  return found;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 6. RPCs — inbox
-- ---------------------------------------------------------------------------

create or replace function public.inbox_list(p_product_id uuid)
returns setof public.inbox_threads
language sql
stable
security invoker
set search_path = ''
as $function$
  select t.*
  from public.inbox_threads t
  where t.product_id = p_product_id
  order by t.last_message_at desc
  limit 200;
$function$;

create or replace function public.inbox_thread(p_thread_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_thread public.inbox_threads;
  v_messages jsonb;
begin
  select t.* into v_thread
  from public.inbox_threads t
  where t.id = p_thread_id
    and exists (
      select 1 from public.products p
      where p.id = t.product_id and p.maker_id = v_uid
    );
  if not found then
    return null; -- do not leak existence across products
  end if;
  select coalesce(jsonb_agg(m order by m.created_at), '[]'::jsonb)
    into v_messages
  from (
    select to_jsonb(im) as m
    from public.inbox_messages im
    where im.thread_id = p_thread_id
    order by im.created_at
  ) s;
  return jsonb_build_object('thread', to_jsonb(v_thread), 'messages', v_messages);
end;
$function$;

create or replace function public.inbox_reply(p_thread_id uuid, p_body text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_body text := left(btrim(coalesce(p_body,'')), 5000);
  v_product uuid;
  v_id uuid;
begin
  if v_body = '' then
    raise exception 'reply body is required';
  end if;
  select t.product_id into v_product
  from public.inbox_threads t
  where t.id = p_thread_id
    and exists (
      select 1 from public.products p
      where p.id = t.product_id and p.maker_id = v_uid
    );
  if v_product is null then
    raise exception 'thread not found';
  end if;

  insert into public.inbox_messages
    (thread_id, product_id, author_role, author_id, body)
  values
    (p_thread_id, v_product, 'maker', v_uid, v_body)
  returning id into v_id;

  update public.inbox_threads
     set last_message_at = now(),
         unread_maker = false,
         last_preview = left(v_body, 160)
   where id = p_thread_id;

  return v_id;
end;
$function$;

create or replace function public.inbox_mark_read(p_thread_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.inbox_threads t
     set unread_maker = false
   where t.id = p_thread_id
     and exists (
       select 1 from public.products p
       where p.id = t.product_id and p.maker_id = (select auth.uid())
     );
  return found;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 7. RPCs — releases
-- ---------------------------------------------------------------------------

create or replace function public.release_upsert(
  p_product_id uuid,
  p_slug text,
  p_title text,
  p_body text default null,
  p_version text default null,
  p_release_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_slug text := left(btrim(coalesce(p_slug,'')), 80);
begin
  if not exists (
    select 1 from public.products p
    where p.id = p_product_id and p.maker_id = v_uid
  ) then
    raise exception 'product not found';
  end if;
  if v_slug = '' or p_title is null or btrim(p_title) = '' then
    raise exception 'slug and title are required';
  end if;

  if p_release_id is not null then
    update public.releases r
       set slug = v_slug,
           title = left(btrim(p_title), 200),
           body = p_body,
           version = nullif(left(btrim(coalesce(p_version,'')), 40), '')
     where r.id = p_release_id
       and r.product_id = p_product_id
       and r.status = 'draft'
    returning r.id into v_id;
    if v_id is null then
      raise exception 'release not found or not a draft';
    end if;
    return v_id;
  end if;

  insert into public.releases
    (product_id, slug, title, body, version)
  values
    (p_product_id, v_slug, left(btrim(p_title), 200), p_body,
     nullif(left(btrim(coalesce(p_version,'')), 40), ''))
  returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.release_publish(p_release_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  r public.releases;
  v_event uuid;
begin
  select * into r
  from public.releases rel
  where rel.id = p_release_id
    and exists (
      select 1 from public.products p
      where p.id = rel.product_id and p.maker_id = v_uid
    )
  for update;
  if not found then
    raise exception 'release not found';
  end if;

  -- Coming-soon products do not get Releases: publish is gated on launch.
  if not exists (
    select 1 from public.products p
    where p.id = r.product_id and p.launched_at is not null
  ) then
    raise exception 'product is not launched yet';
  end if;

  update public.releases
     set status = 'published',
         published_at = coalesce(published_at, now())
   where id = r.id;

  -- Idempotent feed event: reuse releases.event_id if set, else an event whose
  -- payload already references this release. The feed is a view of the row.
  if r.event_id is not null then
    v_event := r.event_id;
  else
    select e.id into v_event
    from public.events e
    where e.type = 'release'
      and e.payload->>'release_id' = r.id::text
    limit 1;
  end if;

  if v_event is null then
    insert into public.events
      (product_id, type, title, body, payload, published_at)
    values
      (r.product_id, 'release', r.title,
       coalesce(r.body, ''),
       jsonb_build_object('release_id', r.id, 'version', r.version),
       coalesce(r.published_at, now()))
    returning id into v_event;
  end if;

  update public.releases
     set event_id = v_event
   where id = r.id and event_id is null;

  return r.id;
end;
$function$;

create or replace function public.release_list_maker(p_product_id uuid)
returns setof public.releases
language sql
stable
security invoker
set search_path = ''
as $function$
  select r.*
  from public.releases r
  where r.product_id = p_product_id
  order by r.created_at desc
  limit 200;
$function$;

create or replace function public.release_list_public(p_product_slug text)
returns setof public.releases
language sql
stable
security invoker
set search_path = ''
as $function$
  select r.*
  from public.releases r
  join public.products p on p.id = r.product_id
  where p.slug = p_product_slug
    and p.deleted_at is null
    and r.status = 'published'
  order by r.published_at desc
  limit 100;
$function$;

-- ---------------------------------------------------------------------------
-- 8. Table grants — least privilege, no TRUNCATE (RLS does not protect TRUNCATE)
-- ---------------------------------------------------------------------------

-- This database carries ALTER DEFAULT PRIVILEGES that grant ALL (incl. TRUNCATE)
-- on new tables to anon/authenticated. RLS gates rows, but TRUNCATE is not a
-- row operation and bypasses RLS entirely — so it is revoked below, along with
-- every privilege the API surface does not need.

revoke all on public.feedback_items from anon;
revoke truncate, delete, insert on public.feedback_items from authenticated;

revoke all on public.inbox_threads from anon;
revoke truncate, delete, insert on public.inbox_threads from authenticated;

revoke all on public.inbox_messages from anon;
revoke truncate, delete on public.inbox_messages from authenticated;

revoke insert, update, delete, truncate on public.releases from anon;
revoke truncate on public.releases from authenticated;

revoke insert, update, delete, truncate on public.customer_stories from anon;
revoke truncate on public.customer_stories from authenticated;

-- products/events have public SELECT policies but were missing the anon table
-- privilege (SQL-created tables get no automatic Data API grants). Grant to
-- match the existing policies; RLS still scopes the rows.
grant select on public.products to anon;
grant select on public.events to anon;

-- ---------------------------------------------------------------------------
-- 9. Execute grants (default PUBLIC execute is too wide for maker-only RPCs)
-- ---------------------------------------------------------------------------

revoke execute on function public.get_my_products() from anon;
revoke execute on function public.set_active_product(uuid) from anon;
revoke execute on function public.feedback_list(uuid, text, text) from anon;
revoke execute on function public.feedback_set_status(uuid, text) from anon;
revoke execute on function public.inbox_list(uuid) from anon;
revoke execute on function public.inbox_thread(uuid) from anon;
revoke execute on function public.inbox_reply(uuid, text) from anon;
revoke execute on function public.inbox_mark_read(uuid) from anon;
revoke execute on function public.release_upsert(uuid, text, text, text, text, uuid) from anon;
revoke execute on function public.release_publish(uuid) from anon;
revoke execute on function public.release_list_maker(uuid) from anon;
revoke execute on function public.release_list_public(text) from anon;

grant execute on function public.feedback_create(uuid, text, text, text, text, uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.release_list_public(text) to anon, authenticated;
