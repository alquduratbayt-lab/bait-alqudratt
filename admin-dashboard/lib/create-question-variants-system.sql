-- حذف الجداول القديمة إذا كانت موجودة
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS final_exams CASCADE;
DROP TABLE IF EXISTS question_variants CASCADE;

-- جدول النسخ البديلة للأسئلة
CREATE TABLE question_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  variant_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الامتحانات النهائية
CREATE TABLE final_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول أسئلة الامتحان النهائي
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES final_exams(id) ON DELETE CASCADE,
  question_variant_id UUID REFERENCES question_variants(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إضافة indexes للأداء
CREATE INDEX idx_question_variants_original ON question_variants(original_question_id);
CREATE INDEX idx_question_variants_active ON question_variants(is_active);
CREATE INDEX idx_final_exams_lesson ON final_exams(lesson_id);
CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_order ON exam_questions(exam_id, order_number);

-- إضافة constraint لضمان عدم تكرار variant_number لنفس السؤال
ALTER TABLE question_variants 
ADD CONSTRAINT unique_variant_number 
UNIQUE (original_question_id, variant_number);

-- إضافة constraint لضمان عدم تكرار order_number في نفس الامتحان
ALTER TABLE exam_questions 
ADD CONSTRAINT unique_exam_question_order 
UNIQUE (exam_id, order_number);
