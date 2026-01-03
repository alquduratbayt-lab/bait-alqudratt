-- إنشاء جدول بنك الأسئلة (Question Variants)
CREATE TABLE IF NOT EXISTS question_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
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

-- إنشاء جدول تتبع الأسئلة المعروضة للطلاب
CREATE TABLE IF NOT EXISTS student_question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES question_variants(id) ON DELETE SET NULL,
  answered_correctly BOOLEAN,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes لتحسين الأداء
CREATE INDEX idx_question_variants_parent ON question_variants(parent_question_id);
CREATE INDEX idx_question_variants_active ON question_variants(is_active);
CREATE INDEX idx_student_history_student ON student_question_history(student_id);
CREATE INDEX idx_student_history_lesson ON student_question_history(lesson_id);
CREATE INDEX idx_student_history_question ON student_question_history(question_id);

-- تفعيل RLS
ALTER TABLE question_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_question_history ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لـ question_variants
-- المدراء يمكنهم القراءة والكتابة
CREATE POLICY "Admins can manage question variants"
  ON question_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- الطلاب يمكنهم القراءة فقط للنماذج النشطة
CREATE POLICY "Students can view active variants"
  ON question_variants
  FOR SELECT
  USING (is_active = true);

-- سياسات الأمان لـ student_question_history
-- الطلاب يمكنهم قراءة سجلهم الخاص فقط
CREATE POLICY "Students can view their own history"
  ON student_question_history
  FOR SELECT
  USING (auth.uid() = student_id);

-- الطلاب يمكنهم إضافة سجلات جديدة لأنفسهم
CREATE POLICY "Students can insert their own history"
  ON student_question_history
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- المدراء يمكنهم قراءة كل السجلات
CREATE POLICY "Admins can view all history"
  ON student_question_history
  FOR SELECT
  USING (true);

-- إضافة تعليقات للتوثيق
COMMENT ON TABLE question_variants IS 'بنك الأسئلة - نماذج بديلة للأسئلة لعرضها عشوائياً للطلاب';
COMMENT ON TABLE student_question_history IS 'سجل الأسئلة التي شاهدها كل طالب لتجنب التكرار';
COMMENT ON COLUMN question_variants.parent_question_id IS 'السؤال الأساسي الذي ينتمي إليه هذا النموذج';
COMMENT ON COLUMN question_variants.is_active IS 'هل النموذج نشط ويمكن عرضه للطلاب';
COMMENT ON COLUMN student_question_history.variant_id IS 'أي نموذج من البنك تم عرضه (null = السؤال الأساسي)';
