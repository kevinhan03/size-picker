-- Private, server-owned conversation state. No client can choose another actor.
create table public.fashion_agent_conversations (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default '',
  messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages) = 'array'),
  state jsonb not null default '{"plan":null,"resultIds":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
create index fashion_agent_conversations_user_updated_idx on public.fashion_agent_conversations(user_id, updated_at desc);
create table public.fashion_agent_requests (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.fashion_agent_conversations(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now(),
  response jsonb
);
create index fashion_agent_requests_user_created_idx on public.fashion_agent_requests(user_id, created_at desc);
alter table public.fashion_agent_conversations enable row level security;
alter table public.fashion_agent_requests enable row level security;
revoke all on public.fashion_agent_conversations, public.fashion_agent_requests from public, anon, authenticated;
grant select, insert, update, delete on public.fashion_agent_conversations, public.fashion_agent_requests to service_role;

create function public.fashion_agent_begin(actor uuid, conversation uuid, request_id uuid, message text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.fashion_agent_conversations; r public.fashion_agent_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 731));
  select * into r from public.fashion_agent_requests where id = request_id;
  if found then
    if r.user_id <> actor or r.conversation_id <> conversation then raise exception 'conversation_not_found'; end if;
    if r.status = 'completed' then return jsonb_build_object('cached',r.response); end if;
    if r.status = 'pending' and r.created_at > now() - interval '90 seconds' then raise exception 'conversation_busy'; end if;
    -- A retry gets a new request ID; an old worker cannot commit to a new lease.
    raise exception 'request_expired';
  end if;
  select * into c from public.fashion_agent_conversations where id = conversation for update;
  if found and c.user_id <> actor then raise exception 'conversation_not_found'; end if;
  if (select count(*) from public.fashion_agent_requests where user_id = actor and created_at > now() - interval '1 hour') >= 30 then raise exception 'rate_limited'; end if;
  if exists(select 1 from public.fashion_agent_requests where user_id = actor and status = 'pending' and created_at > now() - interval '90 seconds') then raise exception 'conversation_busy'; end if;
  if c.id is null then
    insert into public.fashion_agent_conversations(id,user_id,title) values(conversation,actor,left(message,70)) returning * into c;
  end if;
  if jsonb_array_length(c.messages) >= 80 then raise exception 'conversation_full'; end if;
  insert into public.fashion_agent_requests(id,user_id,conversation_id) values(request_id,actor,conversation);
  return jsonb_build_object('state',c.state,'messages',c.messages);
end;
$$;

create function public.fashion_agent_finish(actor uuid, conversation uuid, request_id uuid, new_messages jsonb, new_state jsonb, result jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare r public.fashion_agent_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 731));
  select * into r from public.fashion_agent_requests where id = request_id and user_id = actor and conversation_id = conversation for update;
  if not found or r.status <> 'pending' or r.created_at <= now() - interval '90 seconds' then raise exception 'request_expired'; end if;
  if jsonb_typeof(new_messages) <> 'array' or jsonb_array_length(new_messages) <> 2 then raise exception 'invalid_messages'; end if;
  update public.fashion_agent_conversations set messages = messages || new_messages, state = new_state, updated_at = now() where id = conversation and user_id = actor;
  if not found then raise exception 'conversation_not_found'; end if;
  update public.fashion_agent_requests set status = 'completed', response = result where id = request_id;
end;
$$;

-- Filters run before the bounded candidate pool. Facts use the same reviewed
-- object precedence as the application; unknown values never satisfy a filter.
create function public.fashion_agent_search(filters jsonb, target_axes jsonb default '{}'::jsonb)
returns setof jsonb language sql stable security invoker set search_path = '' as $$
  with candidates as (
    select p,
      case when p.facts_reviewed_at is not null and jsonb_typeof(p.human_style_attributes) = 'object'
        then p.human_style_attributes else p.style_attributes end as facts,
      case when p.style_axes_reviewed_at is not null and jsonb_typeof(p.human_style_axes) = 'object'
        and (select count(*) from jsonb_each(p.human_style_axes)) = 8
        then p.human_style_axes else p.style_axes end as axes
    from public.products p
    where (filters->>'category' is null or lower(p.category) = lower(filters->>'category'))
      and (filters->>'subCategory' is null or lower(p.sub_category) = lower(filters->>'subCategory'))
      and (filters->>'brand' is null or lower(p.brand) = lower(filters->>'brand'))
      and (filters->>'targetGender' is null or coalesce(nullif(p.human_target_gender,''),p.target_gender) in (filters->>'targetGender','unisex'))
      and not exists (
        select 1 from jsonb_array_elements_text(coalesce(filters->'keywords','[]'::jsonb)) keyword
        where position(lower(keyword) in lower(coalesce(p.name,'') || ' ' || coalesce(p.brand,'') || ' ' || coalesce(p.sub_category,''))) = 0
      )
  ), qualified as (
    select * from candidates c
    where not exists (
      select 1 from jsonb_array_elements(coalesce(filters->'facts','[]'::jsonb)) f
      where not coalesce(c.facts->>(f->>'key') = f->>'value' or
        (jsonb_typeof(c.facts->(f->>'key')) = 'array' and c.facts->(f->>'key') ? (f->>'value')), false)
    ) and not exists (
      select 1 from jsonb_array_elements(coalesce(filters->'axes','[]'::jsonb)) a
      where not coalesce(case when jsonb_typeof(c.axes->(a->>'key')) = 'number' then
        (c.axes->>(a->>'key'))::numeric between (a->>'min')::numeric and (a->>'max')::numeric else false end, false)
    )
  )
  select jsonb_build_object(
    'id',(p).id,'brand',(p).brand,'name',(p).name,'category',(p).category,'sub_category',(p).sub_category,
    'url',(p).url,'image_path',(p).image_path,'slug',(p).slug,'created_at',(p).created_at,
    'target_gender',(p).target_gender,'human_target_gender',(p).human_target_gender,
    'style_attributes',(p).style_attributes,'human_style_attributes',(p).human_style_attributes,
    'style_axes',(p).style_axes,'human_style_axes',(p).human_style_axes,
    'facts_reviewed_at',(p).facts_reviewed_at,'style_axes_reviewed_at',(p).style_axes_reviewed_at
  ) from qualified
  order by case when target_axes <> '{}'::jsonb then (
    select avg(case when jsonb_typeof(axes->t.key) = 'number' then power((axes->>t.key)::numeric - t.value::numeric,2) else 49 end)
    from jsonb_each_text(target_axes) t
  ) else 0 end asc nulls last, (p).created_at desc, (p).id desc
  limit 200;
$$;
revoke all on function public.fashion_agent_begin(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.fashion_agent_finish(uuid,uuid,uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.fashion_agent_search(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.fashion_agent_begin(uuid,uuid,uuid,text) to service_role;
grant execute on function public.fashion_agent_finish(uuid,uuid,uuid,jsonb,jsonb,jsonb) to service_role;
grant execute on function public.fashion_agent_search(jsonb,jsonb) to service_role;
