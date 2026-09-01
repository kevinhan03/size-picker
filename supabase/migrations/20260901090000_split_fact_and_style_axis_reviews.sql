alter table public.products
  add column if not exists facts_reviewed_at timestamptz,
  add column if not exists facts_reviewed_by text,
  add column if not exists style_axes_reviewed_at timestamptz,
  add column if not exists style_axes_reviewed_by text;

-- The previous workflow approved facts and axes together. Preserve that history,
-- except products explicitly queued for the new axis-schema recheck.
update public.products
set
  -- Do not invent a reviewer or timestamp when the legacy approval has no
  -- audit record. Those products must remain in the new review queues.
  facts_reviewed_at = coalesce(facts_reviewed_at, reviewed_at),
  facts_reviewed_by = coalesce(facts_reviewed_by, reviewed_by),
  style_axes_reviewed_at = case
    when style_axis_review_required then style_axes_reviewed_at
    else coalesce(style_axes_reviewed_at, reviewed_at)
  end,
  style_axes_reviewed_by = case
    when style_axis_review_required then style_axes_reviewed_by
    else coalesce(style_axes_reviewed_by, reviewed_by)
  end
where tag_review_status in ('approved', 'edited');
