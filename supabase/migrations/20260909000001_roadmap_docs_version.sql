-- Add optimistic concurrency version to roadmap_docs
alter table public.roadmap_docs add column if not exists version int not null default 1;
create or replace function public.bump_roadmap_version() returns trigger language plpgsql as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists roadmap_docs_version on public.roadmap_docs;
create trigger roadmap_docs_version before update on public.roadmap_docs for each row execute function public.bump_roadmap_version();
