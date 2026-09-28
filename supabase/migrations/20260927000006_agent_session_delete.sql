-- Product Agent — maker session delete (privacy law: delete path).
-- SECURITY DEFINER like feedback_create: ownership is re-checked inside
-- (product maker = auth.uid), so no maker DELETE table grants are needed.
-- Deletes mirror rows (messages + session). Mastra thread + vector rows are
-- deleted by the API route via deleteThread (same product scope).
-- Idempotent: safe to re-run.

create or replace function public.agent_delete_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_product uuid;
begin
  select s.product_id into v_product
  from public.agent_sessions s
  join public.products p on p.id = s.product_id
  where s.id = p_session_id
    and p.maker_id = (select auth.uid());
  if v_product is null then
    return false;
  end if;
  delete from public.agent_messages where session_id = p_session_id;
  delete from public.agent_sessions where id = p_session_id;
  return true;
end;
$function$;

revoke execute on function public.agent_delete_session(uuid) from anon;
grant execute on function public.agent_delete_session(uuid) to authenticated;
