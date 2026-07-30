create table public.user_taste_swipe_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  decision text not null check (decision in ('like', 'pass')),
  tag_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_taste_swipe_events_user_created_idx
  on public.user_taste_swipe_events(user_id, created_at desc);

alter table public.user_taste_swipe_events enable row level security;
revoke all on table public.user_taste_swipe_events from anon, authenticated;
grant select, insert, update, delete on table public.user_taste_swipe_events to service_role;
