-- Product Agent — grounding pack (FTS v1, no vectors, no web crawl).
-- Returns ranked chunks for one product_id only. Empty query => latest-first snapshot.
-- Sources: listing, releases(published), customer_stories(published), launch note,
-- tenant docs (docs_releases.document), roadmap (roadmap_docs.doc),
-- incidents + status page snapshot for that product's tenant.

create or replace function public.agent_grounding(p_product_id uuid, p_query text default '', p_limit integer default 12)
returns table (source text, ref text, title text, snippet text, rank real)
language plpgsql stable security invoker set search_path = '' as $function$
declare
  v_tenant uuid; v_slug text; v_q tsquery; v_has_q boolean := false;
begin
  select p.tenant_id, p.slug into v_tenant, v_slug from public.products p where p.id = p_product_id;
  if not found then return; end if;
  if btrim(coalesce(p_query,'')) <> '' then
    begin v_q := plainto_tsquery('english', p_query); v_has_q := true;
    exception when others then v_has_q := false; end;
  end if;

  return query
  with listing as (
    select 'listing'::text as source, ('/p/' || v_slug)::text as ref,
      coalesce(p.name,'')::text as title,
      left(coalesce(p.tagline,'') || ' ' || coalesce(p.description,'') || ' ' ||
        coalesce(p.pricing_summary,'') || ' ' || coalesce(p.launch_note,''), 600)::text as snippet,
      case when v_has_q then ts_rank(to_tsvector('english',
        coalesce(p.name,'') || ' ' || coalesce(p.tagline,'') || ' ' || coalesce(p.description,'') || ' ' ||
        coalesce(p.pricing_summary,'') || ' ' || coalesce(array_to_string(p.platforms,' '),'')), v_q) else 1.0 end::real as rank
    from public.products p where p.id = p_product_id
  ),
  rels as (
    select 'release'::text as source, ('/p/' || v_slug)::text as ref,
      r.title::text as title, left(coalesce(r.body,''), 600)::text as snippet,
      case when v_has_q then ts_rank(to_tsvector('english', coalesce(r.title,'') || ' ' || coalesce(r.body,'')), v_q) else 0.9 end::real as rank
    from public.releases r where r.product_id = p_product_id and r.status = 'published'
    order by r.published_at desc limit 8
  ),
  stories as (
    select 'story'::text as source, ('/p/' || v_slug)::text as ref,
      coalesce(s.company, s.author_name, 'Customer story')::text as title, left(s.quote, 600)::text as snippet,
      case when v_has_q then ts_rank(to_tsvector('english', s.quote), v_q) else 0.5 end::real as rank
    from public.customer_stories s where s.product_id = p_product_id and s.published = true
    order by s.sort_order limit 4
  ),
  docs as (
    select 'docs'::text as source, ('/docs/' || v_slug)::text as ref,
      left(coalesce(d.document->>'title', 'Docs'), 200)::text as title,
      left(coalesce(d.document->>'content', d.document::text, ''), 600)::text as snippet,
      case when v_has_q then ts_rank(to_tsvector('english', left(coalesce(d.document->>'content', d.document::text, ''), 4000)), v_q) else 0.8 end::real as rank
    from public.docs_releases d where d.tenant_id = v_tenant
    order by d.version desc limit 6
  ),
  roadmap as (
    select 'roadmap'::text as source, ('/p/' || v_slug)::text as ref,
      'Roadmap'::text as title, left(r.doc::text, 600)::text as snippet,
      case when v_has_q then ts_rank(to_tsvector('english', left(r.doc::text, 4000)), v_q) else 0.6 end::real as rank
    from public.roadmap_docs r where r.tenant_id = v_tenant limit 3
  ),
  incidents as (
    select 'status'::text as source, ('/p/' || v_slug)::text as ref,
      i.title::text as title,
      left(coalesce(i.summary,'') || ' ' || coalesce(i.status,''), 600)::text as snippet,
      case when i.status <> 'resolved' then 2.0
        when v_has_q then ts_rank(to_tsvector('english', coalesce(i.title,'') || ' ' || coalesce(i.summary,'')), v_q)
        else 0.7 end::real as rank
    from public.incidents i where i.tenant_id = v_tenant
    order by case when i.status <> 'resolved' then 0 else 1 end, i.started_at desc limit 5
  ),
  launch as (
    select 'launch'::text as source, ('/p/' || v_slug)::text as ref,
      l.title::text as title, left(coalesce(l.description,''), 600)::text as snippet, 0.65::real as rank
    from public.product_launches l where l.product_slug = v_slug
    order by l.posted_at desc limit 2
  ),
  all_chunks as (
    select * from listing union all select * from rels union all select * from stories
    union all select * from docs union all select * from roadmap union all select * from incidents union all select * from launch
  )
  select a.source, a.ref, a.title, a.snippet, a.rank from all_chunks a
  where (not v_has_q) or (a.snippet ilike '%' || split_part(btrim(p_query),' ',1) || '%') or (a.rank > 0)
  order by a.rank desc limit greatest(1, least(50, p_limit));
end; $function$;

revoke execute on function public.agent_grounding(uuid, text, integer) from anon;
grant execute on function public.agent_grounding(uuid, text, integer) to authenticated;
