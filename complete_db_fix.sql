-- ========================================================
-- PCCOE Internship Portal — COMPLETE Database Fix
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard → Your Project → SQL Editor
-- ========================================================


-- -------------------------------------------------------
-- 1. PROFILES TABLE — RLS Policies
--    (This is what caused profile data to NOT save on refresh)
-- -------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));


-- -------------------------------------------------------
-- 2. INTERNSHIPS TABLE — RLS Policies
-- -------------------------------------------------------
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read internships" ON internships;
CREATE POLICY "Allow authenticated users to read internships"
  ON internships FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin to insert internships" ON internships;
CREATE POLICY "Allow admin to insert internships"
  ON internships FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow admin to update internships" ON internships;
CREATE POLICY "Allow admin to update internships"
  ON internships FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Allow admin to delete internships" ON internships;
CREATE POLICY "Allow admin to delete internships"
  ON internships FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Backfill: set is_active = true for any existing internships where is_active is null
UPDATE internships SET is_active = true WHERE is_active IS NULL;


-- -------------------------------------------------------
-- 3. APPLICATIONS TABLE — RLS Policies
-- -------------------------------------------------------
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read own applications" ON applications;
CREATE POLICY "Students can read own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can create applications" ON applications;
CREATE POLICY "Students can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update applications" ON applications;
CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));


-- -------------------------------------------------------
-- 4. ANNOUNCEMENTS TABLE — Create if not exists + RLS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  content    text NOT NULL,
  type       text DEFAULT 'info' CHECK (type IN ('info', 'urgent', 'event')),
  posted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read announcements" ON announcements;
CREATE POLICY "All authenticated users can read announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;
CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));


-- -------------------------------------------------------
-- 5. STORAGE BUCKETS — Make sure 'documents' bucket exists
--    and has correct policies for uploads
-- -------------------------------------------------------
-- Run these manually if uploads are failing:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;


-- -------------------------------------------------------
-- Done! Your portal database is now correctly configured.
-- -------------------------------------------------------
