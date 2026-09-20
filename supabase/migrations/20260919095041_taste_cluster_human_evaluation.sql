create table public.user_taste_cluster_evaluation_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 model_id uuid not null references public.user_taste_cluster_models(id) on delete cascade,
 source text not null check(source in ('digbox','closet')),
 question_id text not null,
 question text not null,
 plan jsonb not null,
 production_products jsonb not null,
 cluster_products jsonb not null,
 option_a_is_cluster boolean not null,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 unique(user_id, question_id, model_id)
);
create table public.user_taste_cluster_evaluation_ratings (
 id uuid primary key default gen_random_uuid(),
 run_id uuid not null references public.user_taste_cluster_evaluation_runs(id) on delete cascade,
 user_id uuid not null references public.users(id) on delete cascade,
 preferred_option text not null check(preferred_option in ('a','b','tie')),
 taste_score_a smallint not null check(taste_score_a between 1 and 5),
 taste_score_b smallint not null check(taste_score_b between 1 and 5),
 explanation_score_a smallint not null check(explanation_score_a between 1 and 5),
 explanation_score_b smallint not null check(explanation_score_b between 1 and 5),
 condition_score_a smallint not null check(condition_score_a between 1 and 5),
 condition_score_b smallint not null check(condition_score_b between 1 and 5),
 note text check(char_length(note) <= 1000),
 created_at timestamptz not null default now(),
 unique(run_id, user_id)
);
create index on public.user_taste_cluster_evaluation_runs(user_id, created_at desc);
create index on public.user_taste_cluster_evaluation_ratings(user_id, created_at desc);
alter table public.user_taste_cluster_evaluation_runs enable row level security;
alter table public.user_taste_cluster_evaluation_ratings enable row level security;
revoke all on public.user_taste_cluster_evaluation_runs, public.user_taste_cluster_evaluation_ratings from public,anon,authenticated;
grant select,insert,update,delete on public.user_taste_cluster_evaluation_runs, public.user_taste_cluster_evaluation_ratings to service_role;
