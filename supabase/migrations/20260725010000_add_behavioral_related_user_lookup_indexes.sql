-- Supports the fan-out side of behavioral recommendations, which filters
-- interactions by the users who saved the source product.  `added_at` is
-- included because it is used as the recency tie-breaker in the API route.
create index if not exists user_digbox_items_user_product_idx
  on public.user_digbox_items (user_id, product_id)
  include (added_at);

create index if not exists user_closet_items_user_product_idx
  on public.user_closet_items (user_id, product_id)
  include (added_at);
