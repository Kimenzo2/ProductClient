-- Documentation content — persistent drafts and published versions.
-- The draft is edited in ProductClient. Publish copies it to the published
-- column and mirrors the complete tenant payload to the hosted D1 Worker.
create table if not exists public.docs_documents (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  draft jsonb not null default '{"schemaVersion":1,"dimensions":[],"views":[],"pages":[]}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  draft_version bigint not null default 0,
  published_version bigint not null default 0,
  published_at timestamptz,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists docs_documents_updated_at_idx on public.docs_documents(updated_at);
drop trigger if exists docs_documents_updated_at on public.docs_documents;
create trigger docs_documents_updated_at before update on public.docs_documents for each row execute function public.handle_updated_at();

alter table public.docs_documents enable row level security;
alter table public.docs_documents force row level security;
revoke all on table public.docs_documents from anon, authenticated;
grant select, insert, update, delete on table public.docs_documents to authenticated;

drop policy if exists docs_documents_member_select on public.docs_documents;
drop policy if exists docs_documents_manager_insert on public.docs_documents;
drop policy if exists docs_documents_manager_update on public.docs_documents;
drop policy if exists docs_documents_manager_delete on public.docs_documents;

create policy docs_documents_member_select on public.docs_documents
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));

create policy docs_documents_manager_insert on public.docs_documents
  for insert to authenticated
  with check (public.user_can_manage_tenant(tenant_id));

create policy docs_documents_manager_update on public.docs_documents
  for update to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));

create policy docs_documents_manager_delete on public.docs_documents
  for delete to authenticated
  using (public.user_can_manage_tenant(tenant_id));
