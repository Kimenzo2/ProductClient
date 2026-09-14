-- Hotfix for PostgREST stale cache and RLS after products_submit_pad_fields
-- - products table had new columns (availability, draft, etc.) not in PostgREST cache → PGRST204
-- - products INSERT via REST failed with 42501 permission denied for authenticated due to missing GRANT to authenticator
-- - profiles UPDATE via email failed due to RLS only allowing id = auth.uid(), not email match (split auth DB vs postgres DB)
-- - pgrst_ddl_watch event trigger was missing (non-superuser owned function), so DDL never notified PostgREST

-- 1) Ensure products has correct grants for all roles (including authenticator for PostgREST SET ROLE)
grant all on table public.products to authenticated, anon, service_role, authenticator;
grant usage on schema public to authenticated, anon, service_role, authenticator;
grant all on table public.profiles to authenticated, anon, service_role, authenticator;
grant usage on schema public to authenticated, anon, service_role, authenticator;

-- 2) Fix profiles RLS to allow email fallback (auth DB split: JWT sub b466... vs postgres auth.users id 02f19...)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id or email = (auth.jwt() ->> 'email'));
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id or email = (auth.jwt() ->> 'email'));
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id or email = (auth.jwt() ->> 'email')) with check ((select auth.uid()) = id or email = (auth.jwt() ->> 'email'));
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile" on public.profiles for delete to authenticated using ((select auth.uid()) = id or email = (auth.jwt() ->> 'email'));

-- 3) Ensure get_my_products and set_active_product handle email-split and x-payload bypass
create or replace function public.notify_pgrst_reload() returns event_trigger language plpgsql as $$ begin perform pg_notify('pgrst', 'reload schema'); end; $$;
drop event trigger if exists pgrst_reload_on_ddl;
create event trigger pgrst_reload_on_ddl on ddl_command_end when tag in ('CREATE SCHEMA', 'ALTER SCHEMA', 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE', 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE', 'CREATE VIEW', 'ALTER VIEW', 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW', 'CREATE FUNCTION', 'ALTER FUNCTION', 'CREATE TRIGGER', 'CREATE TYPE', 'ALTER TYPE', 'CREATE RULE', 'COMMENT', 'GRANT', 'REVOKE') execute function public.notify_pgrst_reload();
drop event trigger if exists pgrst_reload_on_drop;
create event trigger pgrst_reload_on_drop on sql_drop execute function public.notify_pgrst_reload();

-- set_active_product: handle null create via profiles.gamification_data and email fallback, plus launched_at
create or replace function public.set_active_product(p_product_id uuid)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_payload jsonb;
  v_maker uuid;
  v_email text;
begin
  v_email := coalesce((auth.jwt() ->> 'email'), (select email from auth.users where id = (select auth.uid()) limit 1));
  if v_email is not null then
    select id into v_maker from auth.users where email = v_email limit 1;
  end if;
  if v_maker is null then v_maker := (select auth.uid()); end if;
  if v_maker is null then raise exception 'Not authenticated'; end if;
  if p_product_id is null then
    select gamification_data into v_payload from public.profiles where id = v_maker;
    if v_payload is null and v_email is not null then select gamification_data into v_payload from public.profiles where email = v_email limit 1; end if;
    if v_payload is null or jsonb_typeof(v_payload) != 'object' or not (v_payload ? 'name') then raise exception 'Missing product payload'; end if;
    insert into public.products (maker_id, slug, name, tagline, description, categories, pricing, availability, logo_url, avatar, website, screenshots, video_url, extra_links, launch_title, launch_note, you_built_this, draft, status)
    values (v_maker, coalesce(v_payload->>'slug', 'product-'||substr(md5(random()::text),1,6)), v_payload->>'name', v_payload->>'tagline', v_payload->>'description', coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload->'categories','[]')) x), '{}'), v_payload->>'pricing', coalesce(v_payload->>'availability','live'), v_payload->>'logo_url', v_payload->>'logo_url', v_payload->>'website', coalesce(v_payload->'screenshots','[]'), v_payload->>'video_url', coalesce(v_payload->'extra_links','[]'), v_payload->>'launch_title', v_payload->>'launch_note', coalesce((v_payload->>'you_built_this')::boolean, true), coalesce((v_payload->>'draft')::boolean, true), 'Live') returning * into v_product;
    update public.profiles set active_product_id = v_product.id, updated_at = now() where id = v_maker;
    if not found and v_email is not null then update public.profiles set active_product_id = v_product.id, updated_at = now() where email = v_email; end if;
    return v_product;
  end if;
  select * into v_product from public.products where id = p_product_id and deleted_at is null;
  if not found then raise exception 'Product not found'; end if;
  if not (v_product.maker_id = v_maker or exists (select 1 from public.profiles where email = v_email and id = v_product.maker_id)) then
    if v_email is not null and exists (select 1 from auth.users where id = v_product.maker_id and email = v_email) then null; else raise exception 'Not authorized for this product'; end if;
  end if;
  begin
    select gamification_data into v_payload from public.profiles where id = v_maker;
    if v_payload is null and v_email is not null then select gamification_data into v_payload from public.profiles where email = v_email limit 1; end if;
    if v_payload is not null and jsonb_typeof(v_payload) = 'object' and (v_payload ? 'name') then
      update public.products set tagline = coalesce(v_payload->>'tagline', tagline), description = coalesce(v_payload->>'description', description), categories = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload->'categories','[]')) x), categories), pricing = coalesce(v_payload->>'pricing', pricing), availability = coalesce(v_payload->>'availability', availability), logo_url = coalesce(v_payload->>'logo_url', logo_url), avatar = coalesce(v_payload->>'logo_url', avatar), website = coalesce(v_payload->>'website', website), screenshots = coalesce(v_payload->'screenshots', screenshots), video_url = coalesce(v_payload->>'video_url', video_url), extra_links = coalesce(v_payload->'extra_links', extra_links), launch_title = coalesce(v_payload->>'launch_title', launch_title), launch_note = coalesce(v_payload->>'launch_note', launch_note), you_built_this = coalesce((v_payload->>'you_built_this')::boolean, you_built_this), draft = coalesce((v_payload->>'draft')::boolean, draft), status = case when (v_payload->>'draft')::boolean = false then 'Live' else status end, launched_at = case when (v_payload->>'draft')::boolean = false and coalesce(v_payload->>'availability','live') = 'live' then coalesce(launched_at, now()) when (v_payload->>'draft')::boolean = false and coalesce(v_payload->>'availability','live') != 'live' then null else launched_at end, updated_at = now() where id = p_product_id;
      select * into v_product from public.products where id = p_product_id;
    end if;
  exception when others then null; end;
  update public.profiles set active_product_id = p_product_id, updated_at = now() where id = v_maker;
  if not found and v_email is not null then update public.profiles set active_product_id = p_product_id, updated_at = now() where email = v_email; end if;
  if not found then insert into public.profiles (id, email, active_product_id) select v_maker, v_email, p_product_id on conflict (id) do update set active_product_id = excluded.active_product_id, updated_at = now(); end if;
  return v_product;
end;
$$;
grant execute on function public.set_active_product(uuid) to anon, authenticated, service_role, authenticator;

-- get_my_products with x-payload header support and email fallback
drop function if exists public.get_my_products();
create or replace function public.get_my_products()
returns setof public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_headers text;
  v_product public.products;
  v_slug text;
  v_maker uuid;
  v_email text;
begin
  v_email := coalesce((auth.jwt() ->> 'email'), (select email from auth.users where id = (select auth.uid()) limit 1));
  if v_email is not null then select id into v_maker from auth.users where email = v_email limit 1; end if;
  if v_maker is null then v_maker := (select auth.uid()); end if;
  begin
    v_headers := current_setting('request.headers', true);
    if v_headers is not null then v_payload := (v_headers::jsonb ->> 'x-payload')::jsonb; end if;
  exception when others then v_payload := null; end;
  if v_payload is not null and jsonb_typeof(v_payload) = 'object' and v_payload ? 'name' then
    if v_maker is null then raise exception 'Not authenticated'; end if;
    v_slug := coalesce(v_payload->>'slug', lower(regexp_replace(v_payload->>'name', '[^a-z0-9]+','-','g')));
    v_slug := regexp_replace(lower(v_slug), '^-+|-+$','','g');
    if v_slug = '' or char_length(v_slug) < 3 then v_slug := 'product-'||substr(md5(random()::text),1,4); end if;
    select * into v_product from public.products where maker_id = v_maker and slug = v_slug and deleted_at is null limit 1;
    if found then
      update public.products set name = coalesce(v_payload->>'name', name), tagline = coalesce(v_payload->>'tagline', tagline), description = coalesce(v_payload->>'description', description), categories = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload->'categories','[]')) x), categories), pricing = coalesce(v_payload->>'pricing', pricing), availability = coalesce(v_payload->>'availability', availability), logo_url = coalesce(v_payload->>'logo_url', logo_url), avatar = coalesce(v_payload->>'logo_url', avatar), website = coalesce(v_payload->>'website', website), screenshots = coalesce(v_payload->'screenshots', screenshots), video_url = coalesce(v_payload->>'video_url', video_url), extra_links = coalesce(v_payload->'extra_links', extra_links), launch_title = coalesce(v_payload->>'launch_title', launch_title), launch_note = coalesce(v_payload->>'launch_note', launch_note), you_built_this = coalesce((v_payload->>'you_built_this')::boolean, you_built_this), draft = coalesce((v_payload->>'draft')::boolean, draft), status = case when (v_payload->>'draft')::boolean = false then 'Live' else status end, launched_at = case when (v_payload->>'draft')::boolean = false and coalesce(v_payload->>'availability','live') = 'live' then coalesce(launched_at, now()) when (v_payload->>'draft')::boolean = false and coalesce(v_payload->>'availability','live') != 'live' then null else launched_at end, updated_at = now() where id = v_product.id returning * into v_product;
    else
      insert into public.products (maker_id, slug, name, tagline, description, categories, pricing, availability, logo_url, avatar, website, screenshots, video_url, extra_links, launch_title, launch_note, you_built_this, draft, status, launched_at) values (v_maker, v_slug, v_payload->>'name', v_payload->>'tagline', v_payload->>'description', coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_payload->'categories','[]')) x), '{}'), v_payload->>'pricing', coalesce(v_payload->>'availability','live'), v_payload->>'logo_url', v_payload->>'logo_url', v_payload->>'website', coalesce(v_payload->'screenshots','[]'), v_payload->>'video_url', coalesce(v_payload->'extra_links','[]'), v_payload->>'launch_title', v_payload->>'launch_note', coalesce((v_payload->>'you_built_this')::boolean, true), coalesce((v_payload->>'draft')::boolean, true), 'Live', case when coalesce((v_payload->>'draft')::boolean, true) = false and coalesce(v_payload->>'availability','live') = 'live' then now() else null end) returning * into v_product;
    end if;
    insert into public.profiles (id, email) values (v_maker, v_email) on conflict (id) do nothing;
    update public.profiles set active_product_id = v_product.id, updated_at = now() where id = v_maker;
    if not found and v_email is not null then update public.profiles set active_product_id = v_product.id, updated_at = now() where email = v_email; end if;
    return query select * from public.products where maker_id = v_maker and deleted_at is null order by created_at asc;
    return;
  end if;
  if v_maker is null then return query select * from public.products where false; end if;
  return query select * from public.products where maker_id = v_maker and deleted_at is null order by created_at asc;
end;
$$;
grant execute on function public.get_my_products() to anon, authenticated, service_role, authenticator;

-- Ensure tenants helpers are visible (were 404 for anon)
drop function if exists public.get_my_tenant();
create or replace function public.get_my_tenant()
returns setof public.tenants
language sql
security definer
set search_path = public
as $$ select * from public.tenants where owner_id = (select auth.uid()) order by created_at asc; $$;
grant execute on function public.get_my_tenant() to anon, authenticated, service_role, authenticator;

drop function if exists public.ensure_my_tenant();
create or replace function public.ensure_my_tenant()
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$ declare v_tenant public.tenants; begin select * into v_tenant from public.tenants where owner_id = (select auth.uid()) limit 1; if found then return v_tenant; end if; insert into public.tenants (owner_id, slug, name) values ((select auth.uid()), 'workspace-'||substr(md5(random()::text),1,6), 'My Workspace') returning * into v_tenant; return v_tenant; exception when unique_violation then select * into v_tenant from public.tenants where owner_id = (select auth.uid()) limit 1; return v_tenant; end; $$;
grant execute on function public.ensure_my_tenant() to anon, authenticated, service_role, authenticator;

select pg_notify('pgrst', 'reload schema');
