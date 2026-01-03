-- حذف كل شيء قديم أولاً
DROP TRIGGER IF EXISTS update_user_rewards_updated_at ON user_rewards;
DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
DROP TRIGGER IF EXISTS update_points_settings_updated_at ON points_settings;

DROP FUNCTION IF EXISTS update_user_rewards_updated_at();
DROP FUNCTION IF EXISTS update_user_points_updated_at();
DROP FUNCTION IF EXISTS update_rewards_updated_at();
DROP FUNCTION IF EXISTS update_points_settings_updated_at();

DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS points_settings CASCADE;

-- إنشاء جدول إعدادات النقاط
CREATE TABLE points_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج القيم الافتراضية
INSERT INTO points_settings (setting_key, setting_value, description) VALUES
  ('lesson_completion', 10, 'نقاط إكمال درس واحد'),
  ('subject_completion', 100, 'نقاط إكمال منهج كامل'),
  ('exam_50_59', 10, 'نقاط الامتحان النهائي (50-59%)'),
  ('exam_60_69', 20, 'نقاط الامتحان النهائي (60-69%)'),
  ('exam_70_79', 30, 'نقاط الامتحان النهائي (70-79%)'),
  ('exam_80_89', 40, 'نقاط الامتحان النهائي (80-89%)'),
  ('exam_90_plus', 50, 'نقاط الامتحان النهائي (90% فأكثر)');

-- إنشاء جدول الجوائز
CREATE TABLE rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  points_required INTEGER NOT NULL,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول رصيد النقاط للمستخدمين
CREATE TABLE user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- إنشاء جدول تاريخ النقاط
CREATE TABLE points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الجوائز المستبدلة
CREATE TABLE user_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status);

-- تفعيل RLS
ALTER TABLE points_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view points settings" ON points_settings FOR SELECT USING (true);
CREATE POLICY "Service role full access on points_settings" ON points_settings FOR ALL USING (true);

CREATE POLICY "Anyone can view active rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Service role full access on rewards" ON rewards FOR ALL USING (true);

CREATE POLICY "Users can view any points" ON user_points FOR SELECT USING (true);
CREATE POLICY "Users can insert own points" ON user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on user_points" ON user_points FOR ALL USING (true);

CREATE POLICY "Users can view any history" ON points_history FOR SELECT USING (true);
CREATE POLICY "Users can insert own history" ON points_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on points_history" ON points_history FOR ALL USING (true);

CREATE POLICY "Users can view any rewards" ON user_rewards FOR SELECT USING (true);
CREATE POLICY "Users can insert own reward requests" ON user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on user_rewards" ON user_rewards FOR ALL USING (true);

-- Triggers لتحديث updated_at
CREATE OR REPLACE FUNCTION update_points_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_settings_updated_at
  BEFORE UPDATE ON points_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_points_settings_updated_at();

CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_rewards_updated_at();

CREATE OR REPLACE FUNCTION update_user_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points_updated_at();

CREATE OR REPLACE FUNCTION update_user_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_rewards_updated_at
  BEFORE UPDATE ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rewards_updated_at();
