-- إضافة إعدادات إصدار التطبيق (استخدم الهيكل الموجود)
-- شغّل هذا في Supabase SQL Editor

-- إدراج الإصدار الأدنى المطلوب
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, label, description) 
VALUES ('min_app_version', '1.0.0', 'text', 'app_version', 'الحد الأدنى لإصدار التطبيق', 'إذا كان إصدار التطبيق أقل من هذا الرقم، سيُجبر المستخدم على التحديث')
ON CONFLICT (setting_key) DO NOTHING;

-- إدراج رابط App Store
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, label, description) 
VALUES ('app_store_url', 'https://apps.apple.com/app/your-app-id', 'text', 'app_version', 'رابط App Store', 'رابط التطبيق في متجر Apple')
ON CONFLICT (setting_key) DO NOTHING;

-- إدراج رابط Play Store
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, label, description) 
VALUES ('play_store_url', 'https://play.google.com/store/apps/details?id=your.app.id', 'text', 'app_version', 'رابط Play Store', 'رابط التطبيق في متجر Google')
ON CONFLICT (setting_key) DO NOTHING;

-- إدراج رسالة التحديث
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, label, description) 
VALUES ('update_message', 'يتوفر إصدار جديد من التطبيق. يرجى التحديث للاستمرار.', 'textarea', 'app_version', 'رسالة التحديث', 'الرسالة التي تظهر للمستخدم عند طلب التحديث')
ON CONFLICT (setting_key) DO NOTHING;
