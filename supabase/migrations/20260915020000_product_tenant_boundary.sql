-- Products are tenant-owned workspace records. Prevent GitHub, Docs, Roadmap,
-- and Status integrations from receiving a product with no tenant boundary.

update public.products p
set tenant_id = t.id
from public.tenants t
where p.tenant_id is null
  and t.owner_id = p.maker_id;

create or replace function public.attach_product_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  owner_tenant_id uuid;
begin
  select t.id into owner_tenant_id
  from public.tenants t
  where t.owner_id = new.maker_id
  limit 1;

  if new.tenant_id is null then
    new.tenant_id := owner_tenant_id;
  elsif owner_tenant_id is null or new.tenant_id is distinct from owner_tenant_id then
    raise exception 'Product tenant does not belong to its maker';
  end if;

  if new.tenant_id is null then
    raise exception 'Maker must have a tenant before creating a product';
  end if;
  return new;
end;
$function$;

drop trigger if exists products_attach_tenant on public.products;
create trigger products_attach_tenant
before insert or update of maker_id, tenant_id on public.products
for each row execute function public.attach_product_tenant();
