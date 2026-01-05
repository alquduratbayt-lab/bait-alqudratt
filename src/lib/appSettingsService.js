import { supabase } from './supabase';

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

// جلب جميع الإعدادات
export const getAppSettings = async () => {
  try {
    const now = Date.now();
    
    // استخدام الكاش إذا كان حديثاً
    if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedSettings;
    }

    const { data, error } = await supabase
      .from('app_settings')
      .select('*');

    if (error) throw error;

    // تحويل المصفوفة إلى object
    const settings = {};
    data.forEach(setting => {
      let value = setting.setting_value;
      
      // تحويل القيم حسب النوع
      if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseInt(value) || 0;
      }
      
      settings[setting.setting_key] = value;
    });

    cachedSettings = settings;
    lastFetchTime = now;
    
    return settings;
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return getDefaultSettings();
  }
};

// جلب إعداد واحد
export const getSetting = async (key, defaultValue = null) => {
  try {
    const settings = await getAppSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

// الإعدادات الافتراضية في حالة الفشل
const getDefaultSettings = () => ({
  support_phone: '+966500000000',
  support_whatsapp: '+966500000000',
  passing_percentage: 80,
  points_enabled: true,
  ai_provider: 'deepseek',
  gemini_api_key: 'AIzaSyDcQi-TQXvsxCrNuknakmwVssEk5bKsEJc',
  deepseek_api_key: 'sk-f6d26199b59b40c9bbc43582f1add4d8',
  app_name: 'بيت القدرات',
  welcome_message: 'مرحباً بك في بيت القدرات',
  primary_color: '#1a5f7a',
  banners_enabled: true,
  calm_moments_enabled: true,
  student_notifications_enabled: true,
  parent_notifications_enabled: true,
});

// مسح الكاش (للاستخدام بعد تحديث الإعدادات)
export const clearSettingsCache = () => {
  cachedSettings = null;
  lastFetchTime = 0;
};
