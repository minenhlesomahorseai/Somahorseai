-- =============================================================================
-- FIX: Talent users not showing on admin dashboard
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- Safe to re-run — all statements are idempotent.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1: Ensure the "Users can update own profile" policy exists
-- (may have been skipped when 001_profiles.sql failed)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 2: Ensure the signup trigger function and trigger exist
-- The trigger auto-creates a profiles row when a user signs up.
-- Without it, no profiles row → user can't onboard → nothing for admin to see.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, onboarding_status)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    'pending'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 3: Ensure your admin email is in the admins table
-- The RLS is_admin() function checks THIS table, not the env var.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.admins (email)
VALUES ('minenhle.somahorseai@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 4: Backfill profiles for any users who signed up while the trigger
-- was missing. Without a profiles row, they're stuck in limbo.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, email, role, onboarding_status)
SELECT
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'role', 'client'),
  'pending'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE! Verify by checking:
--   SELECT * FROM public.profiles;
--   SELECT * FROM public.talent_onboarding;
--   SELECT * FROM public.admins;
-- ─────────────────────────────────────────────────────────────────────────────
