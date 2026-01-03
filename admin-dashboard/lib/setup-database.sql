-- إنشاء جدول المستخدمين (الطلاب وأولياء الأمور)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student', 'parent')),
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subscription_type TEXT,
  subscription_status TEXT,
  subscription_start DATE,
  subscription_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المواد الدراسية
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  passing_percentage INTEGER NOT NULL DEFAULT 80,
  lessons_count INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول المدراء
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة بيانات تجريبية للمستخدمين
INSERT INTO users (name, email, phone, type, subscription_type, subscription_status, subscription_start, subscription_end)
VALUES 
  ('عبدالعزيز حمدي', 'abdulaziz@example.com', '01273939519', 'student', 'الشهرية', 'نشط', '2025-01-01', '2025-02-01'),
  ('محمد احمد', 'mohammed@example.com', '01273939319', 'parent', 'السنوية', 'غير نشط', '2025-01-01', '2026-01-01')
ON CONFLICT (email) DO NOTHING;

-- إضافة بيانات تجريبية للمواد
INSERT INTO subjects (name, type, lessons_count, duration)
VALUES 
  ('الرياضيات', 'كمي', 24, 12),
  ('الفيزياء', 'كمي', 24, 12),
  ('اللغة العربية', 'لفظي', 24, 12)
ON CONFLICT DO NOTHING;

-- إضافة مدير تجريبي (كلمة المرور: admin123)
INSERT INTO admins (email, password)
VALUES ('admin@bait-alqudratt.com', '$2a$10$rOvHPGYvxQ8K5Y5Y5Y5Y5uN5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y')
ON CONFLICT (email) DO NOTHING;

-- إنشاء جدول الدروس
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  video_file TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الأسئلة
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  show_at_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول أسئلة الامتحان النهائي
CREATE TABLE IF NOT EXISTS exam_questions (
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

-- إنشاء جدول تقدم الطلاب
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  exam_score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subjects_type ON subjects(type);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_lesson_id ON exam_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id ON student_progress(lesson_id);
