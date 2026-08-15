drop function if exists public.consume_ai_rate_limit(integer, integer);
drop function if exists private.consume_ai_rate_limit(integer, integer);
drop table if exists private.ai_rate_limits;

create table if not exists public.ai_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, window_start),
  constraint ai_rate_limits_request_count_check check (request_count >= 0)
);

alter table public.ai_rate_limits enable row level security;
revoke all on table public.ai_rate_limits from public, anon;
grant select, insert, update, delete on table public.ai_rate_limits to authenticated;

drop policy if exists ai_rate_limits_select_own on public.ai_rate_limits;
drop policy if exists ai_rate_limits_insert_own on public.ai_rate_limits;
drop policy if exists ai_rate_limits_update_own on public.ai_rate_limits;
drop policy if exists ai_rate_limits_delete_own on public.ai_rate_limits;

create policy ai_rate_limits_select_own
  on public.ai_rate_limits for select to authenticated
  using (user_id = auth.uid());
create policy ai_rate_limits_insert_own
  on public.ai_rate_limits for insert to authenticated
  with check (user_id = auth.uid());
create policy ai_rate_limits_update_own
  on public.ai_rate_limits for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy ai_rate_limits_delete_own
  on public.ai_rate_limits for delete to authenticated
  using (user_id = auth.uid());

create or replace function public.consume_ai_rate_limit()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_start timestamptz;
  v_request_count integer;
  v_limit constant integer := 30;
  v_window_seconds constant integer := 60;
begin
  if v_user_id is null then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / v_window_seconds) * v_window_seconds
  );

  delete from public.ai_rate_limits
  where user_id = v_user_id
    and updated_at < clock_timestamp() - interval '2 hours';

  insert into public.ai_rate_limits (user_id, window_start, request_count, updated_at)
  values (v_user_id, v_window_start, 1, clock_timestamp())
  on conflict (user_id, window_start)
  do update set
    request_count = public.ai_rate_limits.request_count + 1,
    updated_at = clock_timestamp()
  returning request_count into v_request_count;

  return v_request_count <= v_limit;
end;
$$;

revoke all on function public.consume_ai_rate_limit() from public, anon;
grant execute on function public.consume_ai_rate_limit() to authenticated;
