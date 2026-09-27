-- Product Agent — anon SELECT on agent_settings was revoked by the foundation
-- migration and never re-granted, so /api/agent/config always read
-- {enabled:false} for visitors. RLS (agent_settings_public_select) still
-- restricts anon rows to enabled products only.
grant select on public.agent_settings to anon;
