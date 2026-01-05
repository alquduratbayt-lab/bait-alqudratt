-- إضافة إعدادات AI Provider و DeepSeek API Key

-- إضافة إعداد ai_provider
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, category, label, description)
VALUES (
  'ai_provider',
  'deepseek',
  'text',
  'ai',
  'مزود الذكاء الاصطناعي',
  'اختر بين DeepSeek أو Gemini (deepseek أو gemini)'
)
ON CONFLICT (setting_key) DO UPDATE
SET 
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  category = EXCLUDED.category,
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- إضافة إعداد deepseek_api_key
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, category, label, description)
VALUES (
  'deepseek_api_key',
  'sk-f6d26199b59b40c9bbc43582f1add4d8',
  'text',
  'ai',
  'مفتاح DeepSeek API',
  'مفتاح API الخاص بـ DeepSeek'
)
ON CONFLICT (setting_key) DO UPDATE
SET 
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  category = EXCLUDED.category,
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- تحديث إعداد gemini_api_key ليكون في فئة ai
UPDATE public.app_settings
SET 
  category = 'ai',
  label = 'مفتاح Gemini API',
  description = 'مفتاح API الخاص بـ Google Gemini'
WHERE setting_key = 'gemini_api_key';
