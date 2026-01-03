-- حذف جميع policies القديمة من storage.objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%reward%') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- إنشاء policies جديدة للـ rewards bucket
CREATE POLICY "Anyone can view rewards images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'rewards' );

CREATE POLICY "Authenticated users can upload rewards images"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'rewards' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update rewards images"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'rewards' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete rewards images"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'rewards' 
  AND auth.role() = 'authenticated'
);

-- تحديث bucket ليكون public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'rewards';
