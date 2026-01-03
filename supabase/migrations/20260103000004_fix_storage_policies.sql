-- حذف الـ policies القديمة للـ Storage
DROP POLICY IF EXISTS "Public Access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete from logos" ON storage.objects;

-- إنشاء policies جديدة تسمح بالرفع والتعديل للجميع
CREATE POLICY "Public read access to logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload to logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete from logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos');
