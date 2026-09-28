-- Product Agent — visitor self-delete (privacy law: erasure without maker).
-- The session UUID is unguessable, so possession is the capability: anyone
-- presenting the id may delete that thread. Scoped to the owning product via
-- join; nothing else is touched. Mastra thread + vectors go through
-- deleteThread in the API route (same id).
-- Idempotent: safe to re-run.

create or replace function public.agent_delete_own_session(p_session_id uuid, p_product_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1 from public.agent_sessions s
    where s.id = p_session_id and s.product_id = p_product_id
  ) then
    return false;
  end if;
  delete from public.product_contact_events where session_id = p_session_id;
  delete from public.agent_messages where session_id = p_session_id;
  delete from public.agent_sessions where id = p_session_id;
  return true;
end;
$function$;

revoke execute on function public.agent_delete_own_session(uuid, uuid) from anon;
grant execute on function public.agent_delete_own_session(uuid, uuid) to anon, authenticated;
