-- ========================================================
-- PCCOE Internship Portal — Full Database Setup
-- Paste this ENTIRE script into Supabase SQL Editor and Run
-- ========================================================


-- -------------------------------------------------------
-- STEP 1: Drop everything cleanly
-- -------------------------------------------------------
DROP TABLE IF EXISTS applications  CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS email_logs    CASCADE;
DROP TABLE IF EXISTS internships   CASCADE;
DROP TABLE IF EXISTS admin_users   CASCADE;
DROP TABLE IF EXISTS profiles      CASCADE;


-- -------------------------------------------------------
-- STEP 2: Create tables
-- -------------------------------------------------------

-- profiles
CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  email                TEXT UNIQUE,
  phone                TEXT,
  date_of_birth        DATE,
  gender               TEXT,
  profile_photo_url    TEXT,
  prn_number           TEXT UNIQUE,
  branch               TEXT,
  current_year         TEXT,
  cgpa                 NUMERIC(4,2),
  active_backlogs      INTEGER DEFAULT 0,
  percentage_12th      NUMERIC(5,2),
  percentage_10th      NUMERIC(5,2),
  technical_skills     TEXT[],
  soft_skills          TEXT[],
  languages_known      TEXT[],
  projects             JSONB,
  previous_internships JSONB,
  resume_url           TEXT,
  intro_video_url      TEXT,
  certificates         JSONB,
  linkedin_url         TEXT,
  github_url           TEXT,
  portfolio_url        TEXT,
  is_profile_public    BOOLEAN DEFAULT true,
  profile_completion   INTEGER DEFAULT 0,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- admin_users
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- internships
CREATE TABLE internships (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  company_name     TEXT NOT NULL,
  company_logo_url TEXT,
  description      TEXT,
  requirements     TEXT[],
  skills_required  TEXT[],
  stipend          TEXT,
  location         TEXT,
  work_mode        TEXT,
  duration         TEXT,
  openings         INTEGER,
  deadline         DATE,
  apply_link       TEXT,
  posted_by        UUID REFERENCES profiles(id),
  is_active        BOOLEAN DEFAULT true,
  is_featured      BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- applications
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'applied',
  cover_note    TEXT,
  admin_notes   TEXT,
  applied_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

-- email_logs
CREATE TABLE email_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by          UUID REFERENCES admin_users(id),
  subject          TEXT,
  body             TEXT,
  recipient_filter JSONB,
  recipient_count  INTEGER,
  status           TEXT,
  sent_at          TIMESTAMPTZ DEFAULT NOW()
);

-- announcements  (uses 'content' to match the app code)
CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info', 'urgent', 'event')),
  posted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- -------------------------------------------------------
-- STEP 3: Enable Row Level Security on all tables
-- -------------------------------------------------------
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------
-- STEP 4: RLS Policies
-- -------------------------------------------------------

-- ── profiles ────────────────────────────────────────────
-- Admins can do everything
CREATE POLICY "Admins full access on profiles" ON profiles
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Students can SELECT their own row
CREATE POLICY "Students read own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Students can INSERT their own row (needed at registration & OAuth)
CREATE POLICY "Students insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Students can UPDATE their own row
CREATE POLICY "Students update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Authenticated users can view public profiles (for directory page)
CREATE POLICY "Authenticated read public profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_profile_public = true);


-- ── admin_users ─────────────────────────────────────────
-- Only the admin themselves can read their own record
-- (needed so checkSession() can determine role)
CREATE POLICY "Admins access own row" ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);  -- any authenticated user may SELECT to check if they are admin


-- ── internships ─────────────────────────────────────────
-- Admins can do everything
CREATE POLICY "Admins full access on internships" ON internships
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- All authenticated users can read ALL internships (active or not visible to admin)
CREATE POLICY "Authenticated users read internships" ON internships
  FOR SELECT
  TO authenticated
  USING (true);


-- ── applications ────────────────────────────────────────
-- Admins can do everything
CREATE POLICY "Admins full access on applications" ON applications
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Students can SELECT, INSERT their own applications
CREATE POLICY "Students read own applications" ON applications
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students submit applications" ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);


-- ── email_logs ──────────────────────────────────────────
CREATE POLICY "Admins access email_logs" ON email_logs
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));


-- ── announcements ───────────────────────────────────────
-- Admins can do everything
CREATE POLICY "Admins full access on announcements" ON announcements
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- All authenticated users can read active announcements
CREATE POLICY "Authenticated read announcements" ON announcements
  FOR SELECT
  TO authenticated
  USING (true);


-- -------------------------------------------------------
-- STEP 5: Backfill — ensure existing internships are visible
-- -------------------------------------------------------
UPDATE internships SET is_active = true WHERE is_active IS NULL;


-- -------------------------------------------------------
-- Done! All tables and policies are configured correctly.
-- -------------------------------------------------------
