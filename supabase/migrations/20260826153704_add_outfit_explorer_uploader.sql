alter table public.outfit_explorer_posts
  add column user_id uuid references auth.users(id) on delete set null,
  add column uploader_name text;

create index outfit_explorer_posts_user_id_idx
  on public.outfit_explorer_posts (user_id);
