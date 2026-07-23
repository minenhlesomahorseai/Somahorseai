-- Repair API grants for projects that already applied migration 013.
--
-- RLS policies decide which rows an authenticated user may read, but PostgREST
-- also requires table-level privileges before it can evaluate those policies.

grant usage on schema public to authenticated, service_role;

grant select on public.email_deliveries to authenticated;
grant select, insert, update, delete on public.email_deliveries to service_role;

grant select on public.interview_schedules to authenticated;
grant select on public.interview_proposals to authenticated;
grant select, insert, update, delete on public.interview_schedules to service_role;
grant select, insert, update, delete on public.interview_proposals to service_role;

grant execute on function public.create_interview_proposal(
  uuid, uuid, text, timestamptz, timestamptz, text, text
) to service_role;

grant execute on function public.respond_to_interview_proposal(
  uuid, uuid, boolean, text
) to service_role;
