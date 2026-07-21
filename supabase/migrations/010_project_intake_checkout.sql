-- Durable project intake, proposal, staffing, payments, and notifications.
--
-- The intake conversation is the draft source of truth. A project is prepared
-- only when the client accepts a complete proposal, and becomes active only
-- after a verified Paddle transaction completes.

alter table public.intake_conversations
  add column if not exists stage text not null default 'discovering',
  add column if not exists question_count smallint not null default 0,
  add column if not exists intake_state jsonb not null default '{}'::jsonb,
  add column if not exists proposal jsonb,
  add column if not exists proposed_team jsonb not null default '[]'::jsonb,
  add column if not exists match_rationale text,
  add column if not exists project_id uuid;

alter table public.intake_conversations
  drop constraint if exists intake_conversations_stage_check;
alter table public.intake_conversations
  add constraint intake_conversations_stage_check
  check (stage in ('discovering', 'proposal_ready', 'checkout', 'converted', 'archived'));

alter table public.intake_conversations
  drop constraint if exists intake_conversations_question_count_check;
alter table public.intake_conversations
  add constraint intake_conversations_question_count_check
  check (question_count between 0 and 10);

alter table public.intake_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.talent_onboarding
  add column if not exists availability_status text not null default 'available';

alter table public.talent_onboarding
  drop constraint if exists talent_onboarding_availability_status_check;
alter table public.talent_onboarding
  add constraint talent_onboarding_availability_status_check
  check (availability_status in ('available', 'unavailable'));

alter table public.projects
  add column if not exists conversation_id uuid,
  add column if not exists solution_type text,
  add column if not exists delivery_format text,
  add column if not exists problem text,
  add column if not exists proposed_solution text,
  add column if not exists proposal jsonb,
  add column if not exists timeline_weeks smallint,
  add column if not exists build_fee_amount bigint,
  add column if not exists deposit_amount bigint,
  add column if not exists monthly_fee_amount bigint,
  add column if not exists currency text not null default 'ZAR',
  add column if not exists payment_status text not null default 'not_required',
  add column if not exists paddle_transaction_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists started_at timestamptz;

alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects
  add constraint projects_status_check
  check (status in (
    'scoping', 'awaiting_payment', 'matching', 'in_build',
    'monitoring', 'delivered', 'cancelled'
  ));

alter table public.projects
  drop constraint if exists projects_payment_status_check;
alter table public.projects
  add constraint projects_payment_status_check
  check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'refunded'));

alter table public.projects
  drop constraint if exists projects_solution_type_check;
alter table public.projects
  add constraint projects_solution_type_check
  check (
    solution_type is null or solution_type in (
      'traceability', 'quality_compliance', 'yield_intelligence',
      'logistics_distribution', 'farmer_records', 'farmer_credit', 'custom_ai'
    )
  );

alter table public.projects
  drop constraint if exists projects_amounts_check;
alter table public.projects
  add constraint projects_amounts_check
  check (
    coalesce(build_fee_amount, 0) >= 0 and
    coalesce(deposit_amount, 0) >= 0 and
    coalesce(monthly_fee_amount, 0) >= 0
  );

create unique index if not exists projects_conversation_id_unique
  on public.projects (conversation_id) where conversation_id is not null;
create unique index if not exists projects_paddle_transaction_id_unique
  on public.projects (paddle_transaction_id) where paddle_transaction_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_conversation_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_conversation_id_fkey
      foreign key (conversation_id) references public.intake_conversations (id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'intake_conversations_project_id_fkey'
  ) then
    alter table public.intake_conversations
      add constraint intake_conversations_project_id_fkey
      foreign key (project_id) references public.projects (id)
      on delete set null;
  end if;
end $$;

create table if not exists public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  talent_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  match_score smallint not null check (match_score between 0 and 100),
  reason text,
  status text not null default 'proposed'
    check (status in (
      'proposed', 'assigned', 'active', 'completed', 'released', 'needs_replacement'
    )),
  nominated_at timestamptz not null default now(),
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, talent_id)
);

-- A talent member may only be committed to one active project at a time.
create unique index if not exists project_assignments_one_active_project_per_talent
  on public.project_assignments (talent_id)
  where status in ('assigned', 'active');
create index if not exists project_assignments_project_idx
  on public.project_assignments (project_id);
create index if not exists project_assignments_talent_idx
  on public.project_assignments (talent_id, status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'paddle' check (provider in ('paddle')),
  provider_transaction_id text not null unique,
  kind text not null default 'deposit'
    check (kind in ('deposit', 'build_stage', 'delivery', 'monthly')),
  amount bigint not null check (amount >= 0),
  currency text not null default 'ZAR',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  invoice_number text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_project_idx on public.payments (project_id);
create index if not exists payments_client_idx on public.payments (client_id, created_at desc);

create table if not exists public.payment_events (
  event_id text primary key,
  event_type text not null,
  project_id uuid references public.projects (id) on delete set null,
  provider_transaction_id text,
  payload jsonb,
  processed_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users (id) on delete cascade,
  recipient_role text not null check (recipient_role in ('client', 'talent', 'admin')),
  project_id uuid references public.projects (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (recipient_role = 'admin' and recipient_user_id is null) or
    (recipient_role <> 'admin' and recipient_user_id is not null)
  )
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, created_at desc);
create index if not exists notifications_admin_idx
  on public.notifications (recipient_role, created_at desc)
  where recipient_role = 'admin';

alter table public.project_assignments enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Project assignments are visible to participants" on public.project_assignments;
create policy "Project assignments are visible to participants"
  on public.project_assignments for select
  using (
    talent_id = auth.uid() or
    public.is_admin() or
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.client_id = auth.uid()
    )
  );

drop policy if exists "Clients read their project payments" on public.payments;
create policy "Clients read their project payments"
  on public.payments for select
  using (client_id = auth.uid() or public.is_admin());

drop policy if exists "Users read their notifications" on public.notifications;
create policy "Users read their notifications"
  on public.notifications for select
  using (
    recipient_user_id = auth.uid() or
    (recipient_role = 'admin' and public.is_admin())
  );

drop policy if exists "Users update their notifications" on public.notifications;
create policy "Users update their notifications"
  on public.notifications for update
  using (
    recipient_user_id = auth.uid() or
    (recipient_role = 'admin' and public.is_admin())
  )
  with check (
    recipient_user_id = auth.uid() or
    (recipient_role = 'admin' and public.is_admin())
  );

grant select on public.project_assignments to authenticated;
grant select on public.payments to authenticated;
grant select, update on public.notifications to authenticated;
-- Proposal, pricing, payment, and activation fields are server-owned. Clients
-- can read their rows through RLS but cannot mutate them directly through the
-- Supabase data API.
revoke update on public.intake_conversations from authenticated;
revoke insert, update on public.projects from authenticated;
grant select on public.projects to authenticated;
grant select, insert, update, delete on public.project_assignments to service_role;
grant select, insert, update, delete on public.payments to service_role;
grant select, insert, update, delete on public.payment_events to service_role;
grant select, insert, update, delete on public.notifications to service_role;
grant select, insert, update, delete on public.projects to service_role;
grant select, insert, update, delete on public.intake_conversations to service_role;
grant select, insert, update, delete on public.intake_messages to service_role;

-- Only genuinely available, certified talent with no active assignment can be
-- proposed by the matching agent.
drop function if exists public.list_available_developers();
create function public.list_available_developers()
returns table (
  id uuid,
  full_name text,
  headline text,
  primary_role text,
  years_experience smallint,
  skills text[],
  country text,
  agri_experience text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    p.full_name,
    t.headline,
    t.primary_role,
    t.years_experience,
    t.skills,
    t.country,
    t.agri_experience
  from public.talent_onboarding t
  join public.profiles p on p.id = t.id
  where t.stage = 'approved'
    and t.availability_status = 'available'
    and not exists (
      select 1 from public.project_assignments pa
      where pa.talent_id = t.id and pa.status in ('assigned', 'active')
    )
  order by t.years_experience desc nulls last;
$$;

grant execute on function public.list_available_developers() to authenticated;

create or replace function public.list_my_talent_projects()
returns table (
  project_id uuid,
  title text,
  summary text,
  project_status text,
  solution_type text,
  timeline_weeks smallint,
  started_at timestamptz,
  assignment_role text,
  assignment_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.title,
    p.summary,
    p.status,
    p.solution_type,
    p.timeline_weeks,
    p.started_at,
    pa.role,
    pa.status
  from public.project_assignments pa
  join public.projects p on p.id = pa.project_id
  where pa.talent_id = auth.uid()
    and pa.status in ('assigned', 'active', 'completed')
  order by coalesce(p.started_at, p.created_at) desc;
$$;

grant execute on function public.list_my_talent_projects() to authenticated;

create or replace function public.touch_project_workflow_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_assignments_touch_updated_at on public.project_assignments;
create trigger project_assignments_touch_updated_at
  before update on public.project_assignments
  for each row execute function public.touch_project_workflow_updated_at();

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.touch_project_workflow_updated_at();

-- Atomically converts a completed intake proposal into an unpaid project and
-- records the proposed team. Paddle collection happens immediately afterward;
-- a retry reuses the same project instead of creating a duplicate.
create or replace function public.prepare_project_checkout(
  p_project_id uuid,
  p_conversation_id uuid,
  p_proposal jsonb,
  p_team jsonb,
  p_sector text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_existing_project_id uuid;
begin
  select client_id, project_id
  into v_client_id, v_existing_project_id
  from public.intake_conversations
  where id = p_conversation_id and stage in ('proposal_ready', 'checkout')
  for update;

  if v_client_id is null then
    raise exception 'Intake conversation is not ready for checkout';
  end if;
  if v_existing_project_id is not null then
    return v_existing_project_id;
  end if;
  if jsonb_array_length(coalesce(p_team, '[]'::jsonb)) = 0 then
    raise exception 'At least one available specialist is required';
  end if;

  insert into public.projects (
    id,
    client_id,
    conversation_id,
    title,
    summary,
    status,
    sector,
    scope,
    matched_team,
    solution_type,
    delivery_format,
    problem,
    proposed_solution,
    proposal,
    timeline,
    timeline_weeks,
    build_fee_amount,
    deposit_amount,
    monthly_fee_amount,
    currency,
    payment_status
  ) values (
    p_project_id,
    v_client_id,
    p_conversation_id,
    left(p_proposal ->> 'title', 160),
    left(p_proposal ->> 'summary', 500),
    'awaiting_payment',
    p_sector,
    p_proposal ->> 'approach',
    coalesce(array(select jsonb_array_elements(p_team) ->> 'id'), '{}'),
    p_proposal ->> 'solutionType',
    p_proposal ->> 'deliveryFormat',
    p_proposal ->> 'problem',
    p_proposal ->> 'approach',
    p_proposal,
    (p_proposal ->> 'timelineWeeks') || ' weeks',
    (p_proposal ->> 'timelineWeeks')::smallint,
    (p_proposal ->> 'buildFeeZar')::bigint,
    (p_proposal ->> 'depositZar')::bigint,
    (p_proposal ->> 'monthlyFeeZar')::bigint,
    'ZAR',
    'pending'
  );

  insert into public.project_assignments (
    project_id, talent_id, role, match_score, reason, status
  )
  select
    p_project_id,
    (member ->> 'id')::uuid,
    left(member ->> 'role', 160),
    greatest(0, least(100, (member ->> 'matchScore')::smallint)),
    left(member ->> 'reason', 500),
    'proposed'
  from jsonb_array_elements(p_team) as member;

  update public.intake_conversations
  set stage = 'checkout', project_id = p_project_id, proposed_team = p_team
  where id = p_conversation_id;

  return p_project_id;
end;
$$;

revoke all on function public.prepare_project_checkout(uuid, uuid, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.prepare_project_checkout(uuid, uuid, jsonb, jsonb, text)
  to service_role;

create or replace function public.attach_checkout_transaction(
  p_project_id uuid,
  p_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_deposit bigint;
  v_existing_transaction text;
begin
  select client_id, deposit_amount, paddle_transaction_id
  into v_client_id, v_deposit, v_existing_transaction
  from public.projects
  where id = p_project_id and status = 'awaiting_payment'
  for update;

  if v_client_id is null then
    raise exception 'Project is not awaiting payment';
  end if;
  if v_existing_transaction is not null and v_existing_transaction <> p_transaction_id then
    raise exception 'Project already has a different checkout transaction';
  end if;

  update public.projects
  set paddle_transaction_id = p_transaction_id, payment_status = 'pending'
  where id = p_project_id;

  insert into public.payments (
    project_id, client_id, provider_transaction_id, kind, amount, currency, status
  ) values (
    p_project_id, v_client_id, p_transaction_id, 'deposit', v_deposit, 'ZAR', 'pending'
  )
  on conflict (provider_transaction_id) do nothing;
end;
$$;

revoke all on function public.attach_checkout_transaction(uuid, text)
  from public, anon, authenticated;
grant execute on function public.attach_checkout_transaction(uuid, text)
  to service_role;

-- Activates a paid project exactly once. The partial unique index above closes
-- the race where the same talent is proposed to two unpaid projects: the first
-- paid project gets the assignment and the other is flagged for replacement.
create or replace function public.activate_paid_project(
  p_project_id uuid,
  p_transaction_id text,
  p_event_id text,
  p_event_type text,
  p_paid_at timestamptz,
  p_invoice_number text default null,
  p_subscription_id text default null,
  p_payload jsonb default null
)
returns table (
  activated_project_id uuid,
  project_status text,
  assigned_talent_ids uuid[],
  processed_new boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_title text;
  v_payment_status text;
  v_conflicts integer := 0;
  v_assignment record;
  v_assigned uuid[] := '{}';
  v_status text;
begin
  select client_id, title, payment_status into v_client_id, v_title, v_payment_status
  from public.projects
  where id = p_project_id and paddle_transaction_id = p_transaction_id
  for update;

  if v_client_id is null then
    raise exception 'Project transaction does not match';
  end if;

  if exists (select 1 from public.payment_events where event_id = p_event_id) then
    select p.status into v_status from public.projects p where p.id = p_project_id;
    select coalesce(array_agg(pa.talent_id), '{}') into v_assigned
    from public.project_assignments pa
    where pa.project_id = p_project_id and pa.status in ('assigned', 'active');
    return query select p_project_id, v_status, v_assigned, false;
    return;
  end if;

  if v_payment_status = 'paid' then
    insert into public.payment_events (
      event_id, event_type, project_id, provider_transaction_id, payload
    ) values (
      p_event_id, p_event_type, p_project_id, p_transaction_id, p_payload
    ) on conflict (event_id) do nothing;
    select p.status into v_status from public.projects p where p.id = p_project_id;
    select coalesce(array_agg(pa.talent_id), '{}') into v_assigned
    from public.project_assignments pa
    where pa.project_id = p_project_id and pa.status in ('assigned', 'active');
    return query select p_project_id, v_status, v_assigned, false;
    return;
  end if;

  insert into public.payment_events (
    event_id, event_type, project_id, provider_transaction_id, payload
  ) values (
    p_event_id, p_event_type, p_project_id, p_transaction_id, p_payload
  );

  update public.payments
  set status = 'paid', paid_at = p_paid_at, invoice_number = p_invoice_number
  where project_id = p_project_id and provider_transaction_id = p_transaction_id;

  for v_assignment in
    select id, talent_id
    from public.project_assignments
    where project_id = p_project_id and status = 'proposed'
    order by match_score desc
    for update
  loop
    begin
      update public.project_assignments
      set status = 'assigned', assigned_at = p_paid_at
      where id = v_assignment.id;
      v_assigned := array_append(v_assigned, v_assignment.talent_id);
    exception when unique_violation then
      update public.project_assignments
      set status = 'needs_replacement'
      where id = v_assignment.id;
      v_conflicts := v_conflicts + 1;
    end;
  end loop;

  if v_conflicts > 0 or coalesce(array_length(v_assigned, 1), 0) = 0 then
    v_status := 'matching';
  else
    v_status := 'in_build';
  end if;

  update public.projects
  set status = v_status,
      payment_status = 'paid',
      paid_at = p_paid_at,
      started_at = coalesce(started_at, p_paid_at),
      paddle_subscription_id = coalesce(p_subscription_id, paddle_subscription_id)
  where id = p_project_id;

  update public.intake_conversations
  set stage = 'converted', project_id = p_project_id
  where id = (select conversation_id from public.projects where id = p_project_id);

  insert into public.notifications (
    recipient_user_id, recipient_role, project_id, type, title, message
  ) values (
    v_client_id,
    'client',
    p_project_id,
    'project_started',
    'Your project has started',
    v_title || ' is funded and now active.'
  );

  insert into public.notifications (
    recipient_user_id, recipient_role, project_id, type, title, message
  )
  select
    pa.talent_id,
    'talent',
    p_project_id,
    'project_assignment',
    'You have a new project',
    'You have been assigned to ' || v_title || ' as ' || pa.role || '.'
  from public.project_assignments pa
  where pa.project_id = p_project_id and pa.status = 'assigned';

  insert into public.notifications (
    recipient_user_id, recipient_role, project_id, type, title, message,
    payload
  ) values (
    null,
    'admin',
    p_project_id,
    case when v_conflicts > 0 then 'staffing_exception' else 'project_funded' end,
    case when v_conflicts > 0 then 'Paid project needs staffing attention' else 'Project funded' end,
    v_title || ' has completed its deposit payment.',
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'invoice_number', p_invoice_number,
      'assigned_talent_ids', v_assigned,
      'staffing_conflicts', v_conflicts
    )
  );

  return query select p_project_id, v_status, v_assigned, true;
end;
$$;

revoke all on function public.activate_paid_project(
  uuid, text, text, text, timestamptz, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.activate_paid_project(
  uuid, text, text, text, timestamptz, text, text, jsonb
) to service_role;
