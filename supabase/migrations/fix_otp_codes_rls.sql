-- إصلاح RLS policies لجدول otp_codes للسماح بالإدراج من التطبيق

-- حذف الـ policies القديمة
DROP POLICY IF EXISTS "Allow insert OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow read own OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow update OTP codes" ON otp_codes;

-- السماح للجميع بإنشاء OTP (بدون تسجيل دخول - للمستخدمين الجدد)
CREATE POLICY "Allow insert OTP codes" ON otp_codes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- السماح للجميع بقراءة OTP غير المنتهي (للتحقق)
CREATE POLICY "Allow read own OTP codes" ON otp_codes
  FOR SELECT
  TO public
  USING (expires_at > NOW() AND verified = FALSE);

-- السماح للجميع بتحديث OTP (للتحقق)
CREATE POLICY "Allow update OTP codes" ON otp_codes
  FOR UPDATE
  TO public
  USING (expires_at > NOW());
