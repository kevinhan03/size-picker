alter table public.products
  add column if not exists human_target_gender text
    check (human_target_gender in ('menswear', 'womenswear', 'unisex', 'unknown')),
  add column if not exists target_gender_reviewed_by text,
  add column if not exists target_gender_reviewed_at timestamptz;
