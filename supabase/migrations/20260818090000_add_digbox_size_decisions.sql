alter table public.user_digbox_items
  add column if not exists size_decision_label text,
  add column if not exists size_decision_row_index integer,
  add column if not exists size_decision_snapshot jsonb,
  add column if not exists size_decision_sources text[] not null default '{}',
  add column if not exists size_decision_fit text,
  add column if not exists size_decision_note text,
  add column if not exists size_decision_updated_at timestamptz;

alter table public.user_digbox_items
  drop constraint if exists user_digbox_items_size_decision_fit_check;
alter table public.user_digbox_items
  add constraint user_digbox_items_size_decision_fit_check
  check (size_decision_fit is null or size_decision_fit in ('tight', 'true_to_size', 'roomy'));

drop policy if exists "Users can update own digbox items" on public.user_digbox_items;
create policy "Users can update own digbox items"
  on public.user_digbox_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop function if exists public.get_digbox_products(uuid);
create or replace function public.get_digbox_products(target_user_id uuid)
returns table (
  id bigint, brand text, name text, category text, url text, image_path text,
  slug text, created_at timestamptz, is_instagram boolean, instagram_order integer,
  target_gender text, registered_by text, added_at timestamptz,
  discovered_save_count bigint, size_decision_label text, size_decision_row_index integer,
  size_decision_snapshot jsonb, size_decision_sources text[], size_decision_fit text,
  size_decision_note text, size_decision_updated_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$
  select p.id, p.brand, p.name, p.category, p.url, p.image_path, p.slug,
    p.created_at, p.is_instagram, p.instagram_order, p.target_gender, p.registered_by,
    item.added_at,
    case when owner.username is not null and p.registered_by = owner.username then
      greatest(0::bigint, coalesce(saves.save_count, 0::bigint) - 1) else 0::bigint end,
    item.size_decision_label, item.size_decision_row_index, item.size_decision_snapshot,
    item.size_decision_sources, item.size_decision_fit, item.size_decision_note,
    item.size_decision_updated_at
  from public.user_digbox_items item
  join public.products p on p.id = case when item.product_id ~ '^[0-9]+$' then item.product_id::bigint end
  left join public.users owner on owner.id = item.user_id
  left join (
    select saved.product_id, count(distinct saved.user_id)::bigint as save_count
    from public.user_digbox_items saved group by saved.product_id
  ) saves on saves.product_id = item.product_id
  where item.user_id = target_user_id
  order by item.added_at desc nulls last, p.id desc;
$$;

revoke all on function public.get_digbox_products(uuid) from public, anon, authenticated;
grant execute on function public.get_digbox_products(uuid) to service_role;
