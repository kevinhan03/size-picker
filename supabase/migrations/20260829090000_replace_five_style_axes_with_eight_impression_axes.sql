-- The previous five-axis vocabulary is semantically incompatible with the
-- eight-axis impression space. Per the product decision, do not map or retain
-- those values: every core product must receive a fresh AI draft and review.
update public.products
set style_axes = null,
    human_style_axes = null;

update public.products
set
    style_axis_analysis_status = 'pending',
    style_axis_analysis_error = null,
    style_axis_analyzed_at = null,
    style_axis_review_required = true,
    style_cluster_score_status = 'pending',
    style_cluster_score_error = null
where category in ('Top', 'Bottom', 'Outer', 'DressSkirt', 'Shoes');

-- Existing centroids have five axis dimensions and must never score an
-- eight-axis product. Keep records for audit but make every model inactive.
update public.style_cluster_model_versions
set status = 'archived'
where status in ('draft', 'active');
