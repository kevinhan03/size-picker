do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_my_size_profiles_user_id_fkey'
      and conrelid = 'public.user_my_size_profiles'::regclass
  ) then
    alter table public.user_my_size_profiles
      add constraint user_my_size_profiles_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete cascade;
  end if;
end
$$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.anonymize_products_before_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
  set registered_by = null
  where registered_by = old.username;

  return old;
end;
$$;

revoke all on function private.anonymize_products_before_profile_delete() from public, anon, authenticated;

drop trigger if exists anonymize_products_before_profile_delete on public.users;
create trigger anonymize_products_before_profile_delete
before delete on public.users
for each row
execute function private.anonymize_products_before_profile_delete();
