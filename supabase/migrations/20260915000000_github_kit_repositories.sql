-- GitHub workbench connections for the separately hosted starter kits.
--
-- GitHub is the version-control/workbench surface. ProductClient Publish
-- writes the canonical tenant release to the appropriate Cloudflare Worker;
-- these rows identify the repository a maker uses when working from an IDE.
-- The three kits are deliberately independent: Documentation, Roadmap, and
-- Status do not share a publishing destination or a repository by accident.

insert into public.github_contract_meta (id, contract_id, schema_version)
values (true, 'productclient.github.v1', 2)
on conflict (id) do update set contract_id = excluded.contract_id,
  schema_version = greatest(public.github_contract_meta.schema_version, excluded.schema_version),
  updated_at = now();

create table if not exists public.github_kit_repositories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  installation_id bigint not null references public.github_installations(installation_id) on delete cascade,
  kit text not null check (kit in ('docs', 'roadmap', 'status')),
  repo_full_name text not null,
  branch text not null default 'main',
  content_path text not null default '/',
  last_sha text,
  last_synced_at timestamptz,
  last_error text,
  sync_status text not null default 'idle',
  sync_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kit)
);

create index if not exists github_kit_repositories_tenant_idx
  on public.github_kit_repositories (tenant_id, kit);
create index if not exists github_kit_repositories_repo_branch_idx
  on public.github_kit_repositories (repo_full_name, branch);
create index if not exists github_kit_repositories_installation_idx
  on public.github_kit_repositories (installation_id);

alter table public.github_kit_repositories enable row level security;
alter table public.github_kit_repositories force row level security;
drop policy if exists github_kit_repositories_member_select on public.github_kit_repositories;
create policy github_kit_repositories_member_select on public.github_kit_repositories
  for select to authenticated
  using (public.user_can_access_tenant(tenant_id));
drop policy if exists github_kit_repositories_manager_write on public.github_kit_repositories;
create policy github_kit_repositories_manager_write on public.github_kit_repositories
  for all to authenticated
  using (public.user_can_manage_tenant(tenant_id))
  with check (public.user_can_manage_tenant(tenant_id));
grant select, insert, update, delete on public.github_kit_repositories to authenticated;

-- Existing Documentation connections are the first version of this contract.
-- Preserve them as the docs kit repository without changing the existing
-- github_repo_links rows used by issue, feedback, and external sync flows.
insert into public.github_kit_repositories (
  tenant_id,
  product_id,
  installation_id,
  kit,
  repo_full_name,
  branch,
  content_path,
  last_sha,
  last_synced_at,
  last_error,
  sync_status,
  sync_error_code
)
select distinct on (p.tenant_id)
  p.tenant_id,
  l.product_id,
  l.installation_id,
  'docs',
  l.repo_full_name,
  l.branch,
  coalesce(l.docs_path, '/'),
  l.last_sha,
  l.last_synced_at,
  l.last_error,
  coalesce(l.sync_status, 'idle'),
  l.sync_error_code
from public.github_repo_links l
join public.products p on p.id = l.product_id
where l.role = 'source'
  and p.tenant_id is not null
order by p.tenant_id, l.updated_at desc nulls last, l.created_at desc
on conflict (tenant_id, kit) do nothing;
