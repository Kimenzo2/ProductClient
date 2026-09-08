-- Roadmap docs — Single Publish Writes
-- Supabase is source of truth, D1 is edge cache (see CLOUDFLARE_DEPLOYMENT.md)
-- Each tenant has one roadmap doc (the published version). Edits stay in memory until Publish.
create extension if not exists "pgcrypto" with schema extensions;

create table if not exists public.roadmap_docs (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  doc jsonb not null check (jsonb_typeof(doc) = 'object'),
  published_at timestamptz,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists roadmap_docs_updated_at_idx on public.roadmap_docs(updated_at);
drop trigger if exists roadmap_docs_updated_at on public.roadmap_docs;
create trigger roadmap_docs_updated_at before update on public.roadmap_docs for each row execute function public.handle_updated_at();

alter table public.roadmap_docs enable row level security;
alter table public.roadmap_docs force row level security;

drop policy if exists "owners can select own roadmap" on public.roadmap_docs;
drop policy if exists "owners can upsert own roadmap" on public.roadmap_docs;
drop policy if exists "owners can update own roadmap" on public.roadmap_docs;
drop policy if exists "owners can delete own roadmap" on public.roadmap_docs;

create policy "owners can select own roadmap" on public.roadmap_docs for select to authenticated
  using ((select auth.uid()) = (select owner_id from public.tenants where id = tenant_id));
create policy "owners can upsert own roadmap" on public.roadmap_docs for insert to authenticated
  with check ((select auth.uid()) = (select owner_id from public.tenants where id = tenant_id));
create policy "owners can update own roadmap" on public.roadmap_docs for update to authenticated
  using ((select auth.uid()) = (select owner_id from public.tenants where id = tenant_id))
  with check ((select auth.uid()) = (select owner_id from public.tenants where id = tenant_id));
create policy "owners can delete own roadmap" on public.roadmap_docs for delete to authenticated
  using ((select auth.uid()) = (select owner_id from public.tenants where id = tenant_id));

grant select, insert, update, delete on public.roadmap_docs to authenticated;
grant usage on schema public to authenticated;
