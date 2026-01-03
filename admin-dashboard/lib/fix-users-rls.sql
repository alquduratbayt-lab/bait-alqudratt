-- تعطيل RLS على جدول users للسماح بالتسجيل
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- أو إذا كنت تريد الاحتفاظ بـ RLS، أضف سياسة للسماح بالإدخال
-- DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
-- CREATE POLICY "Enable insert for authentication" ON users
--   FOR INSERT
--   WITH CHECK (true);
