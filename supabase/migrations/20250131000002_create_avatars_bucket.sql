-- Create avatars storage bucket for profile images
-- This bucket will store user profile pictures

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'profile-images'
  );

-- Policy: Allow public read access to avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Policy: Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Policy: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
