-- Add Default Admin to Database
-- Run this in Supabase SQL Editor

-- Since the default admin is handled via hardcoded credentials in the API,
-- we need to add a corresponding record in the users table
-- We'll use a special UUID for the default admin

INSERT INTO users (id, email, school, year, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'levykirui093@gmail.com',
  'System',
  'Master',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  school = 'System',
  year = 'Master';

-- Verify the admin was added
SELECT * FROM users WHERE email = 'levykirui093@gmail.com';
