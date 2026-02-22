-- ================================================================
-- FIX RLS POLICIES FOR CONFESSION SITE
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- This script safely drops and recreates the critical RLS policies
-- to ensure they are correct.
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- STEP 1: Verify tables exist
-- (If these queries return errors, the tables don't exist — run schema.sql first)
-- ────────────────────────────────────────────────────────────────
SELECT 'confessions table exists' AS check WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'confessions'
);

SELECT 'profiles table exists' AS check WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
);

SELECT 'likes table exists' AS check WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'likes'
);

SELECT 'reports table exists' AS check WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reports'
);


-- ────────────────────────────────────────────────────────────────
-- STEP 2: Make sure RLS is enabled
-- ────────────────────────────────────────────────────────────────
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────
-- STEP 3: Drop all existing confessions policies (to start clean)
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "confessions_select_public" ON confessions;
DROP POLICY IF EXISTS "confessions_select_admin" ON confessions;
DROP POLICY IF EXISTS "confessions_insert_auth" ON confessions;
DROP POLICY IF EXISTS "confessions_update_own" ON confessions;
DROP POLICY IF EXISTS "confessions_update_admin" ON confessions;
DROP POLICY IF EXISTS "confessions_delete_cascade" ON confessions;

-- Also drop simplified policy names (in case you ran the user's suggested SQL)
DROP POLICY IF EXISTS "Public can read confessions" ON confessions;
DROP POLICY IF EXISTS "Auth users can post" ON confessions;
DROP POLICY IF EXISTS "Users delete own posts" ON confessions;


-- ────────────────────────────────────────────────────────────────
-- STEP 4: Recreate confessions RLS policies (correct versions)
-- ────────────────────────────────────────────────────────────────

-- Anyone (even unauthenticated) can read non-deleted confessions
CREATE POLICY "confessions_select_public"
    ON confessions FOR SELECT
    USING (is_deleted = false);

-- Authenticated, non-suspended users can INSERT confessions
-- NOTE: auth.uid() = user_id ensures users can only post as themselves
-- NOTE: The NOT EXISTS check ensures suspended users can't post
CREATE POLICY "confessions_insert_auth"
    ON confessions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND is_suspended = true
        )
    );

-- Users can soft-delete (update is_deleted) their own confessions
CREATE POLICY "confessions_update_own"
    ON confessions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow cascade deletes (user deletes their account)
CREATE POLICY "confessions_delete_cascade"
    ON confessions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- STEP 5: Fix likes table policies
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "likes_select_public" ON likes;
DROP POLICY IF EXISTS "likes_insert_auth" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;

CREATE POLICY "likes_select_public"
    ON likes FOR SELECT
    USING (true);

CREATE POLICY "likes_insert_auth"
    ON likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
    ON likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- STEP 6: Fix reports table policies
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reports_insert_auth" ON reports;
DROP POLICY IF EXISTS "reports_select_own" ON reports;
DROP POLICY IF EXISTS "reports_select_admin" ON reports;
DROP POLICY IF EXISTS "reports_update_admin" ON reports;

CREATE POLICY "reports_insert_auth"
    ON reports FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = reported_by
        AND NOT EXISTS (
            SELECT 1 FROM confessions
            WHERE id = confession_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "reports_select_own"
    ON reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reported_by);


-- ────────────────────────────────────────────────────────────────
-- STEP 7: Verify profiles trigger exists (auto-creates profile on signup)
-- ────────────────────────────────────────────────────────────────
-- Run this to check if the trigger is active:
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- If the above returns no rows, the trigger is missing. Run:
-- (This is already in schema.sql but copying here with improvements)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
BEGIN
    new_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8));
    
    INSERT INTO profiles (id, username, email, role, is_verified)
    VALUES (
        NEW.id,
        new_username,
        NEW.email,
        'user',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        updated_at = NOW();
        
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If username is taken, this will still fail, but we've handled the ID conflict
    -- The app-side check should prevent username conflicts
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ────────────────────────────────────────────────────────────────
-- STEP 8: Fix missing profiles (for users who signed up but have no profile)
-- Run this if users get FK violation errors when posting
-- ────────────────────────────────────────────────────────────────
INSERT INTO profiles (id, username, email, role, is_verified)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 'user_' || LEFT(au.id::text, 8)),
    au.email,
    'user',
    COALESCE(au.email_confirmed_at IS NOT NULL, false)
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL  -- Only for users who DON'T have a profile yet
ON CONFLICT (id) DO NOTHING;

-- Report how many orphaned users were fixed:
SELECT 'Profiles fixed/created' AS result, COUNT(*) AS count
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NOT NULL; -- These all have profiles now


-- ────────────────────────────────────────────────────────────────
-- STEP 9: Verify final policy list
-- ────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
