alter table public.products
  add column if not exists human_style_tags jsonb,
  add column if not exists human_style_attributes jsonb,
  add column if not exists human_style_tags_evidence jsonb,
  add column if not exists tag_review_status text,
  add column if not exists tag_review_note text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;
