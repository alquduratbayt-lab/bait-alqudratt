import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

// الحصول على إصدار التطبيق الحالي
export const getCurrentAppVersion = () => {
  return Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
};

// مقارنة الإصدارات (يرجع true إذا كان الإصدار الحالي أقل من المطلوب)
export const isVersionOutdated = (currentVersion, minVersion) => {
  const current = currentVersion.split('.').map(Number);
  const min = minVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, min.length); i++) {
    const c = current[i] || 0;
    const m = min[i] || 0;
    
    if (c < m) return true;
    if (c > m) return false;
  }
  
  return false;
};

// جلب إعدادات الإصدار من السيرفر
export const fetchVersionSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['min_app_version', 'app_store_url', 'play_store_url', 'update_message']);
    
    if (error) {
      console.error('Error fetching version settings:', error);
      return null;
    }
    
    const settings = {};
    data?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });
    
    return settings;
  } catch (error) {
    console.error('Error in fetchVersionSettings:', error);
    return null;
  }
};

// التحقق مما إذا كان التحديث مطلوباً
export const checkForRequiredUpdate = async () => {
  try {
    const settings = await fetchVersionSettings();
    
    if (!settings || !settings.min_app_version) {
      return { updateRequired: false };
    }
    
    const currentVersion = getCurrentAppVersion();
    const minVersion = settings.min_app_version;
    
    console.log('📱 Current app version:', currentVersion);
    console.log('📱 Minimum required version:', minVersion);
    
    const updateRequired = isVersionOutdated(currentVersion, minVersion);
    
    return {
      updateRequired,
      currentVersion,
      minVersion,
      updateMessage: settings.update_message,
      appStoreUrl: settings.app_store_url,
      playStoreUrl: settings.play_store_url,
    };
  } catch (error) {
    console.error('Error checking for update:', error);
    return { updateRequired: false };
  }
};
