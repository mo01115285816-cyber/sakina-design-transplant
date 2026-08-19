-- Persistent Sakeenah AI conversations and messages.
-- Every row is owned by the authenticated Supabase user and protected by RLS.

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'محادثة جديدة',
  context_summary text,
  summary_updated_at timestamptz,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_conversations_title_length check (char_length(title) between 1 and 160),
  constraint ai_conversations_summary_length check (
    context_summary is null or char_length(context_summary) <= 12000
  )
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ai_messages_role_check check (role in ('user', 'assistant')),
  constraint ai_messages_content_length check (char_length(content) between 1 and 8000)
);

comment on table public.ai_conversations is 'Private Sakeenah AI conversations owned by authenticated users.';
comment on table public.ai_messages is 'Private messages belonging to a user-owned Sakeenah AI conversation.';
comment on column public.ai_conversations.context_summary is 'Rolling conversation summary used to restore context without sending the full transcript.';

create index if not exists ai_conversations_user_last_message_idx
  on public.ai_conversations (user_id, last_message_at desc);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at asc);

create index if not exists ai_messages_user_created_idx
  on public.ai_messages (user_id, created_at desc);

drop trigger if exists ai_conversations_set_updated_at on public.ai_conversations;
create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row execute procedure public.set_updated_at();

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

revoke all on public.ai_conversations from anon;
revoke all on public.ai_messages from anon;
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;

drop policy if exists "Users can view their own AI conversations" on public.ai_conversations;
create policy "Users can view their own AI conversations"
on public.ai_conversations
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own AI conversations" on public.ai_conversations;
create policy "Users can create their own AI conversations"
on public.ai_conversations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own AI conversations" on public.ai_conversations;
create policy "Users can update their own AI conversations"
on public.ai_conversations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own AI conversations" on public.ai_conversations;
create policy "Users can delete their own AI conversations"
on public.ai_conversations
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own AI messages" on public.ai_messages;
create policy "Users can view their own AI messages"
on public.ai_messages
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.ai_conversations as conversation
    where conversation.id = ai_messages.conversation_id
      and conversation.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create their own AI messages" on public.ai_messages;
create policy "Users can create their own AI messages"
on public.ai_messages
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.ai_conversations as conversation
    where conversation.id = ai_messages.conversation_id
      and conversation.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update their own AI messages" on public.ai_messages;
create policy "Users can update their own AI messages"
on public.ai_messages
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own AI messages" on public.ai_messages;
create policy "Users can delete their own AI messages"
on public.ai_messages
for delete
to authenticated
using ((select auth.uid()) = user_id);
