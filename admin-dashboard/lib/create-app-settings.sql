-- جدول إعدادات التطبيق
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) DEFAULT 'text',
  category VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج القيم الافتراضية
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
  -- إعدادات الاتصال
  ('support_phone', '+966500000000', 'text', 'contact', 'رقم الهاتف', 'رقم الهاتف للدعم الفني'),
  ('support_whatsapp', '+966500000000', 'text', 'contact', 'رقم الواتساب', 'رقم الواتساب للدعم الفني'),
  
  -- إعدادات الامتحانات
  ('passing_percentage', '80', 'number', 'exams', 'نسبة النجاح', 'النسبة المطلوبة للنجاح في الامتحانات'),
  
  -- إعدادات النقاط
  ('points_enabled', 'true', 'boolean', 'points', 'تفعيل نظام النقاط', 'تفعيل أو تعطيل نظام النقاط والجوائز'),
  
  -- إعدادات AI
  ('gemini_api_key', 'AIzaSyDcQi-TQXvsxCrNuknakmwVssEk5bKsEJc', 'text', 'ai', 'Gemini API Key', 'مفتاح API للمعلم الذكي'),
  
  -- إعدادات عامة
  ('app_name', 'بيت القدرات', 'text', 'general', 'اسم التطبيق', 'اسم التطبيق الظاهر للمستخدمين'),
  ('welcome_message', 'مرحباً بك في بيت القدرات', 'text', 'general', 'رسالة الترحيب', 'رسالة الترحيب في الصفحة الرئيسية'),
  ('primary_color', '#1a5f7a', 'color', 'general', 'اللون الأساسي', 'اللون الأساسي للتطبيق'),
  
  -- إعدادات المحتوى
  ('banners_enabled', 'true', 'boolean', 'content', 'تفعيل البانرات', 'تفعيل أو تعطيل البانرات الإعلانية'),
  ('calm_moments_enabled', 'true', 'boolean', 'content', 'تفعيل لحظات الهدوء', 'تفعيل أو تعطيل صفحة لحظات الهدوء'),
  
  -- إعدادات الإشعارات
  ('student_notifications_enabled', 'true', 'boolean', 'notifications', 'إشعارات الطلاب', 'تفعيل إشعارات الطلاب'),
  ('parent_notifications_enabled', 'true', 'boolean', 'notifications', 'إشعارات أولياء الأمور', 'تفعيل إشعارات أولياء الأمور')
ON CONFLICT (setting_key) DO NOTHING;

-- RLS Policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Service role full access on app_settings" ON app_settings FOR ALL USING (true);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();
