-- إضافة عمود last_reminder_sent في جدول users لتتبع آخر مرة تم إرسال تذكير فيها

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN users.last_reminder_sent IS 'آخر وقت تم إرسال تذكير اشتراك للمستخدم';
