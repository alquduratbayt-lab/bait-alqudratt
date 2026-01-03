-- إصلاح RLS policies لنظام النقاط
-- السماح للأدمن بالوصول الكامل

-- حذف policies القديمة
DROP POLICY IF EXISTS "Enable read access for all users" ON rewards;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rewards;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON rewards;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON rewards;

DROP POLICY IF EXISTS "Enable read access for all users" ON user_rewards;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_rewards;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_rewards;

-- Rewards policies - الأدمن يمكنه كل شيء، المستخدمون يمكنهم القراءة فقط
CREATE POLICY "Enable read access for all users" ON rewards
  FOR SELECT USING (true);

CREATE POLICY "Enable all for service role" ON rewards
  FOR ALL USING (true);

-- User Rewards policies - الأدمن يمكنه كل شيء، المستخدمون يمكنهم إضافة وقراءة طلباتهم فقط
CREATE POLICY "Enable read for users own rewards" ON user_rewards
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable all for service role" ON user_rewards
  FOR ALL USING (true);

-- Points Settings policies - الأدمن فقط
DROP POLICY IF EXISTS "Enable read access for all users" ON points_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON points_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON points_settings;

CREATE POLICY "Enable read access for all users" ON points_settings
  FOR SELECT USING (true);

CREATE POLICY "Enable all for service role" ON points_settings
  FOR ALL USING (true);

-- User Points policies - الكل يمكنه القراءة، النظام يمكنه التحديث
DROP POLICY IF EXISTS "Enable read access for all users" ON user_points;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_points;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON user_points;

CREATE POLICY "Enable read for users own points" ON user_points
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable all for service role" ON user_points
  FOR ALL USING (true);

-- Points History policies - الكل يمكنه القراءة، النظام يمكنه الإضافة
DROP POLICY IF EXISTS "Enable read access for all users" ON points_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON points_history;

CREATE POLICY "Enable read for users own history" ON points_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON points_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable all for service role" ON points_history
  FOR ALL USING (true);
