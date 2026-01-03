-- إصلاح جدول notifications لإضافة الأعمدة المطلوبة

-- إنشاء جدول notifications إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة الأعمدة إذا لم تكن موجودة (للجداول الموجودة مسبقاً)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS data JSONB;

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- تفعيل RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- حذف Policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can do everything on notifications" ON notifications;

-- السماح للمستخدمين بقراءة إشعاراتهم فقط
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدمين بتحديث حالة قراءة إشعاراتهم
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- السماح للإداريين بكل شيء
CREATE POLICY "Admins can do everything on notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.type = 'admin'
    )
  );

-- إضافة تعليقات توضيحية
COMMENT ON TABLE notifications IS 'جدول الإشعارات للمستخدمين';
COMMENT ON COLUMN notifications.body IS 'محتوى الإشعار';
COMMENT ON COLUMN notifications.type IS 'نوع الإشعار (subscription_reminder, general, etc.)';
