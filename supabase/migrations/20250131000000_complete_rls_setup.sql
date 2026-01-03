-- Complete RLS Setup for Remaining Tables
-- This migration adds RLS and policies for tables that don't have them yet

-- Enable RLS on remaining tables
ALTER TABLE IF EXISTS public.parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow all for parent_notifications" ON public.parent_notifications;
DROP POLICY IF EXISTS "Allow all for exam_questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Allow all for questions" ON public.questions;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Allow all for question_variants" ON public.question_variants;

-- Parent Notifications: Allow all (for admin dashboard)
CREATE POLICY "Allow all for parent_notifications"
  ON public.parent_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Exam Questions: Allow all (for admin dashboard and app)
CREATE POLICY "Allow all for exam_questions"
  ON public.exam_questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Questions: Allow all (for lessons and exams)
CREATE POLICY "Allow all for questions"
  ON public.questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- User Notifications: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- User Notifications: Allow insert for all authenticated users
CREATE POLICY "Allow insert notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK (true);

-- Question Variants: Allow all (for interactive questions)
CREATE POLICY "Allow all for question_variants"
  ON public.question_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);
