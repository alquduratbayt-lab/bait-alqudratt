-- إنشاء جدول إشعارات الطلاب

CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('study_reminder', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_student_notifications_student_id 
ON student_notifications(student_id);

CREATE INDEX IF NOT EXISTS idx_student_notifications_created_at 
ON student_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_notifications_is_read 
ON student_notifications(is_read);
