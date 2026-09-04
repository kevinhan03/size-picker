create or replace function public.get_product_recommendation_candidates_v2(
  source_product_id bigint,
  similar_limit integer default 120,
  style_limit integer default 1000
)
returns table (recommendation_kind text, product jsonb, visual_similarity double precision)
language sql stable security invoker set search_path = ''
as $$
  with source as (
    select p.id, p.category, p.image_embedding
    from public.products p where p.id = source_product_id
  ), candidates as (
    select p.* from public.products p
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
    from source join candidates candidate on candidate.id <> source.id
      and lower(trim(candidate.category)) = lower(trim(source.category))
      and candidate.image_embedding is not null
    where source.image_embedding is not null
    order by candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding
    limit least(greatest(coalesce(similar_limit, 120), 1), 120)
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
    from source join candidates candidate on candidate.id <> source.id
      and lower(trim(candidate.category)) in ('top', 'bottom', 'outer', 'dressskirt', 'shoes')
    where lower(trim(source.category)) in ('top', 'bottom', 'outer', 'dressskirt', 'shoes')
    limit least(greatest(coalesce(style_limit, 1000), 1), 1000)
  )
  select recommendation_kind, product, visual_similarity from similar_candidates
  union all
  select recommendation_kind, product, visual_similarity from style_candidates;
$$;

revoke all on function public.get_product_recommendation_candidates_v2(bigint, integer, integer) from public, anon, authenticated;
grant execute on function public.get_product_recommendation_candidates_v2(bigint, integer, integer) to service_role;
