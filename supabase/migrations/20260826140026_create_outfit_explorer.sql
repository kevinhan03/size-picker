create table public.outfit_explorer_posts (
  id uuid primary key default gen_random_uuid(),
  image_path text not null unique,
  created_at timestamptz not null default now()
);

create table public.outfit_explorer_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.outfit_explorer_posts(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index outfit_explorer_comments_post_created_at_idx
  on public.outfit_explorer_comments (post_id, created_at);

alter table public.outfit_explorer_posts enable row level security;
alter table public.outfit_explorer_comments enable row level security;

-- The browser only talks to the server route. Direct Data API access has no
-- policies and is therefore denied to anon/authenticated clients.
insert into storage.buckets (id, name, public)
values ('outfit-explorer', 'outfit-explorer', false)
on conflict (id) do update set public = excluded.public;
