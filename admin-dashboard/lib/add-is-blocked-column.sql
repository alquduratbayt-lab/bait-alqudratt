-- إضافة عمود is_blocked في جدول users لحظر المستخدمين

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN users.is_blocked IS 'حالة حظر المستخدم - true = محظور، false = غير محظور';

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
