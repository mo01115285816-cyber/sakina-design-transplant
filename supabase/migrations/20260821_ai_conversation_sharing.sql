-- Secure Sakeenah AI conversation sharing, public snapshots, and per-user forks.
-- Raw share tokens are never stored; only SHA-256 token hashes are persisted.

alter table public.ai_conversations
  add column if not exists pinned_at timestamptz;

create table if not exists public.ai_conversation_shares (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  expires_at timestamptz,
  constraint ai_conversation_shares_hash_length check (char_length(token_hash) = 64),
  constraint ai_conversation_shares_prefix_length check (char_length(token_prefix) between 6 and 16),
  constraint ai_conversation_shares_expiry_check check (expires_at is null or expires_at > created_at)
);

create table if not exists public.ai_conversation_forks (
  id uuid primary key default gen_random_uuid(),
  source_share_id uuid not null references public.ai_conversation_shares(id) on delete cascade,
  source_conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  source_owner_user_id uuid not null references auth.users(id) on delete cascade,
  forked_conversation_id uuid not null unique references public.ai_conversations(id) on delete cascade,
  forked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ai_conversation_forks_distinct_users_check check (source_owner_user_id <> forked_user_id)
);

create unique index if not exists ai_conversation_shares_one_active_per_conversation_idx
  on public.ai_conversation_shares (conversation_id)
  where revoked_at is null;

create unique index if not exists ai_conversation_forks_source_user_idx
  on public.ai_conversation_forks (source_share_id, forked_user_id);

create index if not exists ai_conversation_shares_owner_idx
  on public.ai_conversation_shares (owner_user_id, created_at desc);

create index if not exists ai_conversation_shares_public_lookup_idx
  on public.ai_conversation_shares (token_hash)
  where revoked_at is null;

create index if not exists ai_conversation_forks_forked_user_idx
  on public.ai_conversation_forks (forked_user_id, created_at desc);

comment on table public.ai_conversation_shares is 'Owner-controlled public share links for Sakeenah AI conversations; token hashes only.';
comment on table public.ai_conversation_forks is 'Audit trail for copying a shared conversation into another authenticated user account.';
comment on column public.ai_conversation_shares.token_hash is 'SHA-256 hex digest of a random URL-safe share token; raw tokens are never stored.';

-- Keep updated_at consistent with the existing project trigger helper.
drop trigger if exists ai_conversation_shares_set_updated_at on public.ai_conversation_shares;
create trigger ai_conversation_shares_set_updated_at
before update on public.ai_conversation_shares
for each row execute procedure public.set_updated_at();

alter table public.ai_conversation_shares enable row level security;
alter table public.ai_conversation_forks enable row level security;

revoke all on public.ai_conversation_shares from anon;
revoke all on public.ai_conversation_forks from anon;
revoke all on public.ai_conversation_shares from authenticated;
revoke all on public.ai_conversation_forks from authenticated;
grant select, insert, update, delete on public.ai_conversation_shares to authenticated;
grant select on public.ai_conversation_forks to authenticated;

 drop policy if exists "Owners can view their conversation shares" on public.ai_conversation_shares;
create policy "Owners can view their conversation shares"
on public.ai_conversation_shares
for select
to authenticated
using ((select auth.uid()) = owner_user_id);

drop policy if exists "Owners can create their conversation shares" on public.ai_conversation_shares;
create policy "Owners can create their conversation shares"
on public.ai_conversation_shares
for insert
to authenticated
with check (
  (select auth.uid()) = owner_user_id
  and exists (
    select 1 from public.ai_conversations c
    where c.id = conversation_id and c.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners can update their conversation shares" on public.ai_conversation_shares;
create policy "Owners can update their conversation shares"
on public.ai_conversation_shares
for update
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "Owners can delete their conversation shares" on public.ai_conversation_shares;
create policy "Owners can delete their conversation shares"
on public.ai_conversation_shares
for delete
to authenticated
using ((select auth.uid()) = owner_user_id);

drop policy if exists "Users can view forks involving their account" on public.ai_conversation_forks;
create policy "Users can view forks involving their account"
on public.ai_conversation_forks
for select
to authenticated
using (
  (select auth.uid()) = forked_user_id
  or (select auth.uid()) = source_owner_user_id
);

-- Atomic server-side fork. The Edge Function calls it with the already-hashed token
-- after authenticating the destination user; clients never receive service-role access.
create or replace function public.fork_sakeenah_conversation(
  p_token_hash text,
  p_forked_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_share public.ai_conversation_shares%rowtype;
  v_new_conversation_id uuid;
  v_existing_conversation_id uuid;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invalid_share_token';
  end if;

  select * into v_share
  from public.ai_conversation_shares
  where token_hash = p_token_hash
    and revoked_at is null
    and (expires_at is null or expires_at > timezone('utc', now()))
  limit 1;

  if not found then
    raise exception 'share_not_found';
  end if;

  if p_forked_user_id is null or p_forked_user_id = v_share.owner_user_id then
    raise exception 'invalid_fork_user';
  end if;

  select f.forked_conversation_id into v_existing_conversation_id
  from public.ai_conversation_forks f
  where f.source_share_id = v_share.id
    and f.forked_user_id = p_forked_user_id
  limit 1;

  if v_existing_conversation_id is not null then
    return v_existing_conversation_id;
  end if;

  insert into public.ai_conversations (user_id, title, context_summary, last_message_at)
  select
    p_forked_user_id,
    left(c.title, 160),
    null,
    c.last_message_at
  from public.ai_conversations c
  where c.id = v_share.conversation_id
  returning id into v_new_conversation_id;

  if v_new_conversation_id is null then
    raise exception 'conversation_not_found';
  end if;

  insert into public.ai_messages (conversation_id, user_id, role, content, created_at)
  select v_new_conversation_id, p_forked_user_id, m.role, m.content, m.created_at
  from public.ai_messages m
  where m.conversation_id = v_share.conversation_id
    and m.user_id = v_share.owner_user_id
  order by m.created_at asc;

  insert into public.ai_conversation_forks (
    source_share_id,
    source_conversation_id,
    source_owner_user_id,
    forked_conversation_id,
    forked_user_id
  ) values (
    v_share.id,
    v_share.conversation_id,
    v_share.owner_user_id,
    v_new_conversation_id,
    p_forked_user_id
  );

  return v_new_conversation_id;
end;
$$;

revoke all on function public.fork_sakeenah_conversation(text, uuid) from public, anon, authenticated;
grant execute on function public.fork_sakeenah_conversation(text, uuid) to service_role;

-- Keep direct client access closed; Edge Functions use service_role for public reads and atomic forks.
revoke all on public.ai_conversation_shares from service_role;
revoke all on public.ai_conversation_forks from service_role;
grant select, insert, update, delete on public.ai_conversation_shares to service_role;
grant select, insert, update, delete on public.ai_conversation_forks to service_role;
