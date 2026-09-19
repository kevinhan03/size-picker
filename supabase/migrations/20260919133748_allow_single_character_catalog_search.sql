-- Keep the product-search suggestion threshold consistent with the UI.
-- This function remains server-only (service_role), and the result cap is unchanged.
create or replace function public.search_catalog(search_query text, result_limit integer default 8)
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
  target_gender text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.brand, p.name, p.category, p.url, p.image_path, p.slug,
    p.created_at, p.is_instagram, p.instagram_order, p.target_gender
  from public.products p
  where length(trim(search_query)) between 1 and 50
    and (
      p.brand ilike ('%' || replace(replace(replace(trim(search_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%') escape E'\\'
      or p.name ilike ('%' || replace(replace(replace(trim(search_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%') escape E'\\'
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(result_limit, 8), 1), 8);
$$;

create or replace function public.search_catalog_brands(search_query text, result_limit integer default 8)
returns table (brand text, item_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.brand,
    count(*)::bigint as item_count
  from public.products p
  where length(trim(search_query)) between 1 and 50
    and p.brand ilike ('%' || replace(replace(replace(trim(search_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%') escape E'\\'
  group by p.brand
  order by
    case
      when p.brand ilike trim(search_query) then 0
      when p.brand ilike (replace(replace(replace(trim(search_query), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%') escape E'\\' then 1
      else 2
    end,
    item_count desc,
    p.brand asc
  limit least(greatest(coalesce(result_limit, 8), 1), 8);
$$;

revoke all on function public.search_catalog_brands(text, integer) from public, anon, authenticated;
grant execute on function public.search_catalog_brands(text, integer) to service_role;
