-- Onboarding + admin pipeline.
-- Adds: admin allow-list, an email column on profiles, client onboarding data,
-- and a gated talent application pipeline (review -> assessment -> interview -> approved).

-- ---------------------------------------------------------------------------
-- profiles: store email so the admin console can identify applicants.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text;

-- Recreate the signup trigger so new users also capture their email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, onboarding_status)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    'pending'
  );
  return new;
end;
$$;

-- Backfill email for any existing rows.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ---------------------------------------------------------------------------
-- admins: single source of truth for who can reach the admin console.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "Admins can view admins" on public.admins;
create policy "Admins can view admins"
  on public.admins
  for select
  using (public.is_admin());

-- Seed the initial admin. Add more emails here (or via INSERT) to grant access.
insert into public.admins (email)
values ('minenhle.somahorseai@gmail.com')
on conflict (email) do nothing;

-- Admins can read every profile (needed to display applicants).
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- client_onboarding: lightweight, selector-driven flow ending in a budget step.
-- ---------------------------------------------------------------------------
create table if not exists public.client_onboarding (
  id uuid primary key references auth.users (id) on delete cascade,
  current_step smallint not null default 0,
  company_name text,
  sector text,
  project_type text,
  problem text,
  timeline text,
  budget_range text,
  submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_onboarding enable row level security;

drop policy if exists "Users manage own client onboarding (select)" on public.client_onboarding;
create policy "Users manage own client onboarding (select)"
  on public.client_onboarding for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users manage own client onboarding (insert)" on public.client_onboarding;
create policy "Users manage own client onboarding (insert)"
  on public.client_onboarding for insert
  with check (auth.uid() = id);

drop policy if exists "Users manage own client onboarding (update)" on public.client_onboarding;
create policy "Users manage own client onboarding (update)"
  on public.client_onboarding for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Mark the profile complete once a client submits.
create or replace function public.sync_client_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.submitted then
    update public.profiles
      set onboarding_status = 'complete', updated_at = now()
      where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists client_onboarding_completion on public.client_onboarding;
create trigger client_onboarding_completion
  before insert or update on public.client_onboarding
  for each row execute function public.sync_client_completion();

-- ---------------------------------------------------------------------------
-- talent_onboarding: long, gated application pipeline.
-- stage flow: profile -> pending_review -> assessment -> assessment_review
--             -> interview -> interview_review -> approved (or rejected)
-- ---------------------------------------------------------------------------
create table if not exists public.talent_onboarding (
  id uuid primary key references auth.users (id) on delete cascade,
  current_step smallint not null default 0,
  stage text not null default 'profile'
    check (stage in (
      'profile', 'pending_review', 'assessment', 'assessment_review',
      'interview', 'interview_review', 'approved', 'rejected'
    )),
  headline text,
  primary_role text,
  years_experience smallint,
  skills text[] not null default '{}',
  bio text,
  portfolio_url text,
  github_url text,
  country text,
  agri_experience text,
  assessment jsonb,
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.talent_onboarding enable row level security;

drop policy if exists "Users manage own talent onboarding (select)" on public.talent_onboarding;
create policy "Users manage own talent onboarding (select)"
  on public.talent_onboarding for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users manage own talent onboarding (insert)" on public.talent_onboarding;
create policy "Users manage own talent onboarding (insert)"
  on public.talent_onboarding for insert
  with check (auth.uid() = id);

drop policy if exists "Users manage own talent onboarding (update)" on public.talent_onboarding;
create policy "Users manage own talent onboarding (update)"
  on public.talent_onboarding for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Guard stage transitions: applicants can only move themselves forward through
-- the self-service submit gates. Promotion gates are admin-only.
create or replace function public.guard_talent_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage and not public.is_admin() then
    if not (
      (old.stage = 'profile'    and new.stage = 'pending_review') or
      (old.stage = 'assessment' and new.stage = 'assessment_review') or
      (old.stage = 'interview'  and new.stage = 'interview_review')
    ) then
      raise exception 'Stage transition % -> % is not allowed', old.stage, new.stage;
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talent_onboarding_stage_guard on public.talent_onboarding;
create trigger talent_onboarding_stage_guard
  before update on public.talent_onboarding
  for each row execute function public.guard_talent_stage();

-- Keep profiles.onboarding_status in sync with the pipeline stage.
create or replace function public.sync_talent_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set onboarding_status = case when new.stage = 'approved' then 'complete' else 'pending' end,
        updated_at = now()
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists talent_onboarding_completion on public.talent_onboarding;
create trigger talent_onboarding_completion
  after insert or update of stage on public.talent_onboarding
  for each row execute function public.sync_talent_completion();
