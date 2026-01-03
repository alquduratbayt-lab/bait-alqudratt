-- إضافة عمود push_token لحفظ Expo Push Token

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_users_push_token 
ON users(push_token);
