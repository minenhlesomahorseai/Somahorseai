-- Allow trusted server-side admin actions to pass the talent stage guard.
--
-- Admin server actions validate the caller with the authenticated client and
-- then perform the update with the service-role client. A service-role JWT
-- does not contain an admin email, so public.is_admin() is false inside the
-- trigger even though the write is trusted and intentionally bypasses RLS.
create or replace function public.guard_talent_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage
     and not (
       public.is_admin()
       or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     ) then
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
