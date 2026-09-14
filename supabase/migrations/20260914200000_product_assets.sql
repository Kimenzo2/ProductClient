-- Durable product media storage.
-- Browser object URLs (blob:...) are preview-only and must never be persisted.

insert into storage.buckets (id, name, public)
values ('product-assets', 'product-assets', true)
on conflict (id) do update set public = excluded.public;

update public.products
set logo_url = null
where logo_url like 'blob:%';

update public.products
set avatar = null
where avatar like 'blob:%';
