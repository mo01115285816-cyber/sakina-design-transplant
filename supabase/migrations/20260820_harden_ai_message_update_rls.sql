-- Prevent cross-tenant reassignment of an owned message to another user's conversation.

drop policy if exists "Users can update their own AI messages" on public.ai_messages;
create policy "Users can update their own AI messages"
on public.ai_messages
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.ai_conversations as conversation
    where conversation.id = ai_messages.conversation_id
      and conversation.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.ai_conversations as conversation
    where conversation.id = ai_messages.conversation_id
      and conversation.user_id = (select auth.uid())
  )
);
