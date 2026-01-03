-- Storage Policies for avatars bucket
-- Run this in Supabase SQL Editor

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 3: Allow authenticated users to update their images
CREATE POLICY "Allow authenticated updates to avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy 4: Allow authenticated users to delete their images
CREATE POLICY "Allow authenticated deletes from avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
