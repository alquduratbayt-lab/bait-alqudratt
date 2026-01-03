-- إنشاء جدول أسئلة امتحان تحديد المستوى
CREATE TABLE IF NOT EXISTS placement_test_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  equation_latex TEXT,
  equation_image_url TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('quantitative', 'verbal')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول نتائج امتحان تحديد المستوى
CREATE TABLE IF NOT EXISTS placement_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantitative_score INTEGER DEFAULT 0,
  quantitative_total INTEGER DEFAULT 0,
  quantitative_percentage DECIMAL(5,2) DEFAULT 0,
  verbal_score INTEGER DEFAULT 0,
  verbal_total INTEGER DEFAULT 0,
  verbal_percentage DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- إضافة indexes
CREATE INDEX IF NOT EXISTS idx_placement_questions_type ON placement_test_questions(type);
CREATE INDEX IF NOT EXISTS idx_placement_questions_order ON placement_test_questions(order_index);
CREATE INDEX IF NOT EXISTS idx_placement_results_user ON placement_test_results(user_id);

-- إضافة RLS policies
ALTER TABLE placement_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_test_results ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الأسئلة
CREATE POLICY "Allow read placement questions" ON placement_test_questions
  FOR SELECT
  USING (true);

-- السماح للمستخدمين بإنشاء نتائجهم
CREATE POLICY "Allow insert own placement results" ON placement_test_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- السماح للمستخدمين بقراءة نتائجهم فقط
CREATE POLICY "Allow read own placement results" ON placement_test_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدمين بتحديث نتائجهم
CREATE POLICY "Allow update own placement results" ON placement_test_results
  FOR UPDATE
  USING (auth.uid() = user_id);
