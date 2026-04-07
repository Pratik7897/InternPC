-- ========================================================
-- PCCOE Internship Portal — RLS Policy Fix
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ========================================================

-- -------------------------------------------------------
-- 1. INTERNSHIPS TABLE
--    Allow all authenticated users (students & admins) to READ internships
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated users to read internships" ON internships;
CREATE POLICY "Allow authenticated users to read internships"
  ON internships FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin to insert internships" ON internships;
CREATE POLICY "Allow admin to insert internships"
  ON internships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Allow admin to update internships" ON internships;
CREATE POLICY "Allow admin to update internships"
  ON internships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Allow admin to delete internships" ON internships;
CREATE POLICY "Allow admin to delete internships"
  ON internships FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- -------------------------------------------------------
-- 2. APPLICATIONS TABLE
--    Students can read/create their own applications
--    Admins can read all applications
-- -------------------------------------------------------
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
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- -------------------------------------------------------
-- 3. Make sure RLS is enabled on internships & applications
-- -------------------------------------------------------
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 4. Backfill: set is_active = true for any existing internships
--    where is_active is null (older entries)
-- -------------------------------------------------------
UPDATE internships SET is_active = true WHERE is_active IS NULL;
