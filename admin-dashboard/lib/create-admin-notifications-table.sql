-- إنشاء جدول الإشعارات الإدارية (من الإدارة للمستخدمين)

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'students', 'parents', 'both')),
  target_users UUID[] NOT NULL,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول لتتبع الإشعارات المقروءة لكل مستخدم
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_target_type 
ON notifications(target_type);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id 
ON user_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read 
ON user_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id 
ON user_notifications(notification_id);
