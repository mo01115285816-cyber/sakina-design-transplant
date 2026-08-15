drop function if exists public.consume_ai_rate_limit(uuid, integer, integer);
drop function if exists private.consume_ai_rate_limit(uuid, integer, integer);

create or replace function private.consume_ai_rate_limit(
  p_limit integer default 30,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = private, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_start timestamptz;
  v_request_count integer;
begin
  if v_user_id is null or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  delete from private.ai_rate_limits
  where updated_at < clock_timestamp() - interval '2 hours';

  insert into private.ai_rate_limits (user_id, window_start, request_count, updated_at)
  values (v_user_id, v_window_start, 1, clock_timestamp())
  on conflict (user_id, window_start)
  do update set
    request_count = private.ai_rate_limits.request_count + 1,
    updated_at = clock_timestamp()
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$$;

create or replace function public.consume_ai_rate_limit(
  p_limit integer default 30,
  p_window_seconds integer default 60
)
returns boolean
language sql
security definer
set search_path = private, auth, pg_temp
as $$
  select private.consume_ai_rate_limit(p_limit, p_window_seconds);
$$;

revoke all on function private.consume_ai_rate_limit(integer, integer) from public, anon, authenticated, service_role;
revoke all on function public.consume_ai_rate_limit(integer, integer) from public, anon;
grant execute on function public.consume_ai_rate_limit(integer, integer) to authenticated, service_role;
