create table public.fashion_agent_card_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.fashion_agent_conversations(id) on delete cascade,
  request_id uuid not null references public.fashion_agent_requests(id) on delete cascade,
  assistant_message_id text not null,
  product_id bigint not null references public.products(id) on delete cascade,
  rank integer not null check (rank between 1 and 12),
  event_type text not null check (event_type in ('impression','click','save')),
  algorithm_version text not null,
  created_at timestamptz not null default now(),
  unique (request_id, product_id, event_type)
);
create index fashion_agent_card_events_created_idx on public.fashion_agent_card_events(created_at desc);
create index fashion_agent_card_events_type_idx on public.fashion_agent_card_events(event_type);
create index fashion_agent_card_events_request_idx on public.fashion_agent_card_events(request_id);
alter table public.fashion_agent_card_events enable row level security;
revoke all on public.fashion_agent_card_events from public, anon, authenticated;
grant select, insert, update, delete on public.fashion_agent_card_events to service_role;

create function public.fashion_agent_delete(actor uuid, conversation uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare owner uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 731));
  select user_id into owner from public.fashion_agent_conversations where id = conversation for update;
  if owner is null or owner <> actor then return false; end if;
  if exists (
    select 1 from public.fashion_agent_requests
    where conversation_id = conversation and user_id = actor
      and status = 'pending' and created_at > now() - interval '90 seconds'
  ) then raise exception 'conversation_busy'; end if;
  delete from public.fashion_agent_conversations where id = conversation and user_id = actor;
  return true;
end;
$$;
revoke all on function public.fashion_agent_delete(uuid,uuid) from public, anon, authenticated;
grant execute on function public.fashion_agent_delete(uuid,uuid) to service_role;

create function public.fashion_agent_card_event_totals()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'impressions', count(*) filter (where event_type = 'impression'),
    'clicks', count(*) filter (where event_type = 'click'),
    'saves', count(*) filter (where event_type = 'save')
  ) from public.fashion_agent_card_events;
$$;
revoke all on function public.fashion_agent_card_event_totals() from public, anon, authenticated;
grant execute on function public.fashion_agent_card_event_totals() to service_role;

-- Conversation deletion must not reset the hourly request allowance.
create table public.fashion_agent_rate_events (
  request_id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index fashion_agent_rate_events_user_created_idx on public.fashion_agent_rate_events(user_id, created_at desc);
create index fashion_agent_rate_events_created_idx on public.fashion_agent_rate_events(created_at);
alter table public.fashion_agent_rate_events enable row level security;
revoke all on public.fashion_agent_rate_events from public, anon, authenticated;
grant select, insert, update, delete on public.fashion_agent_rate_events to service_role;

create or replace function public.fashion_agent_begin(actor uuid, conversation uuid, request_id uuid, message text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.fashion_agent_conversations; r public.fashion_agent_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 731));
  select * into r from public.fashion_agent_requests where id = request_id;
  if found then
    if r.user_id <> actor or r.conversation_id <> conversation then raise exception 'conversation_not_found'; end if;
    if r.status = 'completed' then return jsonb_build_object('cached',r.response); end if;
    if r.status = 'pending' and r.created_at > now() - interval '90 seconds' then raise exception 'conversation_busy'; end if;
    raise exception 'request_expired';
  end if;
  if exists(select 1 from public.fashion_agent_rate_events rate where rate.request_id = $3) then
    raise exception 'request_expired';
  end if;
  select * into c from public.fashion_agent_conversations where id = conversation for update;
  if found and c.user_id <> actor then raise exception 'conversation_not_found'; end if;
  if (
    select count(*) from (
      select req.id from public.fashion_agent_requests req where req.user_id = actor and req.created_at > now() - interval '1 hour'
      union
      select rate.request_id from public.fashion_agent_rate_events rate where rate.user_id = actor and rate.created_at > now() - interval '1 hour'
    ) recent
  ) >= 30 then raise exception 'rate_limited'; end if;
  if exists(select 1 from public.fashion_agent_requests where user_id = actor and status = 'pending' and created_at > now() - interval '90 seconds') then raise exception 'conversation_busy'; end if;
  if c.id is null then
    insert into public.fashion_agent_conversations(id,user_id,title) values(conversation,actor,left(message,70)) returning * into c;
  end if;
  if jsonb_array_length(c.messages) >= 80 then raise exception 'conversation_full'; end if;
  insert into public.fashion_agent_requests(id,user_id,conversation_id) values(request_id,actor,conversation);
  insert into public.fashion_agent_rate_events(request_id,user_id) values(request_id,actor);
  return jsonb_build_object('state',c.state,'messages',c.messages);
end;
$$;
