-- Repair a stale deployment of the taste-analysis RPC that still referenced
-- removed style-tag columns after the eight-axis style model migration.
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

revoke all on function public.get_taste_analysis_products(uuid, text) from public, anon, authenticated;
grant execute on function public.get_taste_analysis_products(uuid, text) to service_role;
