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
        (request_scope = 'open' and request.status = 'open' and (target_user_id is null or request.author_id <> target_user_id))
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
