-- Shared project delivery workspaces, participant chat, staged billing, and
-- talent earnings. Client payments and talent payouts are deliberately kept
-- as separate ledgers: a verified Paddle payment creates a 60% talent pool,
-- while an admin payout later settles each talent's individual allocation.

create table if not exists public.project_workspaces (
  project_id uuid primary key references public.projects (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'paused', 'delivery_ready', 'completed', 'archived')),
  generated_by text not null default 'ai'
    check (generated_by in ('ai', 'proposal', 'fallback', 'manual')),
  progress_percent smallint not null default 0
    check (progress_percent between 0 and 100),
  expected_completion_at timestamptz,
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces (project_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text,
  sequence smallint not null check (sequence > 0),
  duration_days smallint not null default 7 check (duration_days between 1 and 180),
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed')),
  payment_amount bigint not null default 0 check (payment_amount >= 0),
  payment_status text not null default 'not_due'
    check (payment_status in ('not_due', 'due', 'pending', 'paid', 'waived')),
  started_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, sequence)
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces (project_id) on delete cascade,
  milestone_id uuid not null references public.project_milestones (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 220),
  description text,
  sequence smallint not null check (sequence > 0),
  assigned_talent_id uuid references auth.users (id) on delete set null,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'completed')),
  completed_by uuid references auth.users (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (milestone_id, sequence)
);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces (project_id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'talent', 'admin')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists workspace_milestone_id uuid,
  add column if not exists period_key text,
  add column if not exists description text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_workspace_milestone_id_fkey'
  ) then
    alter table public.payments
      add constraint payments_workspace_milestone_id_fkey
      foreign key (workspace_milestone_id) references public.project_milestones (id)
      on delete set null;
  end if;
end $$;

create unique index if not exists payments_workspace_milestone_unique
  on public.payments (workspace_milestone_id)
  where workspace_milestone_id is not null and status in ('pending', 'paid');
create unique index if not exists payments_project_period_unique
  on public.payments (project_id, kind, period_key)
  where period_key is not null and status in ('pending', 'paid');

create table if not exists public.talent_earnings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  payment_id uuid not null references public.payments (id) on delete cascade,
  talent_id uuid not null references auth.users (id) on delete cascade,
  client_payment_amount bigint not null check (client_payment_amount >= 0),
  talent_pool_amount bigint not null check (talent_pool_amount >= 0),
  amount_owed bigint not null check (amount_owed >= 0),
  share_percent numeric(6,3) not null default 0 check (share_percent >= 0 and share_percent <= 100),
  status text not null default 'owed' check (status in ('owed', 'paid', 'held', 'cancelled')),
  paid_at timestamptz,
  payout_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payment_id, talent_id)
);

create index if not exists project_milestones_project_idx
  on public.project_milestones (project_id, sequence);
create index if not exists project_tasks_project_idx
  on public.project_tasks (project_id, milestone_id, sequence);
create index if not exists project_messages_project_idx
  on public.project_messages (project_id, created_at);
create index if not exists talent_earnings_talent_idx
  on public.talent_earnings (talent_id, created_at desc);
create index if not exists talent_earnings_project_idx
  on public.talent_earnings (project_id, status);

create or replace function public.is_project_participant(
  p_project_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id is not null and (
      exists (
        select 1 from public.projects p
        where p.id = p_project_id and p.client_id = p_user_id
      ) or
      exists (
        select 1 from public.project_assignments pa
        where pa.project_id = p_project_id
          and pa.talent_id = p_user_id
          and pa.status in ('assigned', 'active', 'completed')
      ) or
      public.is_admin()
    );
$$;

revoke all on function public.is_project_participant(uuid, uuid) from public, anon;
grant execute on function public.is_project_participant(uuid, uuid) to authenticated, service_role;

alter table public.project_workspaces enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_messages enable row level security;
alter table public.talent_earnings enable row level security;

drop policy if exists "Participants read project workspaces" on public.project_workspaces;
create policy "Participants read project workspaces"
  on public.project_workspaces for select
  using (public.is_project_participant(project_id));

drop policy if exists "Participants read project milestones" on public.project_milestones;
create policy "Participants read project milestones"
  on public.project_milestones for select
  using (public.is_project_participant(project_id));

drop policy if exists "Participants read project tasks" on public.project_tasks;
create policy "Participants read project tasks"
  on public.project_tasks for select
  using (public.is_project_participant(project_id));

drop policy if exists "Participants read project messages" on public.project_messages;
create policy "Participants read project messages"
  on public.project_messages for select
  using (public.is_project_participant(project_id));

drop policy if exists "Participants send project messages" on public.project_messages;
create policy "Participants send project messages"
  on public.project_messages for insert
  with check (
    sender_id = auth.uid() and
    public.is_project_participant(project_id) and
    (
      (sender_role = 'admin' and public.is_admin()) or
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role::text = sender_role
      )
    )
  );

drop policy if exists "Talent reads own earnings" on public.talent_earnings;
create policy "Talent reads own earnings"
  on public.talent_earnings for select
  using (talent_id = auth.uid() or public.is_admin());

grant select on public.project_workspaces, public.project_milestones, public.project_tasks
  to authenticated;
grant select, insert on public.project_messages to authenticated;
grant select on public.talent_earnings to authenticated;
grant select, insert, update, delete on
  public.project_workspaces,
  public.project_milestones,
  public.project_tasks,
  public.project_messages,
  public.talent_earnings
  to service_role;

create or replace function public.complete_project_task(p_task_id uuid)
returns table (
  completed_task_id uuid,
  completed_milestone_id uuid,
  milestone_completed boolean,
  project_progress smallint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
  v_milestone_id uuid;
  v_milestone_completed boolean := false;
  v_total integer;
  v_done integer;
  v_progress smallint;
  v_title text;
  v_client_id uuid;
begin
  select t.project_id, t.milestone_id
  into v_project_id, v_milestone_id
  from public.project_tasks t
  where t.id = p_task_id
  for update;

  if v_project_id is null then
    raise exception 'Task not found';
  end if;
  if not exists (
    select 1 from public.project_assignments pa
    where pa.project_id = v_project_id
      and pa.talent_id = v_user_id
      and pa.status in ('assigned', 'active')
  ) then
    raise exception 'Only assigned project talent can complete tasks';
  end if;

  update public.project_tasks
  set status = 'completed', completed_by = v_user_id,
      completed_at = coalesce(completed_at, now()), updated_at = now()
  where id = p_task_id and status <> 'completed';

  if not exists (
    select 1 from public.project_tasks
    where milestone_id = v_milestone_id and status <> 'completed'
  ) then
    update public.project_milestones
    set status = 'completed', completed_by = v_user_id,
        completed_at = coalesce(completed_at, now()),
        payment_status = case
          when payment_amount > 0 and payment_status = 'not_due' then 'due'
          else payment_status
        end,
        updated_at = now()
    where id = v_milestone_id and status <> 'completed'
    returning true into v_milestone_completed;
  else
    update public.project_milestones
    set status = 'in_progress', started_at = coalesce(started_at, now()), updated_at = now()
    where id = v_milestone_id and status = 'planned';
  end if;

  select count(*), count(*) filter (where status = 'completed')
  into v_total, v_done
  from public.project_tasks
  where project_id = v_project_id;
  v_progress := case when v_total = 0 then 0 else round((v_done::numeric / v_total) * 100)::smallint end;

  update public.project_workspaces
  set progress_percent = v_progress,
      status = case when v_progress = 100 then 'delivery_ready' else status end,
      updated_at = now()
  where project_id = v_project_id;

  if v_milestone_completed then
    select p.title, p.client_id into v_title, v_client_id
    from public.projects p where p.id = v_project_id;
    insert into public.notifications (
      recipient_user_id, recipient_role, project_id, type, title, message
    ) values (
      v_client_id, 'client', v_project_id, 'milestone_completed',
      'A project milestone is complete',
      v_title || ' has reached ' || v_progress || '% completion.'
    );
  end if;

  return query select p_task_id, v_milestone_id, v_milestone_completed, v_progress;
end;
$$;

revoke all on function public.complete_project_task(uuid) from public, anon;
grant execute on function public.complete_project_task(uuid) to authenticated;

create or replace function public.allocate_talent_earnings_for_payment(p_payment_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_amount bigint;
  v_pool bigint;
  v_count integer;
  v_inserted integer := 0;
begin
  select p.project_id, p.amount into v_project_id, v_amount
  from public.payments p
  where p.id = p_payment_id and p.status = 'paid';
  if v_project_id is null then return 0; end if;

  select count(*) into v_count
  from public.project_assignments pa
  where pa.project_id = v_project_id and pa.status in ('assigned', 'active', 'completed');
  if v_count = 0 then return 0; end if;

  v_pool := floor(v_amount * 0.60)::bigint;
  insert into public.talent_earnings (
    project_id, payment_id, talent_id, client_payment_amount,
    talent_pool_amount, amount_owed, share_percent, status
  )
  select
    v_project_id,
    p_payment_id,
    ranked.talent_id,
    v_amount,
    v_pool,
    (v_pool / v_count) + case when ranked.position <= (v_pool % v_count) then 1 else 0 end,
    round(60.0 / v_count, 3),
    'owed'
  from (
    select pa.talent_id, row_number() over (order by pa.talent_id) as position
    from public.project_assignments pa
    where pa.project_id = v_project_id and pa.status in ('assigned', 'active', 'completed')
  ) ranked
  on conflict (payment_id, talent_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.allocate_talent_earnings_for_payment(uuid)
  from public, anon, authenticated;
grant execute on function public.allocate_talent_earnings_for_payment(uuid) to service_role;

create or replace function public.record_workspace_payment(
  p_transaction_id text,
  p_event_id text,
  p_event_type text,
  p_paid_at timestamptz,
  p_invoice_number text default null,
  p_payload jsonb default null
)
returns table (recorded_project_id uuid, recorded_payment_id uuid, processed_new boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_project_id uuid;
  v_milestone_id uuid;
  v_client_id uuid;
  v_kind text;
  v_title text;
begin
  select pay.id, pay.project_id, pay.workspace_milestone_id, pay.client_id, pay.kind
  into v_payment_id, v_project_id, v_milestone_id, v_client_id, v_kind
  from public.payments pay
  where pay.provider_transaction_id = p_transaction_id
  for update;
  if v_payment_id is null then raise exception 'Payment transaction is not registered'; end if;

  if exists (select 1 from public.payment_events where event_id = p_event_id) then
    return query select v_project_id, v_payment_id, false;
    return;
  end if;

  insert into public.payment_events (
    event_id, event_type, project_id, provider_transaction_id, payload
  ) values (p_event_id, p_event_type, v_project_id, p_transaction_id, p_payload);

  update public.payments
  set status = 'paid', paid_at = p_paid_at,
      invoice_number = p_invoice_number, updated_at = now()
  where id = v_payment_id;

  if v_milestone_id is not null then
    update public.project_milestones
    set payment_status = 'paid', updated_at = now()
    where id = v_milestone_id;
  end if;

  perform public.allocate_talent_earnings_for_payment(v_payment_id);
  select title into v_title from public.projects where id = v_project_id;

  insert into public.notifications (
    recipient_user_id, recipient_role, project_id, type, title, message
  )
  select pa.talent_id, 'talent', v_project_id, 'earnings_added',
    'New project earnings',
    'A verified ' || replace(v_kind, '_', ' ') || ' payment for ' || v_title || ' added to your earnings.'
  from public.project_assignments pa
  where pa.project_id = v_project_id and pa.status in ('assigned', 'active', 'completed');

  insert into public.notifications (
    recipient_user_id, recipient_role, project_id, type, title, message, payload
  ) values (
    null, 'admin', v_project_id, 'workspace_payment', 'Project payment received',
    v_title || ' received a verified ' || replace(v_kind, '_', ' ') || ' payment.',
    jsonb_build_object('payment_id', v_payment_id, 'transaction_id', p_transaction_id)
  );

  return query select v_project_id, v_payment_id, true;
end;
$$;

revoke all on function public.record_workspace_payment(text, text, text, timestamptz, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_workspace_payment(text, text, text, timestamptz, text, jsonb)
  to service_role;

drop trigger if exists project_workspaces_touch_updated_at on public.project_workspaces;
create trigger project_workspaces_touch_updated_at
  before update on public.project_workspaces
  for each row execute function public.touch_project_workflow_updated_at();
drop trigger if exists project_milestones_touch_updated_at on public.project_milestones;
create trigger project_milestones_touch_updated_at
  before update on public.project_milestones
  for each row execute function public.touch_project_workflow_updated_at();
drop trigger if exists project_tasks_touch_updated_at on public.project_tasks;
create trigger project_tasks_touch_updated_at
  before update on public.project_tasks
  for each row execute function public.touch_project_workflow_updated_at();
drop trigger if exists project_messages_touch_updated_at on public.project_messages;
create trigger project_messages_touch_updated_at
  before update on public.project_messages
  for each row execute function public.touch_project_workflow_updated_at();
drop trigger if exists talent_earnings_touch_updated_at on public.talent_earnings;
create trigger talent_earnings_touch_updated_at
  before update on public.talent_earnings
  for each row execute function public.touch_project_workflow_updated_at();

-- Existing paid projects immediately receive their historical 60% allocations.
do $$
declare v_payment record;
begin
  for v_payment in select id from public.payments where status = 'paid' loop
    perform public.allocate_talent_earnings_for_payment(v_payment.id);
  end loop;
end $$;

-- Add project chat to Supabase Realtime exactly once.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_messages'
  ) then
    alter publication supabase_realtime add table public.project_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_tasks'
  ) then
    alter publication supabase_realtime add table public.project_tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_milestones'
  ) then
    alter publication supabase_realtime add table public.project_milestones;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_workspaces'
  ) then
    alter publication supabase_realtime add table public.project_workspaces;
  end if;
end $$;
