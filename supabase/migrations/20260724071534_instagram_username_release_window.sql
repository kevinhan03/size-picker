alter table public.username_aliases
  add column if not exists available_at timestamptz;

update public.username_aliases
   set available_at = created_at + interval '14 days'
 where available_at is null;

alter table public.username_aliases
  alter column available_at set not null;

alter table public.username_aliases
  alter column available_at set default (now() + interval '14 days');

create index if not exists username_aliases_available_at_idx
  on public.username_aliases (available_at);

create table if not exists public.username_change_history (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  changed_at timestamptz not null default now()
);

alter table public.username_change_history enable row level security;
revoke all on table public.username_change_history from public, anon, authenticated;

create index if not exists username_change_history_user_id_changed_at_idx
  on public.username_change_history (user_id, changed_at desc);

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
  v_alias_user_id uuid;
  v_alias_available_at timestamptz;
  v_alias_exists boolean := false;
  v_recent_rename_count integer;
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

  if exists (select 1 from public.users u where lower(u.username) = v_username_key) then
    raise exception 'username is already in use' using errcode = '23505';
  end if;

  select a.user_id, a.available_at
    into v_alias_user_id, v_alias_available_at
    from public.username_aliases a
   where a.username = v_username_key
   for update;

  v_alias_exists := found;

  if v_alias_exists and v_alias_available_at > now() and v_alias_user_id <> p_user_id then
    raise exception 'username is already in use' using errcode = '23505';
  end if;

  if v_current_username is null then
    if v_alias_exists then
      delete from public.username_aliases where username = v_username_key;
    end if;
    insert into public.users (id, username) values (p_user_id, v_username);
    return query select v_username, true;
    return;
  end if;

  select count(*)
    into v_recent_rename_count
    from public.username_change_history h
   where h.user_id = p_user_id
     and h.changed_at > now() - interval '14 days';

  if v_recent_rename_count >= 2 then
    raise exception 'username changes are limited to twice every 14 days' using errcode = '22023';
  end if;

  if v_alias_exists then
    delete from public.username_aliases where username = v_username_key;
  end if;

  insert into public.username_change_history (user_id)
  values (p_user_id);

  insert into public.username_aliases (username, user_id, available_at)
  values (lower(v_current_username), p_user_id, now() + interval '14 days');

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
