create index if not exists products_created_at_desc_idx
  on public.products (created_at desc, id desc);

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
  where length(trim(search_query)) between 2 and 50
    and (
      p.brand ilike ('%' || replace(replace(replace(trim(search_query), '\', '\\'), '%', '\%'), '_', '\_') || '%') escape '\'
      or p.name ilike ('%' || replace(replace(replace(trim(search_query), '\', '\\'), '%', '\%'), '_', '\_') || '%') escape '\'
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(result_limit, 8), 1), 8);
$$;

create or replace function public.get_product_recommendation_candidates(
  source_product_id bigint,
  candidate_limit integer default 60
)
returns table (id bigint, visual_similarity double precision)
language sql
stable
security invoker
set search_path = ''
as $$
  select candidate.id,
         greatest(0::double precision, 1 - (candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding)) as visual_similarity
  from public.products source
  join public.products candidate
    on candidate.id <> source.id
   and candidate.image_embedding is not null
  where source.id = source_product_id
    and source.image_embedding is not null
  order by candidate.image_embedding OPERATOR(extensions.<=>) source.image_embedding
  limit least(greatest(coalesce(candidate_limit, 60), 1), 100);
$$;

create or replace function public.get_digbox_counts(product_ids text[])
returns table (product_id text, save_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select item.product_id, count(distinct item.user_id)::bigint
  from public.user_digbox_items item
  where item.product_id = any(coalesce(product_ids, array[]::text[]))
  group by item.product_id;
$$;

revoke all on function public.search_catalog(text, integer) from public, anon, authenticated;
revoke all on function public.get_product_recommendation_candidates(bigint, integer) from public, anon, authenticated;
revoke all on function public.get_digbox_counts(text[]) from public, anon, authenticated;
grant execute on function public.search_catalog(text, integer) to service_role;
grant execute on function public.get_product_recommendation_candidates(bigint, integer) to service_role;
grant execute on function public.get_digbox_counts(text[]) to service_role;

drop policy if exists "delete own" on public.user_closet_items;
create policy "delete own" on public.user_closet_items for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "insert own" on public.user_closet_items;
create policy "insert own" on public.user_closet_items for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "select own" on public.user_closet_items;
create policy "select own" on public.user_closet_items for select to public using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own digbox items" on public.user_digbox_items;
create policy "Users can delete own digbox items" on public.user_digbox_items for delete to public using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own digbox items" on public.user_digbox_items;
create policy "Users can insert own digbox items" on public.user_digbox_items for insert to public with check ((select auth.uid()) = user_id);
drop policy if exists "Users can view own digbox items" on public.user_digbox_items;
create policy "Users can view own digbox items" on public.user_digbox_items for select to public using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own my size profiles" on public.user_my_size_profiles;
create policy "Users can delete own my size profiles" on public.user_my_size_profiles for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own my size profiles" on public.user_my_size_profiles;
create policy "Users can insert own my size profiles" on public.user_my_size_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can read own my size profiles" on public.user_my_size_profiles;
create policy "Users can read own my size profiles" on public.user_my_size_profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can update own my size profiles" on public.user_my_size_profiles;
create policy "Users can update own my size profiles" on public.user_my_size_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile" on public.users for insert to public with check ((select auth.uid()) = id);
drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users for update to public
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
