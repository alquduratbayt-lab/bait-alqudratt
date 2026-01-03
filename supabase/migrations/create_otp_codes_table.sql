-- إنشاء جدول لحفظ رموز OTP
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  CONSTRAINT valid_phone CHECK (phone ~ '^\+?[0-9]{10,15}$')
);

-- إضافة index على رقم الهاتف للبحث السريع
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

-- إضافة index على تاريخ الانتهاء
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- إضافة RLS policies
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- حذف الـ policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow insert OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow read own OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow update OTP codes" ON otp_codes;

-- السماح للجميع بإنشاء OTP (سيتم التحكم من Edge Function)
CREATE POLICY "Allow insert OTP codes" ON otp_codes
  FOR INSERT
  WITH CHECK (true);

-- السماح بقراءة OTP فقط للكود غير المنتهي
CREATE POLICY "Allow read own OTP codes" ON otp_codes
  FOR SELECT
  USING (expires_at > NOW() AND verified = FALSE);

-- السماح بتحديث OTP (للتحقق)
CREATE POLICY "Allow update OTP codes" ON otp_codes
  FOR UPDATE
  USING (expires_at > NOW());

-- حذف الرموز المنتهية تلقائياً (يمكن تشغيله كـ cron job)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('delete-expired-otps', '0 * * * *', 'DELETE FROM otp_codes WHERE expires_at < NOW()');
