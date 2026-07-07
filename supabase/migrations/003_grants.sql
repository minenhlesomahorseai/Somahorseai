-- Table privileges for the API roles.
--
-- Row Level Security only *restricts* access; it does not grant the base table
-- privileges PostgREST needs. Without these GRANTs the `authenticated` role gets
-- "permission denied for table ..." on every query, which made fetchProfile()
-- return null and sent users into an /onboarding <-> /login redirect loop.
--
-- RLS policies (defined in 001/002) still constrain *which rows* each role may
-- touch; these grants just allow the operations the policies gate.

grant usage on schema public to anon, authenticated, service_role;

-- profiles: users read/update their own row (admins read all via RLS). Inserts
-- happen through the security-definer signup trigger, so no INSERT grant needed.
grant select, update on public.profiles to authenticated;

-- onboarding tables: users create and edit their own row; admins read/update via RLS.
grant select, insert, update on public.client_onboarding to authenticated;
grant select, insert, update on public.talent_onboarding to authenticated;

-- admins allow-list: authenticated may read (RLS limits visibility to admins).
grant select on public.admins to authenticated;

-- service_role is used by trusted server-side code and bypasses RLS, but still
-- needs base privileges.
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.client_onboarding to service_role;
grant select, insert, update, delete on public.talent_onboarding to service_role;
grant select, insert, update, delete on public.admins to service_role;
