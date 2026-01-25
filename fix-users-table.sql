-- Fix Users Table: Remove password column and link to auth.users
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing constraints and column
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Step 2: Add foreign key reference to auth.users if not already present
ALTER TABLE users 
ADD CONSTRAINT users_id_fk 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Verify the table structure
-- SELECT * FROM users LIMIT 1;
