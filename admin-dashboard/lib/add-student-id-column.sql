-- إضافة عمود student_id كـ alias لـ user_id في جدول student_progress
-- هذا يسمح باستخدام كلا الاسمين

-- الخيار 1: إضافة عمود جديد student_id ونسخ البيانات
ALTER TABLE student_progress 
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- نسخ البيانات من user_id إلى student_id
UPDATE student_progress 
SET student_id = user_id 
WHERE student_id IS NULL;

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id 
ON student_progress(student_id);

-- الخيار 2 (اختياري): إنشاء view يستخدم student_id
CREATE OR REPLACE VIEW student_progress_view AS
SELECT 
  id,
  user_id as student_id,
  lesson_id,
  exam_score,
  total_questions,
  passed,
  completed_at,
  completed,
  last_watched_at,
  video_position,
  updated_at
FROM student_progress;
