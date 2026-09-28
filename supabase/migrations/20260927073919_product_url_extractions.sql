-- Server-only durable URL cache and leases. Browser access is through authenticated routes.
create table public.product_url_extractions (
  id uuid primary key default gen_random_uuid(),
  normalized_url text not null unique check (length(normalized_url) <= 4096),
  attempt uuid not null default gen_random_uuid(),
  status text not null check (status in ('static','queued','processing','completed','not_found','failed')),
  result_json jsonb,
  raw_result jsonb,
  metadata_json jsonb,
  error_code text,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);
create table public.product_extraction_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);
alter table public.product_url_extractions enable row level security;
alter table public.product_extraction_limits enable row level security;
revoke all on public.product_url_extractions, public.product_extraction_limits from public, anon, authenticated;
grant all on public.product_url_extractions, public.product_extraction_limits to service_role;

create function public.start_product_extraction(p_url text, p_user uuid, p_refresh boolean default false)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  item public.product_url_extractions;
  quota public.product_extraction_limits;
  is_leader boolean := false;
begin
  insert into public.product_extraction_limits(user_id) values(p_user) on conflict do nothing;
  select * into quota from public.product_extraction_limits where user_id = p_user for update;
  if quota.window_start < now() - interval '1 hour' then
    update public.product_extraction_limits set window_start = now(), request_count = 0 where user_id = p_user;
  elsif quota.request_count >= 30 then
    raise exception 'extraction_rate_limit';
  end if;
  update public.product_extraction_limits set request_count = request_count + 1 where user_id = p_user;
  insert into public.product_url_extractions(normalized_url, status) values(p_url, 'static')
    on conflict do nothing returning * into item;
  if found then
    is_leader := true;
  else
    select * into item from public.product_url_extractions where normalized_url = p_url for update;
    if item.expires_at <= now() or
       (item.status in ('static', 'queued', 'processing') and item.updated_at < now() - interval '2 minutes') or
       (p_refresh and item.status in ('completed','not_found','failed') and item.updated_at < now() - interval '5 minutes') then
      update public.product_url_extractions set attempt = gen_random_uuid(), status = 'static', result_json = null,
        raw_result = null, metadata_json = null, error_code = null,
        updated_at = now(), expires_at = now() + interval '10 minutes'
        where id = item.id returning * into item;
      is_leader := true;
    end if;
  end if;
  return jsonb_build_object('job', to_jsonb(item), 'leader', is_leader);
end;
$$;
revoke all on function public.start_product_extraction(text,uuid,boolean) from public, anon, authenticated;
grant execute on function public.start_product_extraction(text,uuid,boolean) to service_role;
