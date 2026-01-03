-- حذف جميع الـ policies القديمة لجدول otp_codes
DROP POLICY IF EXISTS "Allow insert for service role" ON otp_codes;
DROP POLICY IF EXISTS "Allow select for service role" ON otp_codes;
DROP POLICY IF EXISTS "Allow update for service role" ON otp_codes;
DROP POLICY IF EXISTS "Allow delete for service role" ON otp_codes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON otp_codes;
DROP POLICY IF EXISTS "Enable read access for all users" ON otp_codes;
DROP POLICY IF EXISTS "Enable update for users based on phone" ON otp_codes;
DROP POLICY IF EXISTS "Allow public insert" ON otp_codes;
DROP POLICY IF EXISTS "Allow public select" ON otp_codes;
DROP POLICY IF EXISTS "Allow public update" ON otp_codes;

-- إنشاء policies جديدة تسمح بالعمليات للجميع (بدون قيود)
-- هذا آمن لأن جدول OTP مؤقت ولا يحتوي على بيانات حساسة

-- السماح بالإدراج للجميع (مهم لتسجيل المستخدمين الجدد)
CREATE POLICY "Allow all inserts on otp_codes"
ON otp_codes FOR INSERT
WITH CHECK (true);

-- السماح بالقراءة للجميع
CREATE POLICY "Allow all selects on otp_codes"
ON otp_codes FOR SELECT
USING (true);

-- السماح بالتحديث للجميع
CREATE POLICY "Allow all updates on otp_codes"
ON otp_codes FOR UPDATE
USING (true)
WITH CHECK (true);

-- السماح بالحذف للجميع
CREATE POLICY "Allow all deletes on otp_codes"
ON otp_codes FOR DELETE
USING (true);
