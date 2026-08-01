create or replace function public.get_closet_products(target_user_id uuid)
returns table (
  id bigint,
  brand text,
  name text,
  category text,
  url text,
  image_path text,
  slug text,
  created_at timestamptz,
  is_instagram boolean,
  instagram_order integer,
  target_gender text,
  added_at timestamptz,
  selected_size_label text,
  selected_size_row_index integer,
  selected_size_snapshot jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.brand, p.name, p.category, p.url, p.image_path, p.slug,
    p.created_at, p.is_instagram, p.instagram_order, p.target_gender,
    item.added_at, item.selected_size_label, item.selected_size_row_index,
    item.selected_size_snapshot
  from public.user_closet_items item
  join public.products p on p.id = case
    when item.product_id ~ '^[0-9]+$' then item.product_id::bigint
  end
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

create or replace function public.get_digbox_products(target_user_id uuid)
returns table (
  id bigint,
  brand text,
  name text,
  category text,
  url text,
  image_path text,
  slug text,
  created_at timestamptz,
  is_instagram boolean,
  instagram_order integer,
  target_gender text,
  registered_by text,
  added_at timestamptz,
  discovered_save_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.brand, p.name, p.category, p.url, p.image_path, p.slug,
    p.created_at, p.is_instagram, p.instagram_order, p.target_gender,
    p.registered_by, item.added_at,
    case
      when owner.username is not null and p.registered_by = owner.username then
        greatest(
          0::bigint,
          (select count(distinct saved.user_id)
           from public.user_digbox_items saved
           where saved.product_id = item.product_id) - 1
        )
      else 0::bigint
    end as discovered_save_count
  from public.user_digbox_items item
  join public.products p on p.id = case
    when item.product_id ~ '^[0-9]+$' then item.product_id::bigint
  end
  left join public.users owner on owner.id = item.user_id
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

revoke all on function public.get_closet_products(uuid) from public, anon, authenticated;
revoke all on function public.get_digbox_products(uuid) from public, anon, authenticated;
grant execute on function public.get_closet_products(uuid) to service_role;
grant execute on function public.get_digbox_products(uuid) to service_role;
