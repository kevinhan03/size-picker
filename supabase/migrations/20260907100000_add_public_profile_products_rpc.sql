-- Public profiles need style inputs and product cards, but never the owner's
-- size decisions or discovered-save counts from the full collection RPC.
create or replace function public.get_public_profile_products(target_user_id uuid)
returns table (
  id bigint, brand text, name text, category text, sub_category text,
  url text, image_path text, slug text, created_at timestamptz,
  is_instagram boolean, instagram_order integer, target_gender text,
  human_target_gender text, style_attributes jsonb, style_axes jsonb,
  human_style_attributes jsonb, human_style_axes jsonb,
  style_axes_reviewed_at timestamptz, added_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.brand, p.name, p.category, p.sub_category, p.url,
    p.image_path, p.slug, p.created_at, p.is_instagram, p.instagram_order,
    p.target_gender, p.human_target_gender, p.style_attributes, p.style_axes,
    p.human_style_attributes, p.human_style_axes, p.style_axes_reviewed_at,
    item.added_at
  from public.user_digbox_items item
  join public.products p on p.id = case when item.product_id ~ '^[0-9]+$' then item.product_id::bigint end
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

revoke all on function public.get_public_profile_products(uuid) from public, anon, authenticated;
grant execute on function public.get_public_profile_products(uuid) to service_role;
