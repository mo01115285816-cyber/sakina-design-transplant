-- Security-definer projection for public shared conversations.
-- It returns only the explicitly shareable transcript projection.

create or replace function public.get_shared_sakeenah_conversation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    return null;
  end if;

  select jsonb_build_object(
    'conversation', jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'last_message_at', c.last_message_at
    ),
    'messages', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'createdAt', m.created_at
        ) order by m.created_at asc
      )
      from public.ai_messages m
      where m.conversation_id = c.id
        and m.user_id = s.owner_user_id
      limit 500
    ), '[]'::jsonb),
    'share', jsonb_build_object(
      'createdAt', s.created_at,
      'expiresAt', s.expires_at
    )
  ) into v_result
  from public.ai_conversation_shares s
  join public.ai_conversations c on c.id = s.conversation_id
  where s.token_hash = p_token_hash
    and s.revoked_at is null
    and (s.expires_at is null or s.expires_at > timezone('utc', now()))
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.get_shared_sakeenah_conversation(text) from public, anon, authenticated;
grant execute on function public.get_shared_sakeenah_conversation(text) to service_role;
