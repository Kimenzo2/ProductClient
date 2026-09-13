-- Smoke tests for the four domains — single transaction, ROLLED BACK at the end.
-- Run via the Management API query endpoint (or psql). Nothing persists.
-- Impersonation: set local role + request.jwt.claims (Supabase testing convention).
-- Ids are passed between statements via a temp table (no psql meta-commands).
begin;

create temp table t_ids (k text primary key, id uuid not null);

-- ---------------------------------------------------------------- fixtures
-- The query runner's service_role lacks auth.users grants; the Management API
-- session runs as supabase_admin, so fixtures use that role.
set local role supabase_admin;

insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud)
values
  ('11111111-1111-1111-1111-111111111111', 'makerA@test.local', 'x', now(), now(), now(), '{}', '{}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'makerB@test.local', 'x', now(), now(), now(), '{}', '{}', 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'makerA@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'makerB@test.local')
on conflict (id) do nothing;

insert into public.products (id, maker_id, name, slug, launched_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Product A', 'product-a', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Product B', 'product-b', null)
on conflict (id) do nothing;

-- ------------------------------------------------- tests 1 + 2: public feedback
-- Two anon submissions on the launched product, different sources.
set local role anon;
set local request.jwt.claims = '{}';

do $$
declare v_id uuid;
begin
  v_id := public.feedback_create(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'docs', 'Docs are unclear on step 3',
    'question', 'Step 3 unclear', null, 'https://product-a.com/docs/x', 'Vera Visitor', 'vera@example.com', 'Docs', 'ua-test');
  insert into t_ids values ('feedback_docs', v_id);

  v_id := public.feedback_create(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'launch', 'Loved the demo, wants dark mode',
    'idea', null, null, 'https://product-a.com', 'Vera Visitor', 'vera@example.com', 'Launch page', 'ua-test');
  insert into t_ids values ('feedback_launch', v_id);
end $$;

-- Coming-soon product must reject public feedback.
do $$
begin
  perform public.feedback_create('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'docs', 'should fail');
  raise exception 'TEST FAILED: coming-soon product accepted public feedback';
exception
  when others then
    if sqlerrm not like 'feedback is not open%' then raise; end if;
end $$;

-- ------------------------------------------------------- maker A perspective
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Switcher law: maker A sees only product A.
do $$
begin
  if (select count(*) from public.get_my_products()) <> 1
     or (select slug from public.get_my_products() limit 1) <> 'product-a' then
    raise exception 'TEST FAILED: get_my_products is not scoped to own products';
  end if;
end $$;

-- Test 1: both sources land under the same product Feedback list.
do $$
begin
  if (select count(*) from public.feedback_list('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, null)) <> 2 then
    raise exception 'TEST FAILED: expected 2 feedback items (docs + launch) for product A';
  end if;
end $$;

-- Test 2: one thread per feedback; maker reply lands in inbox_messages; unread clears.
do $$
declare
  v_thread uuid;
  v_msgs int;
  v_role text;
begin
  if (select count(*) from public.inbox_list('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')) <> 2 then
    raise exception 'TEST FAILED: expected 2 inbox threads';
  end if;

  select t.id into v_thread
  from public.inbox_threads t
  where t.subject_id = (select id from t_ids where k = 'feedback_docs');
  if v_thread is null then
    raise exception 'TEST FAILED: feedback_docs thread missing';
  end if;

  perform public.inbox_mark_read(v_thread);
  perform public.inbox_reply(v_thread, 'Thanks — fixing step 3 now.');

  select count(*), max(author_role) into v_msgs, v_role
  from public.inbox_messages where thread_id = v_thread;
  if v_msgs <> 2 or v_role <> 'maker' then
    raise exception 'TEST FAILED: expected 2 messages ending with maker role, got % / %', v_msgs, v_role;
  end if;

  if exists (select 1 from public.inbox_threads where id = v_thread and unread_maker) then
    raise exception 'TEST FAILED: unread_maker not cleared after reply';
  end if;
end $$;

-- Test 2b: Inbox is not Notifications — no notifications table may exist.
do $$
begin
  if to_regclass('public.notifications') is not null then
    raise exception 'TEST FAILED: notifications table must not exist';
  end if;
end $$;

-- ----------------------------------------------- test 3: two-product isolation
set local role supabase_admin;
insert into public.inbox_threads (product_id, subject_type, title, last_preview)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'message', 'B thread', 'maker B only');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
begin
  if (select count(*) from public.inbox_list('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')) <> 2 then
    raise exception 'TEST FAILED: maker A inbox count wrong (expected exactly 2 own threads)';
  end if;
end $$;

-- Cross-product leak probe: maker B must not read A's feedback or inbox.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
begin
  if (select count(*) from public.feedback_list('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, null)) <> 0 then
    raise exception 'TEST FAILED: maker B can read product A feedback';
  end if;
  if exists (
    select 1 from public.inbox_messages m
    join public.inbox_threads t on t.id = m.thread_id
    where t.product_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ) then
    raise exception 'TEST FAILED: maker B can read product A inbox';
  end if;
end $$;

-- ------------------------------------------ test 4: publish gate on launch
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
do $$
declare v_id uuid;
begin
  v_id := public.release_upsert('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'r1', 'B release', 'body');
  begin
    perform public.release_publish(v_id);
    raise exception 'TEST FAILED: coming-soon product published a release';
  exception
    when others then
      if sqlerrm not like 'product is not launched%' then raise; end if;
  end;
end $$;

-- ------------------------------- test 5: idempotent publish + feed event
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare v_id uuid; v_events int;
begin
  v_id := public.release_upsert('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'r1', 'First release', 'Shipped things', '1.0.0');
  insert into t_ids values ('release_a', v_id);
  perform public.release_publish(v_id);
  perform public.release_publish(v_id);

  select count(*) into v_events from public.events
   where payload->>'release_id' = v_id::text and type = 'release';
  if v_events <> 1 then
    raise exception 'TEST FAILED: expected exactly 1 feed event, got %', v_events;
  end if;
  if not exists (select 1 from public.releases where id = v_id and status = 'published' and event_id is not null) then
    raise exception 'TEST FAILED: release not published / event not linked';
  end if;
end $$;

-- Public release list: anon sees the published release on A, nothing from B.
set local role anon;
set local request.jwt.claims = '{}';
do $$
begin
  if (select count(*) from public.release_list_public('product-a')) <> 1 then
    raise exception 'TEST FAILED: public release list missing published release';
  end if;
  if (select count(*) from public.release_list_public('product-b')) <> 0 then
    raise exception 'TEST FAILED: public release list leaked coming-soon product';
  end if;
end $$;

-- --------------------------------------------- test 6: stories publish gate
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
declare v_id uuid;
begin
  insert into public.customer_stories (product_id, quote, author_name, published)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cut our onboarding in half.', 'Dana D.', false)
  returning id into v_id;
  insert into t_ids values ('story', v_id);
  update public.customer_stories set published = true where id = v_id;
end $$;

set local role anon;
do $$
begin
  if (select count(*) from public.customer_stories) <> 1 then
    raise exception 'TEST FAILED: anon story read does not match published set';
  end if;
end $$;

-- anon has no direct SELECT into feedback_items (write path is the RPC only).
do $$
begin
  if (select count(*) from public.feedback_items) <> 0 then
    raise exception 'TEST FAILED: anon can select feedback_items';
  end if;
end $$;

rollback;
