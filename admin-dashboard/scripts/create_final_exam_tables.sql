-- جدول الامتحان النهائي للمادة
CREATE TABLE IF NOT EXISTS subject_final_exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  passing_percentage INTEGER DEFAULT 60,
  time_limit_minutes INTEGER DEFAULT NULL, -- وقت الامتحان بالدقائق (اختياري)
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id)
);

-- جدول أسئلة الامتحان النهائي للمادة
CREATE TABLE IF NOT EXISTS subject_final_exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES subject_final_exams(id) ON DELETE CASCADE,
  question_text TEXT,
  question_image_url TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  order_index INTEGER DEFAULT 0,
  source_type VARCHAR(50) DEFAULT 'custom', -- 'video_question', 'lesson_exam', 'custom'
  source_id UUID DEFAULT NULL, -- معرف السؤال الأصلي إذا كان مسحوب
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول نتائج الامتحان النهائي للطلاب
CREATE TABLE IF NOT EXISTS student_final_exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES subject_final_exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- عدد الإجابات الصحيحة
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB DEFAULT '[]', -- تخزين الإجابات [{question_id, answer, is_correct}]
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_subject_final_exams_subject_id ON subject_final_exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_final_exam_questions_exam_id ON subject_final_exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_final_exam_results_user_id ON student_final_exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_student_final_exam_results_exam_id ON student_final_exam_results(exam_id);

-- تفعيل RLS
ALTER TABLE subject_final_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_final_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_final_exam_results ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للقراءة العامة
CREATE POLICY "Allow read access to subject_final_exams" ON subject_final_exams FOR SELECT USING (true);
CREATE POLICY "Allow read access to subject_final_exam_questions" ON subject_final_exam_questions FOR SELECT USING (true);
CREATE POLICY "Allow read access to student_final_exam_results" ON student_final_exam_results FOR SELECT USING (true);

-- سياسات RLS للكتابة
CREATE POLICY "Allow insert to student_final_exam_results" ON student_final_exam_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to student_final_exam_results" ON student_final_exam_results FOR UPDATE USING (true);

-- سياسات للإدارة (لوحة التحكم)
CREATE POLICY "Allow all to subject_final_exams for service role" ON subject_final_exams FOR ALL USING (true);
CREATE POLICY "Allow all to subject_final_exam_questions for service role" ON subject_final_exam_questions FOR ALL USING (true);
