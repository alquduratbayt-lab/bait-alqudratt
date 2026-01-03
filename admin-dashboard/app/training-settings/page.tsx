'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface TrainingSettings {
  id: string;
  is_enabled: boolean;
  allowed_subscriptions: string[];
  title: string;
  description: string;
}

export default function TrainingSettingsPage() {
  const [settings, setSettings] = useState<TrainingSettings>({
    id: '',
    is_enabled: false,
    allowed_subscriptions: ['premium'],
    title: 'التدريب المباشر',
    description: 'دروس خصوصية مباشرة مع أفضل المدرسين',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('training_page_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setInitialLoad(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (settings.id) {
        // تحديث
        const { error } = await supabase
          .from('training_page_settings')
          .update({
            is_enabled: settings.is_enabled,
            allowed_subscriptions: settings.allowed_subscriptions,
            title: settings.title,
            description: settings.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // إنشاء جديد
        const { data, error } = await supabase
          .from('training_page_settings')
          .insert([{
            is_enabled: settings.is_enabled,
            allowed_subscriptions: settings.allowed_subscriptions,
            title: settings.title,
            description: settings.description,
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }

      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = (tier: string) => {
    const current = settings.allowed_subscriptions;
    if (current.includes(tier)) {
      setSettings({
        ...settings,
        allowed_subscriptions: current.filter(t => t !== tier)
      });
    } else {
      setSettings({
        ...settings,
        allowed_subscriptions: [...current, tier]
      });
    }
  };

  const getTierLabel = (tier: string) => {
    const labels: { [key: string]: string } = {
      free: 'مجاني',
      basic: 'أساسي',
      premium: 'مميز'
    };
    return labels[tier] || tier;
  };

  if (initialLoad) {
    return (
      <DashboardLayout title="إعدادات التدريب المباشر">
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="إعدادات التدريب المباشر">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-right">
          إعدادات صفحة التدريب المباشر
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* تفعيل/تعطيل الصفحة */}
          <div className="border-b pb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                  className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900">تفعيل صفحة التدريب المباشر</p>
                  <p className="text-sm text-gray-500">عند التفعيل، ستظهر الصفحة للطلاب المسموح لهم</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                settings.is_enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {settings.is_enabled ? 'مفعّل' : 'معطّل'}
              </span>
            </label>
          </div>

          {/* العنوان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              عنوان الصفحة
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
              placeholder="مثال: التدريب المباشر"
            />
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              وصف الصفحة
            </label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
              rows={3}
              placeholder="وصف مختصر عن خدمة التدريب المباشر..."
            />
          </div>

          {/* الباقات المسموح لها */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-right">
              الباقات المسموح لها بالدخول:
            </label>
            <div className="space-y-3">
              {['free', 'basic', 'premium'].map((tier) => (
                <label key={tier} className="flex items-center justify-end gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                  <div className="text-right flex-1">
                    <p className="font-medium text-gray-900">{getTierLabel(tier)}</p>
                    <p className="text-sm text-gray-500">
                      {tier === 'free' && 'الطلاب غير المشتركين'}
                      {tier === 'basic' && 'المشتركون في الباقة الأساسية'}
                      {tier === 'premium' && 'المشتركون في الباقة المميزة'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowed_subscriptions.includes(tier)}
                    onChange={() => toggleSubscription(tier)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                  />
                </label>
              ))}
            </div>
            {settings.allowed_subscriptions.length === 0 && (
              <p className="text-sm text-red-600 mt-2 text-right">
                ⚠️ يجب اختيار باقة واحدة على الأقل
              </p>
            )}
          </div>

          {/* معاينة */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-right">معاينة الإعدادات:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-right">
              <li>• الحالة: {settings.is_enabled ? 'مفعّل ✓' : 'معطّل ✗'}</li>
              <li>• العنوان: {settings.title}</li>
              <li>• الباقات المسموحة: {settings.allowed_subscriptions.map(getTierLabel).join('، ')}</li>
            </ul>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={fetchSettings}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              disabled={loading}
            >
              إعادة تحميل
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={loading || settings.allowed_subscriptions.length === 0}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>

        {/* ملاحظات */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2 text-right">📝 ملاحظات مهمة:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 text-right">
            <li>• عند تعطيل الصفحة، لن يتمكن أي طالب من الدخول إليها</li>
            <li>• يمكنك اختيار أكثر من باقة للسماح لها بالدخول</li>
            <li>• الطلاب الذين لا يملكون الصلاحية سيرون رسالة "اشترك للوصول"</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
