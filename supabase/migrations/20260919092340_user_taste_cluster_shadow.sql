create table public.user_taste_cluster_state (
 user_id uuid not null references public.users(id) on delete cascade,
 source text not null check(source in ('digbox','closet')),
 fingerprint text not null,
 observed_at timestamptz not null default now(),
 processed_at timestamptz,
 checked_at timestamptz not null default now(),
 primary key(user_id,source)
);
create table public.user_taste_cluster_models (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 source text not null check(source in ('digbox','closet')),
 fingerprint text not null,
 algorithm_version text not null,
 accepted boolean not null,
 result jsonb not null,
 created_at timestamptz not null default now(),
 unique(user_id,source,fingerprint,algorithm_version)
);
create table public.user_taste_cluster_evaluations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 model_id uuid not null references public.user_taste_cluster_models(id) on delete cascade,
 plan jsonb not null,
 selected_cluster integer,
 baseline_ids jsonb not null,
 shadow_ids jsonb not null,
 overlap double precision not null,
 created_at timestamptz not null default now()
);
create index on public.user_taste_cluster_models(user_id,source,created_at desc);
create index on public.user_taste_cluster_evaluations(user_id,created_at desc);
alter table public.user_taste_cluster_state enable row level security;
alter table public.user_taste_cluster_models enable row level security;
alter table public.user_taste_cluster_evaluations enable row level security;
revoke all on public.user_taste_cluster_state, public.user_taste_cluster_models, public.user_taste_cluster_evaluations from public,anon,authenticated;
grant select,insert,update,delete on public.user_taste_cluster_state, public.user_taste_cluster_models, public.user_taste_cluster_evaluations to service_role;

create function public.observe_user_taste_cluster(target_user uuid, target_source text, target_fingerprint text)
returns void language sql security invoker set search_path = '' as $$
 insert into public.user_taste_cluster_state(user_id, source, fingerprint)
 values(target_user, target_source, target_fingerprint)
 on conflict(user_id,source) do update
 set fingerprint = excluded.fingerprint, observed_at = now()
 where user_taste_cluster_state.fingerprint is distinct from excluded.fingerprint;
$$;
revoke all on function public.observe_user_taste_cluster(uuid,text,text) from public,anon,authenticated;
grant execute on function public.observe_user_taste_cluster(uuid,text,text) to service_role;
