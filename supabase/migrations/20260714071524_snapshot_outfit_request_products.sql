alter table public.outfit_request_items
  add column product_snapshot jsonb;

update public.outfit_request_items as request_item
set product_snapshot = jsonb_build_object(
  'id', product.id,
  'brand', product.brand,
  'name', product.name,
  'category', product.category,
  'url', product.url,
  'created_at', product.created_at,
  'image_path', product.image_path,
  'slug', product.slug
)
from public.products as product
where product.id = request_item.product_id;

alter table public.outfit_request_items
  alter column product_snapshot set not null,
  add constraint outfit_request_items_product_snapshot_object_check
    check (jsonb_typeof(product_snapshot) = 'object');
