-- Comprehensive Database Fix for All Tables
-- Run this in Supabase SQL Editor to properly configure all tables

-- ============================================
-- 1. USERS TABLE - Already fixed with auth link
-- ============================================
-- Already linked to auth.users(id)

-- ============================================
-- 2. UNIVERSITIES TABLE - No changes needed
-- ============================================
-- (Independent table, no user links)

-- ============================================
-- 3. DROP OLD RLS POLICIES (if they exist)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can access materials" ON study_materials;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own ratings" ON material_ratings;
DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
DROP POLICY IF EXISTS "Users can manage own schedule" ON schedule_items;
DROP POLICY IF EXISTS "Users can manage own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can manage own analytics" ON analytics_data;
DROP POLICY IF EXISTS "Users can manage own payments" ON payments;
DROP POLICY IF EXISTS "Users can manage own offline materials" ON offline_materials;

-- ============================================
-- 4. RE-ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_materials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE PROPER RLS POLICIES
-- ============================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- UNIVERSITIES TABLE POLICIES (public read)
CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT USING (true);

-- STUDY MATERIALS POLICIES
CREATE POLICY "Anyone can view published materials" ON study_materials
  FOR SELECT USING (true);

CREATE POLICY "Users can upload their own materials" ON study_materials
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own materials" ON study_materials
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own materials" ON study_materials
  FOR DELETE USING (auth.uid() = uploaded_by);

-- MATERIAL RATINGS POLICIES
CREATE POLICY "Anyone can view ratings" ON material_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own ratings" ON material_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON material_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON material_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- FAVORITES POLICIES
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- TASKS POLICIES
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- NOTES POLICIES
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- SCHEDULE ITEMS POLICIES
CREATE POLICY "Users can view own schedule" ON schedule_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedule items" ON schedule_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule items" ON schedule_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule items" ON schedule_items
  FOR DELETE USING (auth.uid() = user_id);

-- STUDY SESSIONS POLICIES
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ANALYTICS DATA POLICIES
CREATE POLICY "Users can view own analytics" ON analytics_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics" ON analytics_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON analytics_data
  FOR UPDATE USING (auth.uid() = user_id);

-- PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- OFFLINE MATERIALS POLICIES
CREATE POLICY "Users can view own offline materials" ON offline_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own offline materials" ON offline_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offline materials" ON offline_materials
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. VERIFY SETUP (Run these to check)
-- ============================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies;
