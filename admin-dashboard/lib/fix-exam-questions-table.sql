-- إصلاح جدول exam_questions
-- حذف الجدول القديم وإعادة إنشائه

DROP TABLE IF EXISTS exam_questions CASCADE;

-- إنشاء جدول أسئلة الامتحان النهائي
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء index للأداء
CREATE INDEX idx_exam_questions_lesson_id ON exam_questions(lesson_id);

-- عرض بنية الجدول للتأكد
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exam_questions'
ORDER BY ordinal_position;
