'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  label: string;
  description: string | null;
}

export default function AppSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category, label');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      for (const setting of settings) {
        const { error } = await supabase
          .from('app_settings')
          .update({ setting_value: setting.setting_value })
          .eq('id', setting.id);

        if (error) throw error;
      }

      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateSettingValue = (id: string, value: string) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, setting_value: value } : s
    ));
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'contact': '📞 إعدادات الاتصال',
      'exams': '📝 إعدادات الامتحانات',
      'points': '⭐ إعدادات النقاط',
      'ai': '🤖 إعدادات الذكاء الاصطناعي',
      'general': '⚙️ إعدادات عامة',
      'content': '📱 إعدادات المحتوى',
      'notifications': '🔔 إعدادات الإشعارات',
      'social': '🌐 إعدادات السوشيال ميديا',
    };
    return labels[category] || category;
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as { [key: string]: AppSetting[] });

  const renderInput = (setting: AppSetting) => {
    switch (setting.setting_type) {
      case 'boolean':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setting.setting_value === 'true'}
              onChange={(e) => updateSettingValue(setting.id, e.target.checked ? 'true' : 'false')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            min="0"
            value={setting.setting_value}
            onChange={(e) => updateSettingValue(setting.id, e.target.value)}
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold text-gray-900"
          />
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={setting.setting_value}
              onChange={(e) => updateSettingValue(setting.id, e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={setting.setting_value}
              onChange={(e) => updateSettingValue(setting.id, e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={setting.setting_value}
            onChange={(e) => updateSettingValue(setting.id, e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
          />
        );
    }
  };

  return (
    <DashboardLayout title="إعدادات التطبيق">
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إعدادات التطبيق</h1>
          <p className="text-gray-600 mb-8">تحكم في جميع إعدادات التطبيق من مكان واحد</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                <div key={category} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {getCategoryLabel(category)}
                  </h2>
                  <div className="space-y-4">
                    {categorySettings.map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {setting.label}
                          </h3>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {renderInput(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
