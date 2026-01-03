'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface PointsSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string;
}

export default function PointsSettingsPage() {
  const [settings, setSettings] = useState<PointsSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('points_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('حدث خطأ أثناء جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const setting of settings) {
        const { error } = await supabase
          .from('points_settings')
          .update({ setting_value: setting.setting_value })
          .eq('id', setting.id);

        if (error) throw error;
      }

      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateSettingValue = (id: string, value: number) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, setting_value: value } : s
    ));
  };

  const getSettingLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      'lesson_completion': 'إكمال درس واحد',
      'subject_completion': 'إكمال منهج كامل',
      'exam_90_plus': 'امتحان نهائي (90% فأكثر)',
      'exam_80_89': 'امتحان نهائي (80-89%)',
      'exam_70_79': 'امتحان نهائي (70-79%)',
      'exam_60_69': 'امتحان نهائي (60-69%)',
      'exam_50_59': 'امتحان نهائي (50-59%)',
    };
    return labels[key] || key;
  };

  return (
    <DashboardLayout title="إعدادات النقاط">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">إعدادات النقاط</h1>
          <p className="text-gray-600 mb-8">
            حدد عدد النقاط التي يحصل عليها الطالب عند إكمال كل نشاط
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getSettingLabel(setting.setting_key)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={setting.setting_value}
                      onChange={(e) => updateSettingValue(setting.id, parseInt(e.target.value) || 0)}
                      className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold text-gray-900"
                    />
                    <span className="text-gray-600 font-medium">نقطة</span>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 ملاحظة</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• سيتم تطبيق هذه الإعدادات على جميع الطلاب</li>
            <li>• يمكنك تغيير القيم في أي وقت</li>
            <li>• التغييرات تؤثر على النقاط الجديدة فقط (لا تؤثر على النقاط السابقة)</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
