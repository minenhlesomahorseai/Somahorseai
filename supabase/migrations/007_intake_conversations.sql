-- Persistent client-side conversations for the AI project intake flow.
-- The client can only ever read or write its own threads; the route handler
-- also uses the authenticated user's session, so no service-role key is needed.

create table if not exists public.intake_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New project intake',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intake_conversations_client_updated_idx
  on public.intake_conversations (client_id, updated_at desc);

create table if not exists public.intake_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.intake_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index if not exists intake_messages_conversation_created_idx
  on public.intake_messages (conversation_id, created_at);

alter table public.intake_conversations enable row level security;
alter table public.intake_messages enable row level security;

-- RLS policies restrict each client to their own rows; explicit table grants
-- let the authenticated Supabase role reach those policies.
grant select, insert, update on public.intake_conversations to authenticated;
grant select, insert on public.intake_messages to authenticated;

drop policy if exists "Clients manage their intake conversations" on public.intake_conversations;
create policy "Clients manage their intake conversations"
  on public.intake_conversations for all
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

drop policy if exists "Clients read their intake messages" on public.intake_messages;
create policy "Clients read their intake messages"
  on public.intake_messages for select
  using (
    exists (
      select 1 from public.intake_conversations c
      where c.id = conversation_id and c.client_id = auth.uid()
    )
  );

drop policy if exists "Clients insert their intake messages" on public.intake_messages;
create policy "Clients insert their intake messages"
  on public.intake_messages for insert
  with check (
    exists (
      select 1 from public.intake_conversations c
      where c.id = conversation_id and c.client_id = auth.uid()
    )
  );

create or replace function public.touch_intake_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.intake_conversations
    set updated_at = now()
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists intake_messages_touch_conversation on public.intake_messages;
create trigger intake_messages_touch_conversation
  after insert on public.intake_messages
  for each row execute function public.touch_intake_conversation_updated_at();
