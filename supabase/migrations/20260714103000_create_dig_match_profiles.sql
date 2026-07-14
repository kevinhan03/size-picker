create table public.user_taste_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  completed_sessions integer not null default 0 check (completed_sessions >= 0),
  updated_at timestamptz not null default now()
);

create table public.user_taste_match_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

create index user_taste_match_sessions_user_completed_idx
  on public.user_taste_match_sessions(user_id, completed_at desc);

alter table public.user_taste_profiles enable row level security;
alter table public.user_taste_match_sessions enable row level security;

revoke all on table public.user_taste_profiles from anon, authenticated;
revoke all on table public.user_taste_match_sessions from anon, authenticated;

grant select, insert, update, delete on table public.user_taste_profiles to service_role;
grant select, insert, update, delete on table public.user_taste_match_sessions to service_role;
