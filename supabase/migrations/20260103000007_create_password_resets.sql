-- إنشاء جدول لحفظ طلبات إعادة تعيين كلمة المرور
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  new_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- إضافة RLS
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- حذف الـ policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow insert for all" ON password_resets;
DROP POLICY IF EXISTS "Allow select for all" ON password_resets;
DROP POLICY IF EXISTS "Allow update for all" ON password_resets;

-- السماح بالإدراج والقراءة للجميع (مؤقتاً للتطوير)
CREATE POLICY "Allow insert for all" ON password_resets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for all" ON password_resets
  FOR SELECT USING (true);

CREATE POLICY "Allow update for all" ON password_resets
  FOR UPDATE USING (true);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_phone ON password_resets(phone);
