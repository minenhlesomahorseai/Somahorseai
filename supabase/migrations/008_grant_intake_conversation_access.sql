-- Repair migration for projects that applied 007 before its table grants were
-- included. Without these grants Postgres stops at "permission denied" before
-- evaluating the row-level security policies.

grant select, insert, update on public.intake_conversations to authenticated;
grant select, insert on public.intake_messages to authenticated;
