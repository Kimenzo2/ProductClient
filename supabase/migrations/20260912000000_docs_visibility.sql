alter table public.tenants add column if not exists docs_access_mode text not null default 'public' check (docs_access_mode in ('public','password','private'));
alter table public.tenants add column if not exists docs_password_hash text;
alter table public.tenants add column if not exists docs_agent_blurb text;
alter table public.tenants add column if not exists docs_primary_color text;
