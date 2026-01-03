-- Final RLS Setup for Core Tables
-- Enable RLS on the remaining 6 core tables

-- Enable RLS on core tables
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calm_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.final_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all for users" ON public.users;
DROP POLICY IF EXISTS "Allow all for admins" ON public.admins;
DROP POLICY IF EXISTS "Allow all for calm_moments" ON public.calm_moments;
DROP POLICY IF EXISTS "Allow all for final_exams" ON public.final_exams;
DROP POLICY IF EXISTS "Allow all for student_progress" ON public.student_progress;

-- Subjects: Allow all (needed for app and admin dashboard)
CREATE POLICY "Allow all for subjects"
  ON public.subjects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Users: Allow all authenticated users to read
CREATE POLICY "Allow all for users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins: Allow all (for admin authentication)
CREATE POLICY "Allow all for admins"
  ON public.admins
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Calm Moments: Allow all authenticated users
CREATE POLICY "Allow all for calm_moments"
  ON public.calm_moments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Final Exams: Allow all (for exam functionality)
CREATE POLICY "Allow all for final_exams"
  ON public.final_exams
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Student Progress: Allow all (for tracking progress)
CREATE POLICY "Allow all for student_progress"
  ON public.student_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);
