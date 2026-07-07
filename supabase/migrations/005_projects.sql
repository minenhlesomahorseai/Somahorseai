-- Client projects: persists projects created through the Intake & Scoping flow.
-- A project starts in 'scoping', moves to 'matching' once a team is assembled,
-- then through 'in_build' / 'monitoring' / 'delivered' as the platform runs it.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  summary text,
  status text not null default 'scoping'
    check (status in ('scoping', 'matching', 'in_build', 'monitoring', 'delivered')),
  sector text,
  budget_range text,
  timeline text,
  scope text,
  matched_team text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);

alter table public.projects enable row level security;

drop policy if exists "Clients manage own projects (select)" on public.projects;
create policy "Clients manage own projects (select)"
  on public.projects for select
  using (auth.uid() = client_id or public.is_admin());

drop policy if exists "Clients manage own projects (insert)" on public.projects;
create policy "Clients manage own projects (insert)"
  on public.projects for insert
  with check (auth.uid() = client_id);

drop policy if exists "Clients manage own projects (update)" on public.projects;
create policy "Clients manage own projects (update)"
  on public.projects for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

create or replace function public.touch_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_projects_updated_at();
