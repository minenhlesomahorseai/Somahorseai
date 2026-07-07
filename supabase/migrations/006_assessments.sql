-- AI assessment pipeline + transactional email dedupe flags.
--
-- Adds:
--   * welcome_email_sent flags on the onboarding tables (so the welcome email
--     fires exactly once, from the onboarding page on first visit).
--   * talent_assessments: one AI-generated, uniquely-linked assessment per
--     invitation, with answers, anti-cheat counters, and AI grading output.
--
-- Security model: assessment WRITES go through server actions that use the
-- service-role key (after verifying the caller owns the row). RLS therefore
-- only needs to grant SELECT to the owning talent and to admins; all
-- inserts/updates are performed by admins or the service role. This makes the
-- AI score un-spoofable by the candidate.

-- ---------------------------------------------------------------------------
-- Welcome-email dedupe flags
-- ---------------------------------------------------------------------------
alter table public.client_onboarding
  add column if not exists welcome_email_sent boolean not null default false;

alter table public.talent_onboarding
  add column if not exists welcome_email_sent boolean not null default false;

-- ---------------------------------------------------------------------------
-- talent_assessments
-- ---------------------------------------------------------------------------
create table if not exists public.talent_assessments (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  status text not null default 'ready'
    check (status in ('ready', 'in_progress', 'submitted', 'graded', 'disqualified', 'error')),
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  time_limit_seconds integer not null default 1200,
  score integer,
  max_score integer,
  evaluation jsonb,
  overall_feedback text,
  recommendation text,
  paste_flags integer not null default 0,
  tab_violations integer not null default 0,
  disqualified_reason text,
  generation_error text,
  started_at timestamptz,
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talent_assessments_talent_id_idx
  on public.talent_assessments (talent_id);

alter table public.talent_assessments enable row level security;

-- Owning talent and admins can read. Writes are done by admins / service role.
drop policy if exists "Assessment readable by owner or admin" on public.talent_assessments;
create policy "Assessment readable by owner or admin"
  on public.talent_assessments for select
  using (auth.uid() = talent_id or public.is_admin());

drop policy if exists "Assessment writable by admin" on public.talent_assessments;
create policy "Assessment writable by admin"
  on public.talent_assessments for all
  using (public.is_admin())
  with check (public.is_admin());

-- keep updated_at fresh
create or replace function public.touch_assessment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talent_assessments_touch on public.talent_assessments;
create trigger talent_assessments_touch
  before update on public.talent_assessments
  for each row execute function public.touch_assessment_updated_at();
