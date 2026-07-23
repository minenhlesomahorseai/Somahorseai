-- Durable transactional email delivery and two-sided interview scheduling.
--
-- Email delivery is intentionally stored before the provider is called. This
-- gives every workflow event a stable dedupe key, a retry trail, and an admin
-- audit surface instead of silently losing "best effort" messages.

-- ---------------------------------------------------------------------------
-- email_deliveries
-- ---------------------------------------------------------------------------
create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  category text not null,
  recipient_user_id uuid references auth.users (id) on delete set null,
  recipient_email text not null,
  subject text not null,
  html_body text not null,
  text_body text not null,
  attachments jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  provider_message_id text,
  provider_status text,
  attempt_count integer not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_deliveries_retry_idx
  on public.email_deliveries (status, next_attempt_at);

create index if not exists email_deliveries_recipient_idx
  on public.email_deliveries (recipient_user_id, created_at desc);

alter table public.email_deliveries enable row level security;

grant select on public.email_deliveries to authenticated;
grant select, insert, update, delete on public.email_deliveries to service_role;

drop policy if exists "Admins can view email delivery" on public.email_deliveries;
create policy "Admins can view email delivery"
  on public.email_deliveries for select
  using (public.is_admin());

-- Provider writes and retry claims use the service role after the calling
-- Server Action/Route Handler has authenticated the user.

-- ---------------------------------------------------------------------------
-- interview_schedules and proposals
-- ---------------------------------------------------------------------------
create table if not exists public.interview_schedules (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'awaiting_availability'
    check (status in (
      'awaiting_availability', 'negotiating', 'confirmed', 'completed', 'cancelled'
    )),
  timezone text not null default 'Africa/Johannesburg',
  meeting_url text,
  confirmed_proposal_id uuid,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_proposals (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.interview_schedules (id) on delete cascade,
  proposed_by uuid not null references auth.users (id) on delete cascade,
  proposer_role text not null check (proposer_role in ('admin', 'talent')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'superseded')),
  note text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at <= starts_at + interval '2 hours'),
  check (starts_at >= created_at - interval '5 minutes'),
  check (starts_at <= created_at + interval '7 days')
);

alter table public.interview_schedules
  drop constraint if exists interview_schedules_confirmed_proposal_id_fkey;

alter table public.interview_schedules
  add constraint interview_schedules_confirmed_proposal_id_fkey
  foreign key (confirmed_proposal_id)
  references public.interview_proposals (id)
  on delete set null;

create index if not exists interview_proposals_schedule_idx
  on public.interview_proposals (schedule_id, created_at desc);

create unique index if not exists interview_proposals_one_pending_idx
  on public.interview_proposals (schedule_id)
  where status = 'pending';

alter table public.interview_schedules enable row level security;
alter table public.interview_proposals enable row level security;

grant select on public.interview_schedules to authenticated;
grant select on public.interview_proposals to authenticated;
grant select, insert, update, delete on public.interview_schedules to service_role;
grant select, insert, update, delete on public.interview_proposals to service_role;

drop policy if exists "Interview schedule readable by participants" on public.interview_schedules;
create policy "Interview schedule readable by participants"
  on public.interview_schedules for select
  using (auth.uid() = talent_id or public.is_admin());

drop policy if exists "Interview proposals readable by participants" on public.interview_proposals;
create policy "Interview proposals readable by participants"
  on public.interview_proposals for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.interview_schedules schedule
      where schedule.id = schedule_id
        and schedule.talent_id = auth.uid()
    )
  );

create or replace function public.touch_workflow_record()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists email_deliveries_touch on public.email_deliveries;
create trigger email_deliveries_touch
  before update on public.email_deliveries
  for each row execute function public.touch_workflow_record();

drop trigger if exists interview_schedules_touch on public.interview_schedules;
create trigger interview_schedules_touch
  before update on public.interview_schedules
  for each row execute function public.touch_workflow_record();

drop trigger if exists interview_proposals_touch on public.interview_proposals;
create trigger interview_proposals_touch
  before update on public.interview_proposals
  for each row execute function public.touch_workflow_record();

-- Atomic helpers used by authenticated server actions. Keeping proposal
-- replacement and acceptance in one database transaction prevents two pending
-- times or a half-confirmed interview when requests race.
create or replace function public.create_interview_proposal(
  p_talent_id uuid,
  p_proposed_by uuid,
  p_proposer_role text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_note text default null,
  p_meeting_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule_id uuid;
  v_proposal_id uuid;
begin
  if p_proposer_role not in ('admin', 'talent') then
    raise exception 'Invalid proposer role';
  end if;
  if p_ends_at <= p_starts_at or p_ends_at > p_starts_at + interval '2 hours' then
    raise exception 'Interview duration must be between 1 minute and 2 hours';
  end if;
  if p_starts_at < now() - interval '5 minutes'
     or p_starts_at > now() + interval '7 days' then
    raise exception 'Interview time must be within the next 7 days';
  end if;

  insert into public.interview_schedules (talent_id, status, meeting_url)
  values (p_talent_id, 'negotiating', nullif(trim(p_meeting_url), ''))
  on conflict (talent_id) do update
    set status = 'negotiating',
        meeting_url = coalesce(nullif(trim(p_meeting_url), ''), interview_schedules.meeting_url)
  returning id into v_schedule_id;

  update public.interview_proposals
  set status = 'superseded', responded_at = now()
  where schedule_id = v_schedule_id and status = 'pending';

  insert into public.interview_proposals (
    schedule_id, proposed_by, proposer_role, starts_at, ends_at, note
  )
  values (
    v_schedule_id, p_proposed_by, p_proposer_role, p_starts_at, p_ends_at, nullif(trim(p_note), '')
  )
  returning id into v_proposal_id;

  return v_proposal_id;
end;
$$;

create or replace function public.respond_to_interview_proposal(
  p_talent_id uuid,
  p_proposal_id uuid,
  p_accept boolean,
  p_meeting_url text default null
)
returns table (
  schedule_id uuid,
  proposal_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  response_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule public.interview_schedules%rowtype;
  v_proposal public.interview_proposals%rowtype;
begin
  select schedule.*
    into v_schedule
  from public.interview_schedules schedule
  where schedule.talent_id = p_talent_id
  for update;

  if not found then
    raise exception 'Interview schedule not found';
  end if;

  select proposal.*
    into v_proposal
  from public.interview_proposals proposal
  where proposal.id = p_proposal_id
    and proposal.schedule_id = v_schedule.id
    and proposal.status = 'pending'
  for update;

  if not found then
    raise exception 'This interview proposal is no longer pending';
  end if;

  if p_accept then
    update public.interview_proposals
      set status = 'accepted', responded_at = now()
      where id = v_proposal.id;

    update public.interview_schedules
      set status = 'confirmed',
          confirmed_proposal_id = v_proposal.id,
          confirmed_at = now(),
          meeting_url = coalesce(nullif(trim(p_meeting_url), ''), meeting_url)
      where id = v_schedule.id;

    update public.talent_onboarding
      set stage = 'interview_review'
      where id = p_talent_id and stage = 'interview';
  else
    update public.interview_proposals
      set status = 'rejected', responded_at = now()
      where id = v_proposal.id;

    update public.interview_schedules
      set status = 'negotiating'
      where id = v_schedule.id;
  end if;

  return query
    select
      v_schedule.id,
      v_proposal.id,
      v_proposal.starts_at,
      v_proposal.ends_at,
      case when p_accept then 'accepted' else 'rejected' end;
end;
$$;

revoke all on function public.create_interview_proposal(
  uuid, uuid, text, timestamptz, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.create_interview_proposal(
  uuid, uuid, text, timestamptz, timestamptz, text, text
) to service_role;

revoke all on function public.respond_to_interview_proposal(
  uuid, uuid, boolean, text
) from public, anon, authenticated;
grant execute on function public.respond_to_interview_proposal(
  uuid, uuid, boolean, text
) to service_role;
