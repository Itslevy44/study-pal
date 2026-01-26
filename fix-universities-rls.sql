-- Fix Universities Table RLS Policies
-- Run this in Supabase SQL Editor to allow admins to add universities

-- Drop old policy
DROP POLICY IF EXISTS "Anyone can view universities" ON universities;

-- Create new policies
-- Anyone can view universities
CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT USING (true);

-- Authenticated users (admins) can add universities
CREATE POLICY "Authenticated users can add universities" ON universities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users (admins) can delete universities
CREATE POLICY "Authenticated users can delete universities" ON universities
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Authenticated users (admins) can update universities
CREATE POLICY "Authenticated users can update universities" ON universities
  FOR UPDATE USING (auth.uid() IS NOT NULL);
