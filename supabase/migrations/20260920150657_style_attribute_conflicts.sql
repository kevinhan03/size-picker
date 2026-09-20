alter table public.products
  add column if not exists style_attribute_conflicts jsonb not null default '[]'::jsonb,
  add column if not exists style_attribute_conflicts_detected_at timestamptz,
  add column if not exists style_attribute_conflicts_reviewed_at timestamptz;

create index if not exists products_style_attribute_conflicts_pending_idx
  on public.products (style_attribute_conflicts_detected_at desc)
  where jsonb_array_length(style_attribute_conflicts) > 0
    and style_attribute_conflicts_reviewed_at is null;
