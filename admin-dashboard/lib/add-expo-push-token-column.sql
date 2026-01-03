-- إضافة عمود expo_push_token في جدول users لحفظ Push Notification tokens

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN users.expo_push_token IS 'Expo Push Notification token للمستخدم';
