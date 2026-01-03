-- إضافة إعدادات السوشيال ميديا في app_settings
-- يتم تنفيذ هذا الملف مرة واحدة فقط

-- إضافة حقول السوشيال ميديا
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, label, description)
VALUES 
  ('social_instagram', '', 'text', 'social', 'رابط Instagram', 'رابط حساب Instagram الرسمي (مثال: https://instagram.com/username)'),
  ('social_twitter', '', 'text', 'social', 'رابط Twitter', 'رابط حساب Twitter الرسمي (مثال: https://twitter.com/username)'),
  ('social_tiktok', '', 'text', 'social', 'رابط TikTok', 'رابط حساب TikTok الرسمي (مثال: https://tiktok.com/@username)')
ON CONFLICT (setting_key) DO NOTHING;

-- التحقق من الإضافة
SELECT * FROM app_settings WHERE category = 'social';
