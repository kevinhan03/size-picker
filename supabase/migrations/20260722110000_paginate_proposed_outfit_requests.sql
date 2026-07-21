create or replace function public.list_my_outfit_request_proposals(
  p_author_id uuid,
  p_offset integer default 0,
  p_limit integer default 20
)
returns table (
  id uuid,
  request_id uuid,
  created_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select
    proposal.id,
    proposal.request_id,
    proposal.created_at
  from public.outfit_proposals as proposal
  inner join public.outfit_requests as request
    on request.id = proposal.request_id
  where proposal.author_id = p_author_id
  order by
    case
      when request.accepted_proposal_id = proposal.id then 0
      when request.status = 'open' then 1
      else 2
    end asc,
    proposal.created_at desc,
    proposal.id desc
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 20);
$$;

revoke all on function public.list_my_outfit_request_proposals(uuid, integer, integer) from public;
grant execute on function public.list_my_outfit_request_proposals(uuid, integer, integer) to service_role;
