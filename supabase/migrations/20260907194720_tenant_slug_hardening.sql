-- Tenant slug hardening
--
-- Idempotent replacements for the tenant slug pipeline so signup-time slug
-- generation and later renames share one consistent rule set:
--
--  * normalize_slug keeps up to 63 chars (the tenants CHECK + rename rules
--    already allow 63; the previous 30-char truncation meant a user could be
--    told "at most 63" and then silently get a 30-char slug).
--  * ensure_tenant_for_user treats reserved words like collisions: a user
--    whose auto-slug would be reserved (e.g. an email local part of "admin")
--    gets a clean numbered fallback ("admin-2", "admin-3", ...) instead of the
--    awkward "-app" mutation, and never inserts a reserved slug.
--
-- Applied to the remote project via `supabase db query --linked`, because this
-- project's schema was authored in the Supabase SQL editor (no migration
-- history exists yet). Re-running this file is safe.

create or replace function public.is_reserved_slug(slug text)
returns boolean
language sql
immutable
set search_path to 'public', 'extensions'
as $function$
  select lower(slug) = any (array[
    'www','www2','www3','api','apis','admin','administrator','root','system','sys','internal',
    'app','apps','dashboard','dashboards','workspace','workspaces','tenant','tenants','org','orgs','organization','organizations','team','teams','group','groups','project','projects','product','products',
    'auth','login','logout','signin','signout','sign-in','sign-out','signup','sign-up','register','registration','onboarding','confirm','callback','verify','verification','reset','forgot','password','token','tokens','session','sessions','oauth','sso','saml','magic','invite','invites','join','welcome','access','account','accounts','profile','profiles','user','users','member','members','guest','guests','billing','checkout','payment','payments','pricing','subscribe','subscription','subscriptions','plan','plans',
    'feed','following','notifications','you','studio','settings','search','docs','documentation','help','support','status','roadmap','changelog','releases','feedback','incidents','problems','decisions','proof','inbox','analytics','public','private','wall','p','m','badge','update','updates','launch','launchpad','editor','new','create','edit','delete','list','all','me','home','index','default','main','overview','portal','console','panel','config','configuration','setup','getting-started','quickstart',
    'mail','email','ftp','sftp','ssh','smtp','pop','imap','http','https','cdn','assets','static','media','files','storage','images','img','js','css','v1','v2','v3','health','healthz','ready','live','metrics','statuspage','webhook','webhooks','graphql','rest','rpc','openapi','swagger',
    'staging','stage','dev','development','test','testing','demo','example','sandbox','preview','canary','beta','alpha','qa','uat','prod','production','local','localhost','devops','ops','monitoring','logs','debug','adminpanel',
    'about','contact','blog','news','press','legal','privacy','terms','security','compliance','career','careers','jobs','hiring','enterprise','partners','partner','affiliate','affiliates','community','forum','academy','learn','learning','university','training','webinar','event','events','conference','summit','meetup','hackathon','github','gitlab','bitbucket','slack','discord','twitter','x','facebook','instagram','linkedin','youtube','tiktok','medium','notion','linear','figma','vercel','netlify','cloudflare','stripe','paystack','dodo','supabase','productclient','product-client',
    'null','undefined','anonymous','anon','owner','manager','moderator','mod','staff','admins','superadmin','ghost','bot','service','helpdesk','noreply','no-reply','postmaster','hostmaster','abuse','info','sales','pay','invoice','invoices','order','orders','shop','store','cart',
    'tenant-registry','productclient-tenants','docs-host','auth-host','app-host','marketing','landing','p-landing',
    'provision',
    'now','next','later','uptime','maintenance'
  ]);
$function$;

create or replace function public.normalize_slug(raw text)
returns text
language plpgsql
set search_path to 'public', 'extensions'
as $function$
declare s text;
begin
  if raw is null then return ''; end if;
  s := lower(btrim(raw));
  if s = '' then return ''; end if;
  begin s := extensions.unaccent(s); exception when others then null; end;
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  s := regexp_replace(s, '-{2,}', '-', 'g');
  if char_length(s) > 63 then
    s := substring(s from 1 for 63);
    s := regexp_replace(s, '-+$', '', 'g');
  end if;
  return s;
end;
$function$;

create or replace function public.ensure_tenant_for_user(p_user_id uuid)
returns public.tenants
language plpgsql
security definer
set search_path to 'public', 'extensions', 'auth'
as $function$
declare
  v_email text;
  v_meta_name text;
  v_name text;
  v_display_name text;
  v_base text;
  v_candidate text;
  v_tenant public.tenants;
  v_seq int := 0;
  v_suffix text;
begin
  if p_user_id is null then raise exception 'Missing user id'; end if;

  -- Ensure the profile exists first (idempotent). Auth identity is the source
  -- of truth; meta fields can arrive later than the trigger, so coalesce keeps
  -- an already-present real name over a later email fallback.
  insert into public.profiles (id, email, full_name, avatar_url)
  select id, email,
         coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
         coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture')
  from auth.users
  where id = p_user_id
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
        updated_at = now();

  -- Already has a tenant (trigger, race, retry) -> return it.
  select * into v_tenant from public.tenants where owner_id = p_user_id limit 1;
  if found then return v_tenant; end if;

  select email,
         coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', raw_user_meta_data->>'display_name', '')
    into v_email, v_meta_name
  from auth.users
  where id = p_user_id;

  v_name := btrim(coalesce(v_meta_name, ''));
  if v_name = '' then v_name := split_part(coalesce(v_email, ''), '@', 1); end if;
  v_name := btrim(v_name);
  if v_name = '' then v_name := 'workspace'; end if;

  v_display_name := v_name;
  v_base := public.normalize_slug(v_name);
  if v_base = '' or char_length(v_base) < 3 then v_base := 'workspace'; end if;

  loop
    v_seq := v_seq + 1;
    if v_seq = 1 then
      v_candidate := v_base;
    elsif v_seq <= 50 then
      -- Deterministic readable suffixes: the plain base is "taken" whenever
      -- we get here (collision or reserved word), so start numbering at 2.
      v_suffix := '-' || v_seq::text;
      v_candidate := left(v_base, 63 - char_length(v_suffix)) || v_suffix;
    else
      -- Give up on readable suffixes; fall back to a short random token.
      v_candidate := left(v_base, 55) || '-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);
    end if;

    -- Never persist a reserved system slug.
    if public.is_reserved_slug(v_candidate) then
      continue;
    end if;

    begin
      insert into public.tenants (owner_id, slug, name)
      values (p_user_id, v_candidate, v_display_name)
      returning * into v_tenant;
      return v_tenant;
    exception when unique_violation then
      -- Someone else claimed it (or the owner won a concurrent race).
      select * into v_tenant from public.tenants where owner_id = p_user_id limit 1;
      if found then return v_tenant; end if;
    end;
  end loop;
end;
$function$;
