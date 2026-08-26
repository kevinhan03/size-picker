-- Collection reads must return the source product's stored sub-category.
-- Without it, DIGBOX and Closet filters cannot reflect an admin correction.
drop function if exists public.get_closet_products(uuid);
drop function if exists public.get_digbox_products(uuid);

create function public.get_closet_products(target_user_id uuid)
returns table (
  id bigint, brand text, name text, category text, sub_category text,
  url text, image_path text, slug text, created_at timestamptz,
  is_instagram boolean, instagram_order integer, target_gender text,
  human_target_gender text, style_tags jsonb, style_attributes jsonb,
  style_axes jsonb, human_style_tags jsonb, human_style_attributes jsonb,
  human_style_axes jsonb, tag_review_status text, added_at timestamptz,
  selected_size_label text, selected_size_row_index integer,
  selected_size_snapshot jsonb
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.brand, p.name, p.category, p.sub_category, p.url,
    p.image_path, p.slug, p.created_at, p.is_instagram, p.instagram_order,
    p.target_gender, p.human_target_gender, p.style_tags, p.style_attributes,
    p.style_axes, p.human_style_tags, p.human_style_attributes,
    p.human_style_axes, p.tag_review_status, item.added_at,
    item.selected_size_label, item.selected_size_row_index,
    item.selected_size_snapshot
  from public.user_closet_items item
  join public.products p on p.id = case when item.product_id ~ '^[0-9]+$' then item.product_id::bigint end
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

create function public.get_digbox_products(target_user_id uuid)
returns table (
  id bigint, brand text, name text, category text, sub_category text,
  url text, image_path text, slug text, created_at timestamptz,
  is_instagram boolean, instagram_order integer, target_gender text,
  human_target_gender text, style_tags jsonb, style_attributes jsonb,
  style_axes jsonb, human_style_tags jsonb, human_style_attributes jsonb,
  human_style_axes jsonb, tag_review_status text, registered_by text,
  added_at timestamptz, discovered_save_count bigint,
  size_decision_label text, size_decision_row_index integer,
  size_decision_snapshot jsonb, size_decision_sources text[],
  size_decision_fit text, size_decision_note text,
  size_decision_updated_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.brand, p.name, p.category, p.sub_category, p.url,
    p.image_path, p.slug, p.created_at, p.is_instagram, p.instagram_order,
    p.target_gender, p.human_target_gender, p.style_tags, p.style_attributes,
    p.style_axes, p.human_style_tags, p.human_style_attributes,
    p.human_style_axes, p.tag_review_status, p.registered_by, item.added_at,
    case when owner.username is not null and p.registered_by = owner.username then
      greatest(0::bigint, coalesce(saves.save_count, 0::bigint) - 1) else 0::bigint end,
    item.size_decision_label, item.size_decision_row_index,
    item.size_decision_snapshot, item.size_decision_sources,
    item.size_decision_fit, item.size_decision_note,
    item.size_decision_updated_at
  from public.user_digbox_items item
  join public.products p on p.id = case when item.product_id ~ '^[0-9]+$' then item.product_id::bigint end
  left join public.users owner on owner.id = item.user_id
  left join (
    select saved.product_id, count(distinct saved.user_id)::bigint as save_count
    from public.user_digbox_items saved
    group by saved.product_id
  ) saves on saves.product_id = item.product_id
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

revoke all on function public.get_closet_products(uuid) from public, anon, authenticated;
revoke all on function public.get_digbox_products(uuid) from public, anon, authenticated;
grant execute on function public.get_closet_products(uuid) to service_role;
grant execute on function public.get_digbox_products(uuid) to service_role;
