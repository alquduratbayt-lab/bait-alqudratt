-- إصلاح Storage للتذاكر

-- حذف جميع الـ policies القديمة المتعلقة بـ tickets
DROP POLICY IF EXISTS "Anyone can view ticket images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ticket images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own ticket images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own ticket images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- إنشاء bucket للتذاكر (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- السماح للجميع بمشاهدة الصور
CREATE POLICY "tickets_public_access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tickets' );

-- السماح للمستخدمين المسجلين برفع الصور
CREATE POLICY "tickets_authenticated_upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'tickets' AND auth.role() = 'authenticated' );

-- السماح للمستخدمين المسجلين بتحديث الصور
CREATE POLICY "tickets_authenticated_update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'tickets' AND auth.role() = 'authenticated' );

-- السماح للمستخدمين المسجلين بحذف الصور
CREATE POLICY "tickets_authenticated_delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'tickets' AND auth.role() = 'authenticated' );
