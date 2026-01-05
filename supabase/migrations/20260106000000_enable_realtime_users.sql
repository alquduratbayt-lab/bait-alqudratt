-- Enable Realtime for users table
-- This allows real-time subscriptions to work for parent monitoring student activity

-- Enable realtime on users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Grant necessary permissions
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
