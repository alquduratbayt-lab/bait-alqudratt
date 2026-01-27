-- إضافة RLS لجدول video_question_answers
-- نفذ هذا الكود في Supabase SQL Editor

-- تفعيل RLS
ALTER TABLE video_question_answers ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Allow all for video_question_answers" ON video_question_answers;

-- إنشاء سياسة تسمح بالكل (للتطبيق)
CREATE POLICY "Allow all for video_question_answers"
  ON video_question_answers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إضافة index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_video_question_answers_user ON video_question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_video_question_answers_lesson ON video_question_answers(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_question_answers_question ON video_question_answers(question_id);

-- تعليقات
COMMENT ON TABLE video_question_answers IS 'إجابات الطلاب على أسئلة الفيديو';
COMMENT ON COLUMN video_question_answers.variant_id IS 'معرف النسخة البديلة من السؤال إن وجدت';
