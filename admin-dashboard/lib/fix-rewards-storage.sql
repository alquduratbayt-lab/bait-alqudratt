-- حذف policies القديمة
DROP POLICY IF EXISTS "Public Access for rewards images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload rewards images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update rewards images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete rewards images" ON storage.objects;

-- السماح للجميع بقراءة صور الجوائز
CREATE POLICY "Public read access for rewards"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'rewards' );

-- السماح لأي مستخدم مسجل برفع الصور
CREATE POLICY "Authenticated users can upload to rewards"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'rewards' );

-- السماح لأي مستخدم مسجل بتحديث الصور
CREATE POLICY "Authenticated users can update rewards"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'rewards' );

-- السماح لأي مستخدم مسجل بحذف الصور
CREATE POLICY "Authenticated users can delete from rewards"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'rewards' );
