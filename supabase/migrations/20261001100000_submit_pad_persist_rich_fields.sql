-- Submit Pad's current payload includes these rich profile fields, but the
-- previous upsert only wrote the basic launch fields and silently dropped them.
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
  v_platforms text[];
  v_id uuid;
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
  select coalesce(array_agg(item.value), '{}'::text[])
  into v_platforms
  from jsonb_array_elements_text(coalesce(p_payload->'platforms', '[]'::jsonb)) as item(value);

  -- Stable identity: an owned id wins over slug matching, including renames.
  begin
    v_id := nullif(trim(p_payload->>'id'), '')::uuid;
  exception when others then
    v_id := null;
  end;

  if v_id is not null then
    select * into v_product
    from public.products
    where id = v_id and maker_id = v_uid and deleted_at is null
    limit 1;
  end if;

  if v_product.id is null then
    select * into v_product
    from public.products
    where maker_id = v_uid and slug = v_slug and deleted_at is null
    limit 1;
  end if;

  if v_product.id is null then
    insert into public.products (
      maker_id, slug, name, logo_url, avatar, website, tagline, description,
      categories, pricing, availability, screenshots, video_url, extra_links,
      launch_title, launch_note, you_built_this, draft, status, launched_at,
      capabilities, differentiators, audience_for, how_it_works,
      pricing_summary, pricing_plans, platforms, faqs
    ) values (
      v_uid, v_slug, trim(p_payload->>'name'), nullif(p_payload->>'logo_url', ''),
      nullif(p_payload->>'logo_url', ''), nullif(p_payload->>'website', ''),
      nullif(p_payload->>'tagline', ''), nullif(p_payload->>'description', ''),
      v_categories, nullif(p_payload->>'pricing', ''), v_availability,
      coalesce(p_payload->'screenshots', '[]'::jsonb), nullif(p_payload->>'video_url', ''),
      coalesce(p_payload->'extra_links', '[]'::jsonb), nullif(p_payload->>'launch_title', ''),
      nullif(p_payload->>'launch_note', ''), coalesce((p_payload->>'you_built_this')::boolean, true),
      v_draft, case when v_draft then 'Draft' else 'Live' end,
      case when not v_draft and v_availability = 'live' then now() else null end,
      coalesce(p_payload->'capabilities', '[]'::jsonb),
      coalesce(p_payload->'differentiators', '[]'::jsonb),
      coalesce(p_payload->'audience_for', '[]'::jsonb),
      coalesce(p_payload->'how_it_works', '[]'::jsonb),
      nullif(trim(p_payload->>'pricing_summary'), ''),
      coalesce(p_payload->'pricing_plans', '[]'::jsonb),
      v_platforms,
      coalesce(p_payload->'faqs', '[]'::jsonb)
    ) returning * into v_product;
  else
    if v_slug <> v_product.slug and exists (
      select 1
      from public.products
      where slug = v_slug and id <> v_product.id and deleted_at is null
    ) then
      raise exception 'product slug already taken';
    end if;
    update public.products
    set slug = v_slug,
        name = trim(p_payload->>'name'),
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
        capabilities = case when p_payload ? 'capabilities' then coalesce(p_payload->'capabilities', '[]'::jsonb) else capabilities end,
        differentiators = case when p_payload ? 'differentiators' then coalesce(p_payload->'differentiators', '[]'::jsonb) else differentiators end,
        audience_for = case when p_payload ? 'audience_for' then coalesce(p_payload->'audience_for', '[]'::jsonb) else audience_for end,
        how_it_works = case when p_payload ? 'how_it_works' then coalesce(p_payload->'how_it_works', '[]'::jsonb) else how_it_works end,
        pricing_summary = case when p_payload ? 'pricing_summary' then nullif(trim(p_payload->>'pricing_summary'), '') else pricing_summary end,
        pricing_plans = case when p_payload ? 'pricing_plans' then coalesce(p_payload->'pricing_plans', '[]'::jsonb) else pricing_plans end,
        platforms = case when p_payload ? 'platforms' then v_platforms else platforms end,
        faqs = case when p_payload ? 'faqs' then coalesce(p_payload->'faqs', '[]'::jsonb) else faqs end,
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

  -- Keep the existing atomic publication behavior for newly published products.
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

select pg_notify('pgrst', 'reload schema');
