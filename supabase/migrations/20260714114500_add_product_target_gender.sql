alter table public.products
  add column if not exists target_gender text not null default 'unknown'
  check (target_gender in ('menswear', 'womenswear', 'unisex', 'unknown'));

create index if not exists products_target_gender_category_idx
  on public.products(target_gender, category);
