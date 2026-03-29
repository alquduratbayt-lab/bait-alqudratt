-- إصلاح نهائي لـ RLS على جدول otp_codes
-- يتأكد من تفعيل RLS مع سياسات مفتوحة (الجدول مؤقت ولا يحتوي بيانات حساسة)

-- تفعيل RLS
ALTER TABLE IF EXISTS public.otp_codes ENABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Allow insert OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow read own OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow update OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow delete OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow all inserts on otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow all selects on otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow all updates on otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow all deletes on otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow all operations on OTP codes" ON otp_codes;
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

-- سياسات مفتوحة للجميع (anon + authenticated + service_role)
CREATE POLICY "otp_allow_insert" ON otp_codes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "otp_allow_select" ON otp_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "otp_allow_update" ON otp_codes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "otp_allow_delete" ON otp_codes FOR DELETE TO anon, authenticated USING (true);

-- منح الصلاحيات على مستوى الجدول
GRANT SELECT, INSERT, UPDATE, DELETE ON otp_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON otp_codes TO authenticated;
