-- إنشاء جدول تتبع تقدم الطلاب في الفيديوهات
-- نفذ هذا الكود في Supabase SQL Editor

-- حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS student_progress CASCADE;

CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  video_position INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  passed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- إنشاء indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson ON student_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_completed ON student_progress(completed);

-- تفعيل RLS
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow all for student_progress" ON student_progress;

-- إنشاء السياسات
CREATE POLICY "Allow all for student_progress"
  ON student_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إضافة تعليقات
COMMENT ON TABLE student_progress IS 'تتبع تقدم الطلاب في الدروس والفيديوهات';
COMMENT ON COLUMN student_progress.video_position IS 'موضع الفيديو بالثواني';
COMMENT ON COLUMN student_progress.completed IS 'هل أكمل الطالب الدرس';
