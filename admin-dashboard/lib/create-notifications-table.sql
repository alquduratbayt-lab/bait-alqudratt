-- إنشاء جدول الإشعارات لولي الأمر

CREATE TABLE IF NOT EXISTS parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('login', 'lesson_completed', 'exam_completed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent_id 
ON parent_notifications(parent_id);

CREATE INDEX IF NOT EXISTS idx_parent_notifications_created_at 
ON parent_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parent_notifications_is_read 
ON parent_notifications(is_read);
