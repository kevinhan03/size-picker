create index if not exists products_category_normalized_idx
  on public.products ((lower(trim(category))));

create or replace function public.get_product_recommendation_candidates_v2(
  source_product_id bigint,
  similar_limit integer default 120,
  style_limit integer default 160
)
returns table (recommendation_kind text, product jsonb, visual_similarity double precision)
language sql
stable
security invoker
set search_path = ''
as $$
  with source as (
    select
      p.*,
      case
        when p.tag_review_status in ('approved', 'edited') and jsonb_typeof(p.human_style_tags) = 'object'
          then p.human_style_tags
        when jsonb_typeof(p.style_tags) = 'object'
          then p.style_tags
        else '{}'::jsonb
      end as effective_style_tags,
      coalesce(nullif(lower(trim(p.human_target_gender)), ''), nullif(lower(trim(p.target_gender)), ''), 'unknown') as effective_gender
    from public.products p
    where p.id = source_product_id
  ), candidates as (
    select
      p.*,
      case
        when p.tag_review_status in ('approved', 'edited') and jsonb_typeof(p.human_style_tags) = 'object'
          then p.human_style_tags
        when jsonb_typeof(p.style_tags) = 'object'
          then p.style_tags
        else '{}'::jsonb
      end as effective_style_tags,
      coalesce(nullif(lower(trim(p.human_target_gender)), ''), nullif(lower(trim(p.target_gender)), ''), 'unknown') as effective_gender
    from public.products p
  ), similar_candidates as (
    select
      'similar'::text as recommendation_kind,
      jsonb_build_object(
        'id', candidate.id, 'brand', candidate.brand, 'name', candidate.name, 'category', candidate.category,
        'url', candidate.url, 'image_path', candidate.image_path, 'slug', candidate.slug,
        'created_at', candidate.created_at, 'is_instagram', candidate.is_instagram,
        'instagram_order', candidate.instagram_order, 'target_gender', candidate.target_gender,
        'style_tags', candidate.style_tags, 'style_attributes', candidate.style_attributes,
        'human_style_tags', candidate.human_style_tags, 'human_style_attributes', candidate.human_style_attributes,
        'tag_review_status', candidate.tag_review_status, 'human_target_gender', candidate.human_target_gender
      ) as product,
      greatest(0::double precision, 1 - (candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding)) as visual_similarity
    from source
    join candidates candidate
      on candidate.id <> source.id
     and lower(trim(candidate.category)) = lower(trim(source.category))
     and candidate.image_embedding is not null
    where source.image_embedding is not null
    order by candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding
    limit least(greatest(coalesce(similar_limit, 120), 24), 200)
  ), styled as (
    select
      'style'::text as recommendation_kind,
      jsonb_build_object(
        'id', candidate.id, 'brand', candidate.brand, 'name', candidate.name, 'category', candidate.category,
        'url', candidate.url, 'image_path', candidate.image_path, 'slug', candidate.slug,
        'created_at', candidate.created_at, 'is_instagram', candidate.is_instagram,
        'instagram_order', candidate.instagram_order, 'target_gender', candidate.target_gender,
        'style_tags', candidate.style_tags, 'style_attributes', candidate.style_attributes,
        'human_style_tags', candidate.human_style_tags, 'human_style_attributes', candidate.human_style_attributes,
        'tag_review_status', candidate.tag_review_status, 'human_target_gender', candidate.human_target_gender
      ) as product,
      case when source.image_embedding is not null and candidate.image_embedding is not null
        then greatest(0::double precision, 1 - (candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding))
        else null
      end as visual_similarity,
      metrics.style_similarity
    from source
    join candidates candidate
      on candidate.id <> source.id
     and lower(trim(candidate.category)) in ('top', 'bottom', 'outer', 'shoes')
     and lower(trim(candidate.category)) <> lower(trim(source.category))
     and (source.effective_gender = 'unknown' or candidate.effective_gender = 'unknown'
       or source.effective_gender = candidate.effective_gender
       or source.effective_gender = 'unisex' or candidate.effective_gender = 'unisex')
    cross join lateral (
      select case when source_norm.norm = 0 or candidate_norm.norm = 0 then null
        else coalesce(dot_product.value, 0) / (source_norm.norm * candidate_norm.norm)
      end as style_similarity
      from lateral (
        select coalesce(sqrt(sum(power(entry.value::double precision, 2))), 0) as norm
        from jsonb_each_text(source.effective_style_tags) entry
        where entry.value ~ '^[0-9]+(\\.[0-9]+)?$'
      ) source_norm
      cross join lateral (
        select coalesce(sqrt(sum(power(entry.value::double precision, 2))), 0) as norm
        from jsonb_each_text(candidate.effective_style_tags) entry
        where entry.value ~ '^[0-9]+(\\.[0-9]+)?$'
      ) candidate_norm
      cross join lateral (
        select sum(source_entry.value::double precision * candidate_entry.value::double precision) as value
        from jsonb_each_text(source.effective_style_tags) source_entry
        join jsonb_each_text(candidate.effective_style_tags) candidate_entry using (key)
        where source_entry.value ~ '^[0-9]+(\\.[0-9]+)?$'
          and candidate_entry.value ~ '^[0-9]+(\\.[0-9]+)?$'
      ) dot_product
    ) metrics
    where lower(trim(source.category)) in ('top', 'bottom', 'outer', 'shoes')
      and metrics.style_similarity is not null
    order by metrics.style_similarity desc, candidate.id desc
    limit least(greatest(coalesce(style_limit, 160), 24), 240)
  )
  select recommendation_kind, product, visual_similarity from similar_candidates
  union all
  select recommendation_kind, product, visual_similarity from styled;
$$;

revoke all on function public.get_product_recommendation_candidates_v2(bigint, integer, integer) from public, anon, authenticated;
grant execute on function public.get_product_recommendation_candidates_v2(bigint, integer, integer) to service_role;
