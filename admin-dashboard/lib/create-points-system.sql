-- جدول إعدادات النقاط
CREATE TABLE IF NOT EXISTS points_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  ('exam_90_plus', 50, 'نقاط الامتحان النهائي (90% فأكثر)'),
  ('exam_80_89', 40, 'نقاط الامتحان النهائي (80-89%)'),
  ('exam_70_79', 30, 'نقاط الامتحان النهائي (70-79%)'),
  ('exam_60_69', 20, 'نقاط الامتحان النهائي (60-69%)'),
  ('exam_50_59', 10, 'نقاط الامتحان النهائي (50-59%)')
ON CONFLICT (setting_key) DO NOTHING;

-- جدول الجوائز
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  points_required INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول رصيد النقاط للمستخدمين
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- جدول تاريخ النقاط
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'lesson_completion', 'subject_completion', 'exam_completion', 'reward_redemption'
  reference_id UUID, -- ID الدرس أو المنهج أو الامتحان أو الجائزة
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الجوائز المستبدلة
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'delivered', 'cancelled'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active, order_number);

-- إضافة RLS policies
ALTER TABLE points_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة إعدادات النقاط
CREATE POLICY "Anyone can view points settings"
  ON points_settings FOR SELECT
  USING (true);

-- السماح للمستخدمين المسجلين بإدارة إعدادات النقاط
CREATE POLICY "Authenticated users can manage points settings"
  ON points_settings FOR ALL
  USING (auth.uid() IS NOT NULL);

-- السماح للجميع بقراءة الجوائز النشطة
CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = true);

-- السماح للمستخدمين المسجلين بإدارة الجوائز
CREATE POLICY "Authenticated users can manage rewards"
  ON rewards FOR ALL
  USING (auth.uid() IS NOT NULL);

-- السماح للمستخدمين بقراءة نقاطهم فقط
CREATE POLICY "Users can view their own points"
  ON user_points FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدمين المسجلين بإدارة النقاط
CREATE POLICY "Authenticated users can manage user points"
  ON user_points FOR ALL
  USING (auth.uid() IS NOT NULL);

-- السماح للمستخدمين بقراءة تاريخ نقاطهم فقط
CREATE POLICY "Users can view their own points history"
  ON points_history FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدمين المسجلين بإضافة تاريخ نقاط
CREATE POLICY "Authenticated users can add points history"
  ON points_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- السماح للمستخدمين بقراءة جوائزهم المستبدلة فقط
CREATE POLICY "Users can view their own rewards"
  ON user_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدمين المسجلين بإدارة الجوائز المستبدلة
CREATE POLICY "Authenticated users can manage user rewards"
  ON user_rewards FOR ALL
  USING (auth.uid() IS NOT NULL);

-- إضافة triggers لتحديث updated_at
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
