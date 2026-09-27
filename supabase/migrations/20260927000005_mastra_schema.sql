-- Mastra storage schema: memory threads/messages, traces, evals. Product tables
-- in public are untouched. Mastra connects with DATABASE_URL directly (not
-- PostgREST), so usage goes to the server roles; it creates its own tables on
-- first boot inside this schema. Idempotent: safe to re-run.

create schema if not exists mastra;

grant usage, create on schema mastra to postgres;
grant usage, create on schema mastra to service_role;

alter default privileges in schema mastra grant all on tables to postgres, service_role;
alter default privileges in schema mastra grant all on sequences to postgres, service_role;
