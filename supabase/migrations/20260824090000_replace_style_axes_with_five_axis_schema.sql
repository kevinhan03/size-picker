alter table public.products
  add column if not exists style_axis_review_required boolean not null default false;

-- Convert the only renamed axis while removing obsolete keys. AI values will be
-- replaced by the five-axis backfill below; this keeps interim reads valid.
update public.products
set style_axes = (style_axes - array['visual_complexity', 'surface_processing_intensity'])
  || case when style_axes ? 'visual_complexity'
    then jsonb_build_object('expression_intensity', style_axes -> 'visual_complexity')
    else '{}'::jsonb end
where style_axes is not null;

-- Never discard an administrator decision. Preserve compatible values and map
-- the old complexity decision to the renamed expression axis for re-checking.
update public.products
set human_style_axes = (human_style_axes - array['visual_complexity', 'surface_processing_intensity'])
  || case when human_style_axes ? 'visual_complexity'
    then jsonb_build_object('expression_intensity', human_style_axes -> 'visual_complexity')
    else '{}'::jsonb end,
  style_axis_review_required = true
where human_style_axes is not null and human_style_axes <> '{}'::jsonb;

-- Queue every applicable AI axis for the new five-axis, axes-only analysis.
update public.products
set style_axis_analysis_status = 'pending',
  style_axis_analysis_error = null
where category in ('Top', 'Bottom', 'Outer', 'DressSkirt', 'Shoes');
