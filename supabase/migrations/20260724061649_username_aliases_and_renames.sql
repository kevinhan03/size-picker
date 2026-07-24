create table if not exists public.username_aliases (
  username text primary key,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint username_aliases_username_format
    check (username ~ '^[a-z0-9_.]{3,20}$')
);

alter table public.username_aliases enable row level security;
revoke all on table public.username_aliases from public, anon, authenticated;

create unique index if not exists users_username_lower_unique
  on public.users (lower(username));

create index if not exists username_aliases_user_id_idx
  on public.username_aliases (user_id);

create or replace function public.set_user_username(
  p_user_id uuid,
  p_username text,
  p_allow_rename boolean default false
)
returns table(username text, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := btrim(p_username);
  v_username_key text := lower(btrim(p_username));
  v_current_username text;
begin
  if p_user_id is null then
    raise exception 'authentication is required' using errcode = '22023';
  end if;

  if v_username !~ '^[A-Za-z0-9_.]{3,20}$' then
    raise exception 'invalid username' using errcode = '22023';
  end if;

  select u.username
    into v_current_username
    from public.users u
   where u.id = p_user_id
   for update;

  if v_current_username is not null and lower(v_current_username) = v_username_key then
    return query select v_current_username, false;
    return;
  end if;

  if v_current_username is not null and not p_allow_rename then
    raise exception 'username is already set' using errcode = '23505';
  end if;

  if exists (select 1 from public.users u where lower(u.username) = v_username_key)
    or exists (select 1 from public.username_aliases a where a.username = v_username_key) then
    raise exception 'username is already in use' using errcode = '23505';
  end if;

  if v_current_username is null then
    insert into public.users (id, username) values (p_user_id, v_username);
    return query select v_username, true;
    return;
  end if;

  insert into public.username_aliases (username, user_id)
  values (lower(v_current_username), p_user_id);

  update public.products
     set registered_by = v_username
   where registered_by = v_current_username;

  update public.users
     set username = v_username
   where id = p_user_id;

  return query select v_username, true;
exception
  when unique_violation then
    raise exception 'username is already in use' using errcode = '23505';
end;
$$;

revoke all on function public.set_user_username(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.set_user_username(uuid, text, boolean) to service_role;
