-- ============================================
-- نظام بنك الأسئلة (Question Bank System)
-- ============================================
-- قم بنسخ هذا الكود وتشغيله في Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 0. حذف الجداول القديمة إذا كانت موجودة (لإعادة الإنشاء بشكل صحيح)
DROP TABLE IF EXISTS student_question_history CASCADE;
DROP TABLE IF EXISTS question_variants CASCADE;

-- 1. إنشاء جدول بنك الأسئلة
CREATE TABLE question_variants (
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

-- 2. إنشاء جدول تتبع الأسئلة
CREATE TABLE student_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  question_id UUID NOT NULL,
  variant_id UUID,
  answered_correctly BOOLEAN,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إضافة Foreign Keys (إذا لم تكن موجودة)
DO $$ 
BEGIN
  -- إضافة FK لـ question_variants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_parent_question' 
    AND table_name = 'question_variants'
  ) THEN
    ALTER TABLE question_variants 
    ADD CONSTRAINT fk_parent_question 
    FOREIGN KEY (parent_question_id) 
    REFERENCES questions(id) 
    ON DELETE CASCADE;
  END IF;

  -- إضافة FK للطالب
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_student' 
    AND table_name = 'student_question_history'
  ) THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_student 
    FOREIGN KEY (student_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;

  -- إضافة FK للدرس
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_lesson' 
    AND table_name = 'student_question_history'
  ) THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_lesson 
    FOREIGN KEY (lesson_id) 
    REFERENCES lessons(id) 
    ON DELETE CASCADE;
  END IF;

  -- إضافة FK للسؤال
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_question' 
    AND table_name = 'student_question_history'
  ) THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_question 
    FOREIGN KEY (question_id) 
    REFERENCES questions(id) 
    ON DELETE CASCADE;
  END IF;

  -- إضافة FK للنموذج
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_variant' 
    AND table_name = 'student_question_history'
  ) THEN
    ALTER TABLE student_question_history 
    ADD CONSTRAINT fk_variant 
    FOREIGN KEY (variant_id) 
    REFERENCES question_variants(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- 4. إنشاء Indexes
CREATE INDEX IF NOT EXISTS idx_question_variants_parent ON question_variants(parent_question_id);
CREATE INDEX IF NOT EXISTS idx_question_variants_active ON question_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_student_history_student ON student_question_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_history_lesson ON student_question_history(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_history_question ON student_question_history(question_id);
CREATE INDEX IF NOT EXISTS idx_student_history_variant ON student_question_history(variant_id);

-- 5. تفعيل RLS
ALTER TABLE question_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_question_history ENABLE ROW LEVEL SECURITY;

-- 6. حذف السياسات القديمة
DROP POLICY IF EXISTS "Allow all for question variants" ON question_variants;
DROP POLICY IF EXISTS "Allow all for student history" ON student_question_history;

-- 7. إنشاء السياسات الجديدة
-- السماح للجميع بالوصول الكامل (مؤقتاً للتطوير)
CREATE POLICY "Allow all for question variants"
  ON question_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for student history"
  ON student_question_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. إضافة التعليقات
COMMENT ON TABLE question_variants IS 'بنك الأسئلة - نماذج بديلة للأسئلة';
COMMENT ON TABLE student_question_history IS 'سجل الأسئلة المعروضة للطلاب';

-- ✅ تم! الآن يمكنك استخدام نظام بنك الأسئلة
