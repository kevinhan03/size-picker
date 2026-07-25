-- Supports server-only co-occurrence lookups for behavioral recommendations.
-- Existing RLS policies remain unchanged.
create index if not exists user_digbox_items_product_user_idx
  on public.user_digbox_items (product_id, user_id);

create index if not exists user_closet_items_product_user_idx
  on public.user_closet_items (product_id, user_id);
