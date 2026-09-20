create table public.fashion_agent_query_taste_diagnostics (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 source text not null check(source in ('digbox','closet')),
 plan jsonb not null,
 metrics jsonb not null,
 created_at timestamptz not null default now()
);
create index fashion_agent_query_taste_diagnostics_user_created_idx on public.fashion_agent_query_taste_diagnostics(user_id, created_at desc);
alter table public.fashion_agent_query_taste_diagnostics enable row level security;
revoke all on public.fashion_agent_query_taste_diagnostics from public, anon, authenticated;
grant select, insert, delete on public.fashion_agent_query_taste_diagnostics to service_role;
