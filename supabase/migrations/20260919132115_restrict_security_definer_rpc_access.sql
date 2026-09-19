-- These functions need elevated privileges internally, but neither should be
-- callable through the public Data API. The account-cleanup action is not
-- currently used by the app; retain server-only access for controlled use.
revoke all on function public.delete_my_unregistered_auth_user() from public, anon, authenticated;
grant execute on function public.delete_my_unregistered_auth_user() to service_role;

-- This is an auth.users trigger, not an RPC endpoint. Trigger invocation does
-- not require EXECUTE for anon/authenticated roles.
revoke all on function public.handle_new_user() from public, anon, authenticated;
