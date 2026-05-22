-- =============================================================================
-- AudiTRACK — Migration 002
-- Fixes two issues:
--   1. RLS infinite recursion: is_auditor_or_admin() queries profiles, but
--      the profiles SELECT policy also calls is_auditor_or_admin() → deadlock.
--      Fix: use auth.jwt() to read the role claim instead of querying profiles.
--      This avoids any table query inside the RLS helper.
--   2. Rename contact_number → adamson_email on the requests table.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix RLS helper — read role from JWT metadata instead of querying profiles
-- ---------------------------------------------------------------------------

-- Drop the old recursive helper
DROP FUNCTION IF EXISTS is_auditor_or_admin();

-- New helper: reads role from the JWT app_metadata claim.
-- Supabase stores the profile role in app_metadata when you set it via the
-- service role key. For the anon/user key, we fall back to checking profiles
-- directly but using auth.uid() = id (no recursion) for the profiles table.
CREATE OR REPLACE FUNCTION is_auditor_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First try to read from JWT app_metadata (set by trigger or admin)
  user_role := auth.jwt() -> 'app_metadata' ->> 'role';

  IF user_role IN ('auditor', 'admin') THEN
    RETURN TRUE;
  END IF;

  -- Fallback: direct lookup without calling is_auditor_or_admin() again
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN user_role IN ('auditor', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 2. Fix profiles RLS — the SELECT policy must NOT call is_auditor_or_admin()
--    because that would recurse. Use a direct subquery instead.
-- ---------------------------------------------------------------------------

-- Drop the old recursive profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- New non-recursive policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (
      -- Direct role check without calling is_auditor_or_admin()
      EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.id = auth.uid()
          AND p2.role IN ('auditor', 'admin')
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to INSERT their own profile row
-- (needed if the trigger didn't fire for existing auth users)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3. Rename contact_number → adamson_email on requests table
-- ---------------------------------------------------------------------------

-- Safe rename — only runs if the column exists with the old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'contact_number'
  ) THEN
    ALTER TABLE requests RENAME COLUMN contact_number TO adamson_email;
  END IF;
END $$;

-- If adamson_email column doesn't exist yet (fresh install), add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'adamson_email'
  ) THEN
    ALTER TABLE requests ADD COLUMN adamson_email TEXT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Ensure existing auth users have a profile row
-- ---------------------------------------------------------------------------
-- If you created your Supabase auth user BEFORE running migration 001,
-- the trigger didn't fire and you have no profile row.
-- This upsert creates a profile row for every existing auth user that
-- doesn't already have one, defaulting role to 'auditor'.
INSERT INTO profiles (id, email, role)
SELECT
  au.id,
  au.email,
  'auditor'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;
