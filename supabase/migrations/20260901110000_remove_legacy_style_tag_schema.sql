-- The eight-axis centre model fully replaces the former style-tag and
-- clustering systems. These objects are intentionally removed permanently.
set lock_timeout = '5s';

-- These RPCs are still used by the taste and recommendation services. Replace
-- their tag-shaped payloads before removing the legacy product columns.
create or replace function public.get_taste_analysis_products(target_user_id uuid, collection_source text)
returns table (product jsonb)
language sql stable security invoker set search_path = ''
as $$
  with selected_ids as (
    select item.product_id, item.added_at
    from public.user_closet_items item
    where collection_source = 'closet' and item.user_id = target_user_id
    union all
    select item.product_id, item.added_at
    from public.user_digbox_items item
    where collection_source = 'digbox' and item.user_id = target_user_id
  )
  select jsonb_build_object(
    'id', p.id, 'brand', p.brand, 'name', p.name, 'category', p.category,
    'sub_category', p.sub_category, 'url', p.url, 'image_path', p.image_path,
    'slug', p.slug, 'created_at', p.created_at,
    'collection_added_at', selected.added_at, 'is_instagram', p.is_instagram,
    'instagram_order', p.instagram_order, 'target_gender', p.target_gender,
    'human_target_gender', p.human_target_gender,
    'style_attributes', p.style_attributes, 'style_axes', p.style_axes,
    'human_style_attributes', p.human_style_attributes,
    'human_style_axes', p.human_style_axes,
    'facts_reviewed_at', p.facts_reviewed_at,
    'style_axes_reviewed_at', p.style_axes_reviewed_at,
    'image_embedding', p.image_embedding
  )
  from selected_ids selected
  join public.products p on p.id = case
    when selected.product_id ~ '^[0-9]+$' then selected.product_id::bigint
  end
  where collection_source in ('closet', 'digbox')
  order by selected.added_at desc nulls last, p.id desc
  limit 500;
$$;

create or replace function public.get_taste_summary_products(target_user_id uuid, collection_source text)
returns table (product jsonb)
language sql stable security invoker set search_path = ''
as $$
  with selected_ids as (
    select item.product_id, item.added_at
    from public.user_closet_items item
    where collection_source = 'closet' and item.user_id = target_user_id
    union all
    select item.product_id, item.added_at
    from public.user_digbox_items item
    where collection_source = 'digbox' and item.user_id = target_user_id
  )
  select jsonb_build_object(
    'id', p.id, 'brand', p.brand, 'name', p.name, 'category', p.category,
    'sub_category', p.sub_category, 'url', p.url, 'image_path', p.image_path,
    'slug', p.slug, 'created_at', p.created_at,
    'collection_added_at', selected.added_at, 'is_instagram', p.is_instagram,
    'instagram_order', p.instagram_order, 'target_gender', p.target_gender,
    'human_target_gender', p.human_target_gender,
    'style_attributes', p.style_attributes, 'style_axes', p.style_axes,
    'human_style_attributes', p.human_style_attributes,
    'human_style_axes', p.human_style_axes,
    'facts_reviewed_at', p.facts_reviewed_at,
    'style_axes_reviewed_at', p.style_axes_reviewed_at
  )
  from selected_ids selected
  join public.products p on p.id = case
    when selected.product_id ~ '^[0-9]+$' then selected.product_id::bigint
  end
  where collection_source in ('closet', 'digbox')
  order by selected.added_at desc nulls last, p.id desc
  limit 500;
$$;

create or replace function public.get_product_recommendation_candidates_v2(
  source_product_id bigint,
  similar_limit integer default 120,
  style_limit integer default 160
)
returns table (recommendation_kind text, product jsonb, visual_similarity double precision)
language sql stable security invoker set search_path = ''
as $$
  with source as (
    select p.id, p.category, p.image_embedding,
      coalesce(nullif(lower(trim(p.human_target_gender)), ''), nullif(lower(trim(p.target_gender)), ''), 'unknown') as effective_gender
    from public.products p
    where p.id = source_product_id
  ), candidates as (
    select p.*, coalesce(nullif(lower(trim(p.human_target_gender)), ''), nullif(lower(trim(p.target_gender)), ''), 'unknown') as effective_gender
    from public.products p
  ), similar_candidates as (
    select 'similar'::text as recommendation_kind,
      jsonb_build_object(
        'id', candidate.id, 'brand', candidate.brand, 'name', candidate.name,
        'category', candidate.category, 'sub_category', candidate.sub_category,
        'url', candidate.url, 'image_path', candidate.image_path, 'slug', candidate.slug,
        'created_at', candidate.created_at, 'is_instagram', candidate.is_instagram,
        'instagram_order', candidate.instagram_order, 'target_gender', candidate.target_gender,
        'human_target_gender', candidate.human_target_gender,
        'style_attributes', candidate.style_attributes, 'style_axes', candidate.style_axes,
        'human_style_attributes', candidate.human_style_attributes,
        'human_style_axes', candidate.human_style_axes,
        'facts_reviewed_at', candidate.facts_reviewed_at,
        'style_axes_reviewed_at', candidate.style_axes_reviewed_at
      ) as product,
      greatest(0::double precision, 1 - (candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding)) as visual_similarity
    from source
    join candidates candidate on candidate.id <> source.id
      and lower(trim(candidate.category)) = lower(trim(source.category))
      and candidate.image_embedding is not null
    where source.image_embedding is not null
    order by candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding
    limit least(greatest(coalesce(similar_limit, 120), 24), 200)
  ), style_candidates as (
    select 'style'::text as recommendation_kind,
      jsonb_build_object(
        'id', candidate.id, 'brand', candidate.brand, 'name', candidate.name,
        'category', candidate.category, 'sub_category', candidate.sub_category,
        'url', candidate.url, 'image_path', candidate.image_path, 'slug', candidate.slug,
        'created_at', candidate.created_at, 'is_instagram', candidate.is_instagram,
        'instagram_order', candidate.instagram_order, 'target_gender', candidate.target_gender,
        'human_target_gender', candidate.human_target_gender,
        'style_attributes', candidate.style_attributes, 'style_axes', candidate.style_axes,
        'human_style_attributes', candidate.human_style_attributes,
        'human_style_axes', candidate.human_style_axes,
        'facts_reviewed_at', candidate.facts_reviewed_at,
        'style_axes_reviewed_at', candidate.style_axes_reviewed_at
      ) as product,
      case when source.image_embedding is not null and candidate.image_embedding is not null
        then greatest(0::double precision, 1 - (candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding))
        else null end as visual_similarity
    from source
    join candidates candidate on candidate.id <> source.id
      and lower(trim(candidate.category)) in ('top', 'bottom', 'outer', 'shoes')
      and lower(trim(candidate.category)) <> lower(trim(source.category))
      and (source.effective_gender = 'unknown' or candidate.effective_gender = 'unknown'
        or source.effective_gender = candidate.effective_gender
        or source.effective_gender = 'unisex' or candidate.effective_gender = 'unisex')
    where lower(trim(source.category)) in ('top', 'bottom', 'outer', 'shoes')
    order by candidate.id desc
    limit least(greatest(coalesce(style_limit, 160), 24), 240)
  )
  select recommendation_kind, product, visual_similarity from similar_candidates
  union all
  select recommendation_kind, product, visual_similarity from style_candidates;
$$;

revoke all on function public.get_taste_analysis_products(uuid, text) from public, anon, authenticated;
revoke all on function public.get_taste_summary_products(uuid, text) from public, anon, authenticated;
revoke all on function public.get_product_recommendation_candidates_v2(bigint, integer, integer) from public, anon, authenticated;
grant execute on function public.get_taste_analysis_products(uuid, text) to service_role;
grant execute on function public.get_taste_summary_products(uuid, text) to service_role;
grant execute on function public.get_product_recommendation_candidates_v2(bigint, integer, integer) to service_role;

alter table public.user_taste_swipe_events
  drop column if exists tag_snapshot;

alter table public.products
  drop column if exists style_tags,
  drop column if exists style_tags_evidence,
  drop column if exists style_tags_confidence,
  drop column if exists human_style_tags,
  drop column if exists human_style_tags_evidence,
  drop column if exists tagging_status,
  drop column if exists tagging_error,
  drop column if exists tagged_at,
  drop column if exists tag_review_status,
  drop column if exists tag_review_note,
  drop column if exists reviewed_by,
  drop column if exists reviewed_at,
  drop column if exists style_cluster_score_status,
  drop column if exists style_cluster_score_error;

drop table if exists public.product_style_cluster_scores;
drop table if exists public.style_clusters;
drop table if exists public.style_cluster_model_versions;
