-- Realtime project messaging: durable per-participant read state and message
-- notifications. This extends the participant-only workspace created in 011.

create table if not exists public.project_message_reads (
  project_id uuid not null references public.project_workspaces (project_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_message_reads_user_idx
  on public.project_message_reads (user_id, updated_at desc);

alter table public.project_message_reads enable row level security;

drop policy if exists "Participants read project message receipts" on public.project_message_reads;
create policy "Participants read project message receipts"
  on public.project_message_reads for select
  using (public.is_project_participant(project_id));

drop policy if exists "Participants create own project message receipt" on public.project_message_reads;
create policy "Participants create own project message receipt"
  on public.project_message_reads for insert
  with check (
    user_id = auth.uid()
    and public.is_project_participant(project_id)
  );

drop policy if exists "Participants update own project message receipt" on public.project_message_reads;
create policy "Participants update own project message receipt"
  on public.project_message_reads for update
  using (
    user_id = auth.uid()
    and public.is_project_participant(project_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_project_participant(project_id)
  );

grant select, insert, update on public.project_message_reads to authenticated;
grant select, insert, update, delete on public.project_message_reads to service_role;

drop trigger if exists project_message_reads_touch_updated_at on public.project_message_reads;
create trigger project_message_reads_touch_updated_at
  before update on public.project_message_reads
  for each row execute function public.touch_project_workflow_updated_at();

create or replace function public.notify_project_message_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_title text;
  v_sender_name text;
  v_recipient record;
begin
  select p.title into v_project_title
  from public.projects p
  where p.id = new.project_id;

  if new.sender_role = 'admin' then
    v_sender_name := 'Somahorse control room';
  else
    select coalesce(p.full_name, initcap(new.sender_role)) into v_sender_name
    from public.profiles p
    where p.id = new.sender_id;
    v_sender_name := coalesce(v_sender_name, initcap(new.sender_role));
  end if;

  for v_recipient in
    select p.client_id as user_id, 'client'::text as role
    from public.projects p
    where p.id = new.project_id
    union
    select pa.talent_id as user_id, 'talent'::text as role
    from public.project_assignments pa
    where pa.project_id = new.project_id
      and pa.status in ('assigned', 'active', 'completed')
  loop
    if v_recipient.user_id <> new.sender_id then
      insert into public.notifications (
        recipient_user_id,
        recipient_role,
        project_id,
        type,
        title,
        message,
        payload
      ) values (
        v_recipient.user_id,
        v_recipient.role,
        new.project_id,
        'project_message',
        v_sender_name || ' · ' || coalesce(v_project_title, 'Project'),
        left(new.body, 180),
        jsonb_build_object(
          'message_id', new.id,
          'sender_id', new.sender_id,
          'sender_name', v_sender_name,
          'sender_role', new.sender_role
        )
      );
    end if;
  end loop;

  if new.sender_role <> 'admin' then
    insert into public.notifications (
      recipient_user_id,
      recipient_role,
      project_id,
      type,
      title,
      message,
      payload
    ) values (
      null,
      'admin',
      new.project_id,
      'project_message',
      v_sender_name || ' · ' || coalesce(v_project_title, 'Project'),
      left(new.body, 180),
      jsonb_build_object(
        'message_id', new.id,
        'sender_id', new.sender_id,
        'sender_name', v_sender_name,
        'sender_role', new.sender_role
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function public.notify_project_message_participants() from public, anon, authenticated;

drop trigger if exists notify_project_message_participants on public.project_messages;
create trigger notify_project_message_participants
  after insert on public.project_messages
  for each row execute function public.notify_project_message_participants();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_message_reads'
  ) then
    alter publication supabase_realtime add table public.project_message_reads;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
