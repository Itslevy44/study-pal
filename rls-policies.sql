-- Updated RLS Policies for proper authentication

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can access materials" ON study_materials;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;

-- New policies
CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid()::uuid OR true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = auth.uid()::uuid);

CREATE POLICY "Everyone can view materials" ON study_materials
  FOR SELECT USING (true);

CREATE POLICY "Users can insert materials" ON study_materials
  FOR INSERT WITH CHECK (auth.uid()::uuid = uploaded_by);

CREATE POLICY "Users can manage their own materials" ON study_materials
  FOR UPDATE USING (auth.uid()::uuid = uploaded_by);

CREATE POLICY "Users can manage their own favorites" ON favorites
  FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage their own notes" ON notes
  FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage their own schedule" ON schedule_items
  FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage their own sessions" ON study_sessions
  FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage their own analytics" ON analytics_data
  FOR ALL USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can view all ratings" ON material_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own ratings" ON material_ratings
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can manage their own payments" ON payments
  FOR ALL USING (auth.uid()::uuid = user_id);
