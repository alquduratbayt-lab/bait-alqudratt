-- إنشاء جدول بنك الأسئلة (Question Variants)
-- ملاحظة: يجب أن يكون جدول questions موجوداً مسبقاً
CREATE TABLE IF NOT EXISTS question_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_question_id UUID NOT NULL,
  variant_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  question_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة foreign key بعد التأكد من وجود الجدول
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
    ALTER TABLE question_variants 
    ADD CONSTRAINT fk_parent_question 
    FOREIGN KEY (parent_question_id) 
    REFERENCES questions(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- إنشاء جدول تتبع الأسئلة المعروضة للطلاب
CREATE TABLE IF NOT EXISTS student_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  question_id UUID NOT NULL,
  variant_id UUID,
  answered_correctly BOOLEAN,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة foreign keys بعد التأكد من وجود الجداول
DO $$ 
BEGIN
  -- Foreign key للطالب
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_student 
    FOREIGN KEY (student_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;

  -- Foreign key للدرس
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_lesson 
    FOREIGN KEY (lesson_id) 
    REFERENCES lessons(id) 
    ON DELETE CASCADE;
  END IF;

  -- Foreign key للسؤال
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_question 
    FOREIGN KEY (question_id) 
    REFERENCES questions(id) 
    ON DELETE CASCADE;
  END IF;

  -- Foreign key للنموذج
  ALTER TABLE student_question_history 
  ADD CONSTRAINT fk_variant 
  FOREIGN KEY (variant_id) 
  REFERENCES question_variants(id) 
  ON DELETE SET NULL;
END $$;

-- إنشاء indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_question_variants_parent ON question_variants(parent_question_id);
CREATE INDEX IF NOT EXISTS idx_question_variants_active ON question_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_student_history_student ON student_question_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_history_lesson ON student_question_history(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_history_question ON student_question_history(question_id);
CREATE INDEX IF NOT EXISTS idx_student_history_variant ON student_question_history(variant_id);

-- تفعيل RLS
ALTER TABLE question_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_question_history ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Admins can manage question variants" ON question_variants;
DROP POLICY IF EXISTS "Students can view active variants" ON question_variants;
DROP POLICY IF EXISTS "Students can view their own history" ON student_question_history;
DROP POLICY IF EXISTS "Students can insert their own history" ON student_question_history;
DROP POLICY IF EXISTS "Admins can view all history" ON student_question_history;

-- سياسات الأمان لـ question_variants
-- السماح للجميع بالقراءة والكتابة مؤقتاً (سنضبطها لاحقاً)
CREATE POLICY "Allow all for question variants"
  ON question_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- سياسات الأمان لـ student_question_history
-- السماح للجميع بالقراءة والكتابة مؤقتاً (سنضبطها لاحقاً)
CREATE POLICY "Allow all for student history"
  ON student_question_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إضافة تعليقات للتوثيق
COMMENT ON TABLE question_variants IS 'بنك الأسئلة - نماذج بديلة للأسئلة لعرضها عشوائياً للطلاب';
COMMENT ON TABLE student_question_history IS 'سجل الأسئلة التي شاهدها كل طالب لتجنب التكرار';
COMMENT ON COLUMN question_variants.parent_question_id IS 'السؤال الأساسي الذي ينتمي إليه هذا النموذج';
COMMENT ON COLUMN question_variants.is_active IS 'هل النموذج نشط ويمكن عرضه للطلاب';
COMMENT ON COLUMN student_question_history.variant_id IS 'أي نموذج من البنك تم عرضه (null = السؤال الأساسي)';
