alter table public.products
  add column if not exists style_tags jsonb;
