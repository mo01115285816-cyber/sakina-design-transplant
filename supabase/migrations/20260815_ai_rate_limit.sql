-- AI rate limiting state is kept outside the exposed public schema.
create schema if not exists private;

create table if not exists private.ai_rate_limits (
  user_id uuid not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, window_start),
  constraint ai_rate_limits_request_count_check check (request_count >= 0)
);

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
revoke all on table private.ai_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.ai_rate_limits to service_role;

create or replace function private.consume_ai_rate_limit(
  p_user_id uuid,
  p_limit integer default 30,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_request_count integer;
begin
  if p_user_id is null or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  delete from private.ai_rate_limits
  where updated_at < clock_timestamp() - interval '2 hours';

  insert into private.ai_rate_limits (user_id, window_start, request_count, updated_at)
  values (p_user_id, v_window_start, 1, clock_timestamp())
  on conflict (user_id, window_start)
  do update set
    request_count = private.ai_rate_limits.request_count + 1,
    updated_at = clock_timestamp()
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$$;

revoke all on function private.consume_ai_rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function private.consume_ai_rate_limit(uuid, integer, integer) to service_role;
