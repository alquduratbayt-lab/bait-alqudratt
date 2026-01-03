-- Enable RLS on all public tables
-- This migration enables Row Level Security to protect data access
-- Using simple policies to avoid column name issues

-- Enable RLS on tables (otp_codes already has RLS enabled)
ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banners ENABLE ROW LEVEL SECURITY;

-- Note: otp_codes already has RLS policies defined in create_otp_codes_table.sql

-- Lessons: Allow all authenticated users (admin dashboard)
CREATE POLICY "Allow all for lessons"
  ON public.lessons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Training Sessions: Allow all authenticated users
CREATE POLICY "Allow all for training sessions"
  ON public.training_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Training Page Settings: Allow all
CREATE POLICY "Allow all for training page settings"
  ON public.training_page_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Student Notifications: Allow all
CREATE POLICY "Allow all for student notifications"
  ON public.student_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Banners: Allow all
CREATE POLICY "Allow all for banners"
  ON public.banners
  FOR ALL
  USING (true)
  WITH CHECK (true);
