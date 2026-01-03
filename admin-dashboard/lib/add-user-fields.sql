-- إضافة الأعمدة الناقصة لجدول users

-- إضافة حقل رقم ولي الأمر
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- إضافة حقل تاريخ آخر تحديث
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);
