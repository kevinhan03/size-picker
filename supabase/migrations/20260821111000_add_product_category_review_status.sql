alter table public.products
  add column if not exists category_reviewed boolean not null default false;

comment on column public.products.category_reviewed is
  'True after an administrator has reviewed the product category and sub_category.';
