-- Product Agent — maker RPCs run as DEFINER (same precedent as feedback_create).
-- Invoker + RLS surfaced permission errors to makers; definer keeps the explicit
-- ownership check (clean 400 for non-owners) and bypasses row policies inside.
-- Execute stays maker-only: anon revoked, authenticated granted.

alter function public.seed_agent_tools(uuid) security definer;
alter function public.agent_enable(uuid, text) security definer;

revoke execute on function public.seed_agent_tools(uuid) from anon;
revoke execute on function public.agent_enable(uuid, text) from anon;
grant execute on function public.seed_agent_tools(uuid) to authenticated;
grant execute on function public.agent_enable(uuid, text) to authenticated;
