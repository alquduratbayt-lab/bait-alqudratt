-- Add profile_image column to users table
-- This column will store the URL of the user's profile picture

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.users.profile_image IS 'URL of the user profile image stored in Supabase Storage';
