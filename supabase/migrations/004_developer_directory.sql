-- Developer directory: lets authenticated clients see the pool of certified,
-- available developers without exposing the full talent_onboarding table (which
-- is row-level-secured to the owner + admins). We expose only approved talent
-- and only the public-facing fields, via a SECURITY DEFINER function.

create or replace function public.list_available_developers()
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
  order by t.years_experience desc nulls last;
$$;

-- Any signed-in user (clients included) can read the certified pool.
grant execute on function public.list_available_developers() to authenticated;
