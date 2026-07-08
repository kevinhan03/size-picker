alter table public.products
  add column if not exists product_metadata jsonb,
  add column if not exists style_attributes jsonb,
  add column if not exists style_tags_evidence jsonb,
  add column if not exists style_tags_confidence double precision,
  add column if not exists tagging_status text,
  add column if not exists tagging_error text,
  add column if not exists tagged_at timestamptz;
