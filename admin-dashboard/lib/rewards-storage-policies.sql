-- Storage policies لـ bucket الجوائز

-- السماح للجميع بقراءة صور الجوائز
CREATE POLICY "Public Access for rewards images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'rewards' );

-- السماح للمستخدمين المصادق عليهم برفع الصور
CREATE POLICY "Authenticated users can upload rewards images"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'rewards' 
  AND auth.role() = 'authenticated' 
);

-- السماح للمستخدمين المصادق عليهم بتحديث الصور
CREATE POLICY "Authenticated users can update rewards images"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'rewards' 
  AND auth.role() = 'authenticated' 
);

-- السماح للمستخدمين المصادق عليهم بحذف الصور
CREATE POLICY "Authenticated users can delete rewards images"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'rewards' 
  AND auth.role() = 'authenticated' 
);
