-- Add password column back if it was dropped
-- (This is needed for authentication)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add the default admin user with password
-- Note: In production, passwords should be properly hashed
INSERT INTO users (id, email, password, school, year, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'levykirui093@gmail.com',
  'levy4427',
  'System',
  'Master',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET
  password = 'levy4427',
  role = 'admin',
  school = 'System',
  year = 'Master';

-- Verify the admin was added
SELECT id, email, school, year, role FROM users WHERE email = 'levykirui093@gmail.com';
