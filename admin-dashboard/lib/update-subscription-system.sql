-- تحديث نظام الاشتراكات والصلاحيات

-- 1. إضافة حقل is_free للدروس
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- 2. تحديث جدول البانرات لدعم الاستهداف المرن
ALTER TABLE banners ADD COLUMN IF NOT EXISTS target_subscriptions TEXT[] DEFAULT ARRAY['free', 'basic', 'premium'];
ALTER TABLE banners ADD COLUMN IF NOT EXISTS external_link TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. تحديث جدول خطط الاشتراك
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS can_access_ai_teacher BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS can_access_live_training BOOLEAN DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS show_banners BOOLEAN DEFAULT true;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS tier_level INTEGER DEFAULT 0; -- 0=free, 1=basic, 2=premium

-- 4. إضافة جدول إعدادات صفحة التدريب
CREATE TABLE IF NOT EXISTS training_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT false,
  allowed_subscriptions TEXT[] DEFAULT ARRAY['premium'],
  title TEXT DEFAULT 'التدريب المباشر',
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج إعدادات افتراضية
INSERT INTO training_page_settings (is_enabled, allowed_subscriptions, title, description)
VALUES (
  false, 
  ARRAY['premium'], 
  'التدريب المباشر',
  'دروس خصوصية مباشرة مع أفضل المدرسين'
)
ON CONFLICT (id) DO NOTHING;

-- 5. إضافة جدول جداول التدريب (للمستقبل)
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  zoom_link TEXT,
  max_students INTEGER DEFAULT 20,
  enrolled_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. تحديث جدول المستخدمين لإضافة tier
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- 7. تحديث بيانات المستخدمين الحاليين
UPDATE users 
SET subscription_tier = CASE 
  WHEN subscription_status = 'نشط' OR subscription_status = 'active' THEN 'basic'
  ELSE 'free'
END
WHERE subscription_tier = 'free';

-- 8. إنشاء دالة للتحقق من صلاحيات الوصول
CREATE OR REPLACE FUNCTION check_user_access(
  user_tier TEXT,
  required_tiers TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_tier = ANY(required_tiers);
END;
$$ LANGUAGE plpgsql;

-- 9. تحديث RLS policies للبانرات
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON banners;
CREATE POLICY "Banners are viewable by everyone" ON banners
  FOR SELECT USING (is_active = true);

-- 10. إضافة تعليقات توضيحية
COMMENT ON COLUMN lessons.is_free IS 'هل الدرس مجاني للطلاب غير المشتركين';
COMMENT ON COLUMN banners.target_subscriptions IS 'الباقات المستهدفة: free, basic, premium';
COMMENT ON COLUMN subscription_plans.can_access_ai_teacher IS 'هل يمكن الوصول للمعلم الذكي';
COMMENT ON COLUMN subscription_plans.can_access_live_training IS 'هل يمكن الوصول للتدريب المباشر';
COMMENT ON COLUMN users.subscription_tier IS 'مستوى الاشتراك: free, basic, premium';
