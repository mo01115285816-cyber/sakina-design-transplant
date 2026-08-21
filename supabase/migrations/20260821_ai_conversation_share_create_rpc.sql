-- Atomic owner-checked share creation. The Edge Function receives only the raw token result.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_sakeenah_share(
  p_conversation_id uuid,
  p_owner_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.ai_conversations%rowtype;
  v_raw_token text;
  v_token_hash text;
  v_share public.ai_conversation_shares%rowtype;
begin
  if p_conversation_id is null or p_owner_user_id is null then
    raise exception 'invalid_share_input';
  end if;

  select * into v_conversation
  from public.ai_conversations
  where id = p_conversation_id
    and user_id = p_owner_user_id
  limit 1;

  if not found then
    raise exception 'conversation_not_found';
  end if;

  update public.ai_conversation_shares
  set revoked_at = timezone('utc', now())
  where conversation_id = p_conversation_id
    and owner_user_id = p_owner_user_id
    and revoked_at is null;

  v_raw_token := replace(replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_'), '=', '');
  v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

  insert into public.ai_conversation_shares (
    conversation_id,
    owner_user_id,
    token_hash,
    token_prefix
  ) values (
    p_conversation_id,
    p_owner_user_id,
    v_token_hash,
    left(v_raw_token, 10)
  ) returning * into v_share;

  return jsonb_build_object(
    'shareId', v_share.id,
    'token', v_raw_token,
    'createdAt', v_share.created_at,
    'expiresAt', v_share.expires_at
  );
end;
$$;

revoke all on function public.create_sakeenah_share(uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_sakeenah_share(uuid, uuid) to service_role;
