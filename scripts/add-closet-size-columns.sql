alter table public.user_closet_items
  add column if not exists selected_size_label text,
  add column if not exists selected_size_row_index integer,
  add column if not exists selected_size_snapshot jsonb;
