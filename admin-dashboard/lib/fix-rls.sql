-- تعطيل RLS للجداول
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- إنشاء سياسات للـ Storage bucket
-- نفذ هذا في Storage > videos > Policies

-- Policy 1: Allow public read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- Policy 2: Allow authenticated upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'videos' );

-- Policy 3: Allow authenticated delete
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'videos' );
