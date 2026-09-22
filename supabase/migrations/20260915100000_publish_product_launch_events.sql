-- Keep product publication and the public launch feed in one contract.
-- A product marked Live without a public event is invisible to launch_house.

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

  -- launch_house reads public.events, not products.status. Create the public
  -- event once, after the product write succeeds, so publication is atomic.
  if not v_draft and not exists (
    select 1
    from public.events e
    where e.product_id = v_product.id
      and e.type = case when v_availability = 'live' then 'launch' else 'coming_soon' end
      and e.deleted_at is null
      and e.hidden_at is null
  ) then
    perform public.publish_event(
      v_product.id,
      case when v_availability = 'live' then 'launch' else 'coming_soon' end,
      coalesce(nullif(v_product.launch_title, ''), v_product.name),
      coalesce(v_product.launch_note, v_product.description, ''),
      jsonb_build_object(
        'source', 'product_publish',
        'product_slug', v_product.slug,
        'availability', v_availability,
        'screenshots', coalesce(v_product.screenshots, '[]'::jsonb),
        'extra_links', coalesce(v_product.extra_links, '[]'::jsonb)
      ),
      now(),
      v_product.video_url,
      null,
      null
    );
  end if;

  return v_product;
end;
$function$;

revoke execute on function public.upsert_product_pad(jsonb) from public, anon;
grant execute on function public.upsert_product_pad(jsonb) to authenticated;

-- Repair products published before the event contract existed.
insert into public.events (
  product_id, type, title, body, payload, published_at, video_url
)
select
  p.id,
  case when coalesce(p.availability, 'live') = 'live' then 'launch' else 'coming_soon' end,
  coalesce(nullif(p.launch_title, ''), p.name),
  coalesce(p.launch_note, p.description, ''),
  jsonb_build_object(
    'source', 'product_publish_backfill',
    'product_slug', p.slug,
    'availability', coalesce(p.availability, 'live'),
    'screenshots', coalesce(p.screenshots, '[]'::jsonb),
    'extra_links', coalesce(p.extra_links, '[]'::jsonb)
  ),
  least(coalesce(p.launched_at, p.created_at, now()), now()),
  p.video_url
from public.products p
where p.status = 'Live'
  and p.deleted_at is null
  and not exists (
    select 1
    from public.events e
    where e.product_id = p.id
      and e.type in ('launch', 'coming_soon')
      and e.deleted_at is null
      and e.hidden_at is null
  );

select pg_notify('pgrst', 'reload schema');
