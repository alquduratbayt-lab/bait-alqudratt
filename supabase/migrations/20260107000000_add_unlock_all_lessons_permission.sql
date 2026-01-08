-- Add unlock_all_lessons permission to users table
-- This allows admins to grant students access to all lessons without sequential restrictions

-- Add the new column
ALTER TABLE users ADD COLUMN IF NOT EXISTS unlock_all_lessons BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN users.unlock_all_lessons IS 'When true, student can access all lessons without completing previous ones';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_unlock_all_lessons ON users(unlock_all_lessons) WHERE unlock_all_lessons = true;
