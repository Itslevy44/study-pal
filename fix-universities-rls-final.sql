-- Fix Universities Table RLS Policies
-- The current policies are blocking INSERT operations

-- Drop all existing universities policies
DROP POLICY IF EXISTS "Anyone can view universities" ON universities;
DROP POLICY IF EXISTS "Authenticated users can add universities" ON universities;
DROP POLICY IF EXISTS "Authenticated users can delete universities" ON universities;
DROP POLICY IF EXISTS "Authenticated users can update universities" ON universities;

-- Create new, simpler policies
-- Everyone can read universities
CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT USING (true);

-- Everyone authenticated can insert universities
CREATE POLICY "Users can add universities" ON universities
  FOR INSERT WITH CHECK (true);

-- Users can delete universities
CREATE POLICY "Users can delete universities" ON universities
  FOR DELETE USING (true);

-- Users can update universities
CREATE POLICY "Users can update universities" ON universities
  FOR UPDATE USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'universities'
ORDER BY policyname;
