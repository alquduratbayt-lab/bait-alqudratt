-- إضافة نظام موافقة ولي الأمر

-- إضافة حقل حالة الموافقة
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- إضافة حقل تاريخ الموافقة
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- إضافة حقل معرف ولي الأمر الذي وافق
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- إضافة index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_users_approval_status 
ON users(approval_status);

CREATE INDEX IF NOT EXISTS idx_users_parent_phone 
ON users(parent_phone);

-- تحديث الحسابات الموجودة لتكون موافق عليها
UPDATE users 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = 'pending';
