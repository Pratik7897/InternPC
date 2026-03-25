-- TABLE: profiles
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  email               TEXT UNIQUE,
  phone               TEXT,
  date_of_birth       DATE,
  gender              TEXT,
  profile_photo_url   TEXT,
  prn_number          TEXT UNIQUE,
  branch              TEXT,   -- CSE, IT, ENTC, Mech, Civil, AIDS, etc.
  current_year        TEXT,   -- FE, SE, TE, BE
  cgpa                NUMERIC(4,2),
  active_backlogs     INTEGER DEFAULT 0,
  percentage_12th     NUMERIC(5,2),
  percentage_10th     NUMERIC(5,2),
  technical_skills    TEXT[],
  soft_skills         TEXT[],
  languages_known     TEXT[],
  projects            JSONB,  -- [{title, description, tech_stack[], github_url, live_url}]
  previous_internships JSONB, -- [{company, role, duration, description, year}]
  resume_url          TEXT,
  intro_video_url     TEXT,
  certificates        JSONB,  -- [{name, issuer, url, uploaded_at}]
  linkedin_url        TEXT,
  github_url          TEXT,
  portfolio_url       TEXT,
  is_profile_public   BOOLEAN DEFAULT true,
  profile_completion  INTEGER DEFAULT 0,  -- 0-100 calculated field
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: internships
CREATE TABLE internships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  company_name    TEXT NOT NULL,
  company_logo_url TEXT,
  description     TEXT,
  requirements    TEXT[],
  skills_required TEXT[],
  stipend         TEXT,
  location        TEXT,
  work_mode       TEXT,  -- Remote / Onsite / Hybrid
  duration        TEXT,
  openings        INTEGER,
  deadline        DATE,
  apply_link      TEXT,  -- external link OR internal application
  posted_by       UUID REFERENCES profiles(id),
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: applications
CREATE TABLE applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  internship_id  UUID REFERENCES internships(id) ON DELETE CASCADE,
  status         TEXT DEFAULT 'applied', 
                 -- applied | shortlisted | interview | selected | rejected
  cover_note     TEXT,
  admin_notes    TEXT,
  applied_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

-- TABLE: admin_users
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: email_logs
CREATE TABLE email_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by          UUID REFERENCES admin_users(id),
  subject          TEXT,
  body             TEXT,
  recipient_filter JSONB,  -- {branch, year, min_cgpa} filters used
  recipient_count  INTEGER,
  status           TEXT,   -- sent | failed
  sent_at          TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: announcements
CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  body       TEXT,
  type       TEXT,  -- info | urgent | event
  posted_by  UUID REFERENCES admin_users(id),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- POLICIES: profiles
-- Admin users can do everything
CREATE POLICY "Admins full access on profiles" ON profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Students can read their own profile
CREATE POLICY "Students read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Students can update their own profile
CREATE POLICY "Students update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Students can insert their own profile
CREATE POLICY "Students insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Public can read profiles if is_profile_public is true
CREATE POLICY "Public read active profiles" ON profiles
  FOR SELECT USING (is_profile_public = true);


-- POLICIES: internships
CREATE POLICY "Admins full access on internships" ON internships
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Public read active internships" ON internships
  FOR SELECT USING (is_active = true);


-- POLICIES: applications
CREATE POLICY "Admins full access on applications" ON applications
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Students full access own applications" ON applications
  FOR ALL USING (auth.uid() = student_id);


-- POLICIES: admin_users (Only admins should be able to see themselves here)
CREATE POLICY "Admins access admin_users" ON admin_users
  FOR ALL USING (id = auth.uid());


-- POLICIES: email_logs
CREATE POLICY "Admins access email_logs" ON email_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));


-- POLICIES: announcements
CREATE POLICY "Admins full access on announcements" ON announcements
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Public read active announcements" ON announcements
  FOR SELECT USING (is_active = true);
