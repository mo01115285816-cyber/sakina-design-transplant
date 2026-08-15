create or replace function public.consume_ai_rate_limit(
  p_user_id uuid,
  p_limit integer default 30,
  p_window_seconds integer default 60
)
returns boolean
language sql
security definer
set search_path = private, pg_temp
as $$
  select private.consume_ai_rate_limit(p_user_id, p_limit, p_window_seconds);
$$;

revoke all on function public.consume_ai_rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_rate_limit(uuid, integer, integer) to service_role;
