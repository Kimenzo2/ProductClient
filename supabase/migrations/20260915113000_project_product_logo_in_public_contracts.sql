-- Keep uploaded product logos in every public product projection.
-- The submit flow already stores a durable product-assets URL in both
-- products.logo_url and products.avatar. These RPCs were omitting it from
-- their JSON contracts, so launched products lost their logo on the feed and
-- public product page.

create or replace function public.launch_house(
  p_filter text default 'all',
  p_tz text default 'UTC',
  p_after_score numeric default null,
  p_after_id uuid default null,
  p_limit integer default 48
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_result jsonb;
  v_limit integer := least(greatest(coalesce(p_limit, 48), 1), 100);
begin
  if p_filter not in ('all', 'just_shipped', 'coming', 'releases', 'boosted', 'following') then
    raise exception using errcode = '22023', message = 'INVALID_LAUNCH_FILTER';
  end if;

  with unified as (
    select
      e.id,
      e.product_id,
      e.type,
      e.title,
      e.body,
      e.payload,
      e.published_at,
      e.event_age_hours,
      e.magnitude,
      e.heat_score,
      e.medal,
      e.video_url,
      e.video_poster_url,
      e.video_duration_s,
      p.name as product_name,
      p.slug as product_slug,
      coalesce(p.avatar, p.logo_url) as product_avatar,
      p.live_url,
      p.category,
      p.current_score,
      p.follow_count,
      p.docs_nonempty,
      p.roadmap_or_feedback_nonempty,
      p.status_page_nonempty,
      public.compute_complete(p.id) as complete,
      greatest(0, extract(epoch from (now() - e.published_at)) / 3600.0) as age_hours,
      power(2, -greatest(0, extract(epoch from (now() - e.published_at)) / 3600.0) / public.cfg_num('FRESHNESS_HALF_LIFE_HOURS')) as freshness,
      exists (
        select 1 from public.boosts b
        where b.event_id = e.id
          and b.status = 'live'
          and now() between b.started_at and b.ends_at
      ) as is_live,
      exists (
        select 1 from public.spotlights s
        where s.event_id = e.id
          and s.status = 'live'
          and now() between s.started_at and s.ends_at
      ) as is_spotlight,
      exists (
        select 1 from public.follows f
        where f.product_id = p.id and f.user_id = (select auth.uid())
      ) as is_following
    from public.events e
    join public.products p on p.id = e.product_id
    where e.published_at <= now()
      and e.deleted_at is null
      and e.hidden_at is null
      and p.deleted_at is null
  ), newest as (
    select distinct on (product_id) *
    from unified
    order by product_id, is_live desc, published_at desc
  ), filtered as (
    select *
    from newest
    where case p_filter
      when 'all' then true
      when 'just_shipped' then age_hours < public.cfg_num('NOW_HOURS')
      when 'coming' then type = 'coming_soon'
      when 'releases' then type in ('release', 'changelog', 'fix')
      when 'boosted' then is_live and magnitude >= public.cfg_num('MAGNITUDE_FLOOR')
      when 'following' then is_following
      else false
    end
  ), scored as (
    select
      f.*,
      public.altar_score(f.id) as altar_value,
      public.nave_score(f.id) as nave_value,
      greatest(0, f.current_score) * f.freshness as courtyard_value,
      greatest(0, f.magnitude) >= public.cfg_num('MAGNITUDE_FLOOR') and f.is_live as is_boosted,
      case when f.is_live then 1 else 0 end as live_sort,
      row_number() over (partition by f.is_live order by public.nave_score(f.id) desc nulls last, f.id) as live_position,
      count(*) filter (where f.is_live) over () as live_total
    from filtered f
  ), cards as (
    select
      s.*,
      jsonb_build_object(
        'id', s.id,
        'product_id', s.product_id,
        'product', jsonb_build_object(
          'name', s.product_name,
          'slug', s.product_slug,
          'avatar', s.product_avatar,
          'live_url', s.live_url,
          'category', s.category,
          'follow_count', s.follow_count
        ),
        'event', jsonb_build_object(
          'type', s.type,
          'title', s.title,
          'body', s.body,
          'published_at', s.published_at,
          'age_hours', s.age_hours,
          'video_url', s.video_url,
          'video_poster_url', s.video_poster_url,
          'video_duration_s', s.video_duration_s
        ),
        'labels', to_jsonb(array_remove(array[
          case when s.medal is not null then initcap(s.medal) end,
          case when s.is_boosted then 'Boosted' end,
          case when s.is_spotlight then 'Spotlight' end,
          case when s.age_hours < public.cfg_num('NOW_HOURS') then 'Just shipped' end,
          case when s.type = 'coming_soon' then 'Coming' end,
          case when s.current_score >= 0.9 then 'Current' end
        ], null)),
        'surfaces', jsonb_build_object(
          'docs', s.docs_nonempty,
          'roadmap_or_feedback', s.roadmap_or_feedback_nonempty,
          'status', s.status_page_nonempty
        ),
        'current', greatest(0, s.current_score),
        'complete', greatest(0, s.complete),
        'magnitude', greatest(0, s.magnitude),
        'heat', greatest(0, coalesce(s.heat_score, 0)),
        'is_following', s.is_following,
        'arena', case when s.is_live then jsonb_build_object('position', s.live_position, 'total', s.live_total) else null end
      ) as card
    from scored s
  ), altar_ids as (
    select id
    from cards
    where complete >= public.cfg_num('ALTAR_COMPLETE_MIN')
    order by altar_value desc nulls last, id
    limit 3
  ), altar_cards as (
    select c.card || jsonb_build_object('section', 'altar') as card, c.altar_value as sort_value, c.id
    from cards c join altar_ids a on a.id = c.id
  ), nave_ids as (
    select c.id
    from cards c
    where not exists (select 1 from altar_ids a where a.id = c.id)
    order by c.nave_value desc nulls last, c.id
    limit greatest(0, public.worthful_depth((select count(*)::integer from cards)) - (select count(*) from altar_ids))
  ), nave_cards as (
    select c.card || jsonb_build_object('section', 'nave') as card, c.nave_value as sort_value, c.id
    from cards c join nave_ids n on n.id = c.id
  ), courtyard_cards as (
    select c.card || jsonb_build_object('section', 'courtyard') as card, c.courtyard_value as sort_value, c.id
    from cards c
    where not exists (select 1 from altar_ids a where a.id = c.id)
      and not exists (select 1 from nave_ids n where n.id = c.id)
      and (
        p_after_score is null
        or c.courtyard_value < p_after_score
        or (c.courtyard_value = p_after_score and c.id < p_after_id)
      )
    order by c.courtyard_value desc nulls last, c.id
    limit v_limit
  ), now_cards as (
    select c.card || jsonb_build_object('section', 'now') as card, c.magnitude, c.freshness, c.id
    from cards c
    where c.age_hours < public.cfg_num('NOW_HOURS')
    order by c.magnitude desc, c.freshness desc, c.id
    limit 24
  )
  select jsonb_build_object(
    'filter', p_filter,
    'timezone', coalesce(nullif(p_tz, ''), 'UTC'),
    'count', (select count(*) from cards),
    'worthful_depth', public.worthful_depth((select count(*)::integer from cards)),
    'altar', coalesce((select jsonb_agg(card order by sort_value desc nulls last, id) from altar_cards), '[]'::jsonb),
    'nave', coalesce((select jsonb_agg(card order by sort_value desc nulls last, id) from nave_cards), '[]'::jsonb),
    'courtyard', coalesce((select jsonb_agg(card order by sort_value desc nulls last, id) from courtyard_cards), '[]'::jsonb),
    'now', coalesce((select jsonb_agg(card order by magnitude desc, freshness desc, id) from now_cards), '[]'::jsonb),
    'next_cursor', case
      when (select count(*) from courtyard_cards) = v_limit then (
        select jsonb_build_object('after_score', sort_value, 'after_id', id)
        from courtyard_cards
        order by sort_value asc nulls first, id asc
        limit 1
      )
      else null
    end
  ) into v_result;

  return v_result;
end;
$function$;

create or replace function public.public_product_page(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  with visible_product as (
    select p.id, p.name, p.slug, coalesce(p.avatar, p.logo_url) as avatar, p.live_url, p.category, p.follow_count
    from public.products p
    where p.slug = p_slug
      and p.deleted_at is null
      and exists (
        select 1
        from public.events e
        where e.product_id = p.id
          and e.published_at <= now()
          and e.deleted_at is null
          and e.hidden_at is null
      )
  )
  select jsonb_build_object(
    'product', jsonb_build_object(
      'name', p.name,
      'slug', p.slug,
      'avatar', p.avatar,
      'live_url', p.live_url,
      'category', p.category,
      'follow_count', p.follow_count
    ),
    'events', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'type', e.type,
          'title', e.title,
          'body', e.body,
          'published_at', e.published_at,
          'video_url', e.video_url,
          'video_poster_url', e.video_poster_url,
          'video_duration_s', e.video_duration_s
        ) order by e.published_at desc, e.id desc
      )
      from public.events e
      where e.product_id = p.id
        and e.published_at <= now()
        and e.deleted_at is null
        and e.hidden_at is null
    ), '[]'::jsonb)
  )
  from visible_product p;
$function$;

select pg_notify('pgrst', 'reload schema');
