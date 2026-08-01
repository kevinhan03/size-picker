create index if not exists products_registered_by_created_at_idx
  on public.products (registered_by, created_at desc, id desc)
  where registered_by is not null;

create index if not exists outfit_requests_author_status_created_id_idx
  on public.outfit_requests (author_id, status, created_at desc, id desc);

create index if not exists outfit_requests_status_created_id_idx
  on public.outfit_requests (status, created_at desc, id desc);

create index if not exists outfit_proposals_request_author_created_idx
  on public.outfit_proposals (request_id, author_id, created_at desc);

create or replace function public.get_user_discovery_summary(target_user_id uuid)
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
  save_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    product.id, product.brand, product.name, product.category, product.url,
    product.image_path, product.slug, product.created_at, product.is_instagram,
    product.instagram_order, product.target_gender,
    count(distinct saved.user_id) filter (where saved.user_id <> target_user_id)::bigint as save_count
  from public.users owner
  join public.products product on product.registered_by = owner.username
  left join public.user_digbox_items saved on saved.product_id = product.id::text
  where owner.id = target_user_id
  group by product.id
  order by product.created_at desc, product.id desc;
$$;

revoke all on function public.get_user_discovery_summary(uuid) from public, anon, authenticated;
grant execute on function public.get_user_discovery_summary(uuid) to service_role;

create or replace function public.get_taste_analysis_products(target_user_id uuid, collection_source text)
returns table (product jsonb)
language sql
stable
security invoker
set search_path = ''
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
    'id', p.id,
    'brand', p.brand,
    'name', p.name,
    'category', p.category,
    'url', p.url,
    'image_path', p.image_path,
    'slug', p.slug,
    'created_at', p.created_at,
    'is_instagram', p.is_instagram,
    'instagram_order', p.instagram_order,
    'target_gender', p.target_gender,
    'style_tags', p.style_tags,
    'style_attributes', p.style_attributes,
    'human_style_tags', p.human_style_tags,
    'human_style_attributes', p.human_style_attributes,
    'human_target_gender', p.human_target_gender,
    'image_embedding', p.image_embedding
  ) as product
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

create or replace function public.list_outfit_request_summaries(
  target_user_id uuid,
  request_scope text,
  mine_status text default 'all',
  cursor_created_at timestamptz default null,
  cursor_id uuid default null,
  page_limit integer default 20
)
returns table (summary jsonb, total_count bigint, sort_created_at timestamptz, sort_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  with eligible as (
    select
      request.*,
      case when request_scope = 'proposed' then mine.created_at else request.created_at end as sort_at,
      mine.id as my_proposal_id,
      mine.created_at as proposed_at
    from public.outfit_requests request
    left join public.outfit_proposals mine
      on request_scope = 'proposed'
     and mine.request_id = request.id
     and mine.author_id = target_user_id
    where request_scope in ('open', 'completed', 'mine', 'proposed')
      and (
        (request_scope = 'open' and request.status = 'open' and request.author_id <> target_user_id)
        or (request_scope = 'completed' and request.status in ('accepted', 'closed'))
        or (request_scope = 'mine' and request.author_id = target_user_id and (mine_status = 'all' or request.status = mine_status))
        or (request_scope = 'proposed' and mine.id is not null)
      )
  ), page as (
    select eligible.*
    from eligible
    where cursor_created_at is null
       or cursor_id is null
       or (eligible.sort_at, eligible.id) < (cursor_created_at, cursor_id)
    order by eligible.sort_at desc, eligible.id desc
    limit least(20, greatest(1, page_limit))
  )
  select
    jsonb_build_object(
      'id', page.id,
      'author_id', page.author_id,
      'author_username', coalesce(author.username, ''),
      'description', page.description,
      'status', page.status,
      'accepted_proposal_id', page.accepted_proposal_id,
      'created_at', page.created_at,
      'item_count', (select count(*) from public.outfit_request_items item where item.request_id = page.id),
      'proposal_count', (select count(*) from public.outfit_proposals proposal where proposal.request_id = page.id),
      'preview_products', coalesce((
        select jsonb_agg(preview.product_snapshot order by preview.sort_order)
        from (
          select item.product_snapshot, item.sort_order
          from public.outfit_request_items item
          where item.request_id = page.id
          order by item.sort_order
          limit 4
        ) preview
      ), '[]'::jsonb),
      'focus_products', coalesce((
        select jsonb_agg(item.product_snapshot order by item.sort_order)
        from public.outfit_request_items item
        where item.request_id = page.id and item.is_focus
      ), '[]'::jsonb),
      'my_proposal_id', page.my_proposal_id,
      'proposed_at', page.proposed_at,
      'is_accepted', page.my_proposal_id is not null and page.accepted_proposal_id = page.my_proposal_id
    ),
    (select count(*) from eligible),
    page.sort_at,
    page.id
  from page
  join public.users author on author.id = page.author_id
  order by page.sort_at desc, page.id desc;
$$;

revoke all on function public.list_outfit_request_summaries(uuid, text, text, timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.list_outfit_request_summaries(uuid, text, text, timestamptz, uuid, integer) to service_role;
