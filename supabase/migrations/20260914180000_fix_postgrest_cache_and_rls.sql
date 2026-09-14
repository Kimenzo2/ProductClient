-- Product Submit Pad contract repair.
-- The live products table was missing the fields used by the dashboard and the
-- client was stashing a payload in profiles before calling an unrelated RPC.
-- Keep ownership subject-based: auth.uid() is the only maker identity.

alter table public.products
  add column if not exists logo_url text,
  add column if not exists avatar text,
  add column if not exists website text,
  add column if not exists tagline text,
  add column if not exists description text,
  add column if not exists categories text[] not null default '{}'::text[],
  add column if not exists pricing text,
  add column if not exists availability text not null default 'live',
  add column if not exists screenshots jsonb not null default '[]'::jsonb,
  add column if not exists video_url text,
  add column if not exists extra_links jsonb not null default '[]'::jsonb,
  add column if not exists launch_title text,
  add column if not exists launch_note text,
  add column if not exists you_built_this boolean not null default true,
  add column if not exists draft boolean not null default true,
  add column if not exists status text not null default 'Draft';

alter table public.profiles
  add column if not exists active_product_id uuid references public.products(id) on delete set null;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select on table public.products to anon;
grant select, update on table public.profiles to authenticated;

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

revoke execute on function public.get_my_products() from anon;
grant execute on function public.get_my_products() to authenticated;

create or replace function public.set_active_product(p_product_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and p.maker_id = v_uid
      and p.deleted_at is null
  ) then
    return false;
  end if;

  update public.profiles
  set active_product_id = p_product_id
  where id = v_uid;

  return found;
end;
$function$;

revoke execute on function public.set_active_product(uuid) from anon;
grant execute on function public.set_active_product(uuid) to authenticated;

create or replace function public.upsert_product_pad(p_payload jsonb)
returns public.products
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_product public.products;
  v_slug text;
  v_draft boolean;
  v_availability text;
  v_categories text[];
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid product payload';
  end if;
  if nullif(trim(p_payload->>'name'), '') is null then
    raise exception 'product name is required';
  end if;

  v_slug := regexp_replace(
    lower(coalesce(nullif(trim(p_payload->>'slug'), ''), trim(p_payload->>'name'))),
    '[^a-z0-9]+', '-', 'g'
  );
  v_slug := trim(both '-' from left(v_slug, 63));
  if v_slug = '' or char_length(v_slug) < 3 then
    v_slug := 'product-' || substr(md5(random()::text), 1, 6);
  end if;

  v_draft := coalesce((p_payload->>'draft')::boolean, true);
  v_availability := coalesce(nullif(trim(p_payload->>'availability'), ''), 'live');
  select coalesce(array_agg(item.value order by item.ordinality), '{}'::text[])
  into v_categories
  from jsonb_array_elements_text(coalesce(p_payload->'categories', '[]'::jsonb))
    with ordinality as item(value, ordinality);

  select * into v_product
  from public.products
  where maker_id = v_uid and slug = v_slug and deleted_at is null
  limit 1;

  if v_product.id is null then
    insert into public.products (
      maker_id, slug, name, logo_url, avatar, website, tagline, description,
      categories, pricing, availability, screenshots, video_url, extra_links,
      launch_title, launch_note, you_built_this, draft, status, launched_at
    ) values (
      v_uid, v_slug, trim(p_payload->>'name'), nullif(p_payload->>'logo_url', ''),
      nullif(p_payload->>'logo_url', ''), nullif(p_payload->>'website', ''),
      nullif(p_payload->>'tagline', ''), nullif(p_payload->>'description', ''),
      v_categories, nullif(p_payload->>'pricing', ''), v_availability,
      coalesce(p_payload->'screenshots', '[]'::jsonb), nullif(p_payload->>'video_url', ''),
      coalesce(p_payload->'extra_links', '[]'::jsonb), nullif(p_payload->>'launch_title', ''),
      nullif(p_payload->>'launch_note', ''), coalesce((p_payload->>'you_built_this')::boolean, true),
      v_draft, case when v_draft then 'Draft' else 'Live' end,
      case when not v_draft and v_availability = 'live' then now() else null end
    ) returning * into v_product;
  else
    update public.products
    set name = trim(p_payload->>'name'),
        logo_url = nullif(p_payload->>'logo_url', ''),
        avatar = nullif(p_payload->>'logo_url', ''),
        website = nullif(p_payload->>'website', ''),
        tagline = nullif(p_payload->>'tagline', ''),
        description = nullif(p_payload->>'description', ''),
        categories = v_categories,
        pricing = nullif(p_payload->>'pricing', ''),
        availability = v_availability,
        screenshots = coalesce(p_payload->'screenshots', '[]'::jsonb),
        video_url = nullif(p_payload->>'video_url', ''),
        extra_links = coalesce(p_payload->'extra_links', '[]'::jsonb),
        launch_title = nullif(p_payload->>'launch_title', ''),
        launch_note = nullif(p_payload->>'launch_note', ''),
        you_built_this = coalesce((p_payload->>'you_built_this')::boolean, true),
        draft = v_draft,
        status = case when v_draft then 'Draft' else 'Live' end,
        launched_at = case
          when not v_draft and v_availability = 'live' then coalesce(launched_at, now())
          when not v_draft then null
          else launched_at
        end
    where id = v_product.id
    returning * into v_product;
  end if;

  update public.profiles
  set active_product_id = v_product.id
  where id = v_uid;

  return v_product;
end;
$function$;

revoke execute on function public.upsert_product_pad(jsonb) from public, anon;
grant execute on function public.upsert_product_pad(jsonb) to authenticated;

-- Native pgrst_ddl_watch is present on the project; this explicit notification
-- also refreshes the schema cache after the migration completes.
select pg_notify('pgrst', 'reload schema');
