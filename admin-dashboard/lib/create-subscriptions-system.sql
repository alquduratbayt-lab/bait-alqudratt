-- إنشاء جدول باقات الاشتراك
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء جدول اشتراكات المستخدمين
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- إضافة RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الباقات النشطة
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- السماح للمستخدمين بقراءة اشتراكاتهم فقط
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للإداريين بكل شيء
CREATE POLICY "Admins can do everything on subscription_plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

CREATE POLICY "Admins can do everything on user_subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- إضافة بيانات تجريبية
INSERT INTO subscription_plans (name, description, price, duration_days, features) VALUES
  ('الباقة الأساسية', 'باقة مثالية للمبتدئين', 99.00, 30, '["الوصول لجميع الدروس", "دعم فني أساسي", "شهادة إتمام"]'::jsonb),
  ('الباقة المتقدمة', 'باقة شاملة مع مميزات إضافية', 199.00, 30, '["الوصول لجميع الدروس", "دعم فني متقدم", "شهادة إتمام", "جلسات مباشرة شهرية", "تقارير تفصيلية"]'::jsonb),
  ('الباقة السنوية', 'وفر أكثر مع الاشتراك السنوي', 999.00, 365, '["الوصول لجميع الدروس", "دعم فني مميز", "شهادة إتمام", "جلسات مباشرة أسبوعية", "تقارير تفصيلية", "محتوى حصري"]'::jsonb)
ON CONFLICT DO NOTHING;
