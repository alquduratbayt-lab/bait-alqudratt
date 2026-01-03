'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface OnboardingScreen {
  id: string;
  order_index: number;
  title: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function OnboardingScreensPage() {
  const [screens, setScreens] = useState<OnboardingScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState<OnboardingScreen | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 1,
    is_active: true,
    image_file: null as File | null
  });

  useEffect(() => {
    fetchScreens();
  }, []);

  const fetchScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_screens')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setScreens(data || []);
    } catch (error: any) {
      console.error('Error fetching screens:', error);
      setMessage({ type: 'error', text: 'فشل تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingScreen(null);
    setFormData({
      title: '',
      description: '',
      order_index: screens.length + 1,
      is_active: true,
      image_file: null
    });
    setShowModal(true);
  };

  const openEditModal = (screen: OnboardingScreen) => {
    setEditingScreen(screen);
    setFormData({
      title: screen.title,
      description: screen.description,
      order_index: screen.order_index,
      is_active: screen.is_active,
      image_file: null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingScreen(null);
    setFormData({
      title: '',
      description: '',
      order_index: 1,
      is_active: true,
      image_file: null
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'الرجاء ملء جميع الحقول' });
      return;
    }

    try {
      setSaving(true);
      let imageUrl = editingScreen?.image_url || null;

      if (formData.image_file) {
        const fileExt = formData.image_file.name.split('.').pop();
        const fileName = `onboarding-${Date.now()}.${fileExt}`;
        const filePath = `onboarding-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData.image_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (editingScreen) {
        const { error } = await supabase
          .from('onboarding_screens')
          .update({
            title: formData.title,
            description: formData.description,
            order_index: formData.order_index,
            is_active: formData.is_active,
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingScreen.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'تم التحديث بنجاح' });
      } else {
        const { error } = await supabase
          .from('onboarding_screens')
          .insert({
            title: formData.title,
            description: formData.description,
            order_index: formData.order_index,
            is_active: formData.is_active,
            image_url: imageUrl
          });

        if (error) throw error;
        setMessage({ type: 'success', text: 'تم الإضافة بنجاح' });
      }

      await fetchScreens();
      closeModal();
    } catch (error: any) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشاشة؟')) return;

    try {
      const { error } = await supabase
        .from('onboarding_screens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScreens(screens.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
    } catch (error: any) {
      console.error('Error deleting:', error);
      setMessage({ type: 'error', text: 'فشل الحذف' });
    }
  };

  const toggleActive = async (screen: OnboardingScreen) => {
    try {
      const { error } = await supabase
        .from('onboarding_screens')
        .update({ is_active: !screen.is_active })
        .eq('id', screen.id);

      if (error) throw error;

      setScreens(screens.map(s => 
        s.id === screen.id ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (error: any) {
      console.error('Error toggling:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="شاشات الترحيب">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="شاشات الترحيب">
      <div className="container mx-auto py-8 px-4" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">شاشات الترحيب</h1>
            <p className="text-gray-800 mt-2">إدارة شاشات الترحيب التي تظهر للمستخدمين الجدد</p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة شاشة
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {screens.map((screen) => (
            <div key={screen.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  {screen.image_url && (
                    <img
                      src={screen.image_url}
                      alt={screen.title}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {screen.order_index}. {screen.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${screen.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {screen.is_active ? 'نشطة' : 'غير نشطة'}
                      </span>
                    </div>
                    <p className="text-gray-700">{screen.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(screen)}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                    title={screen.is_active ? 'إخفاء' : 'إظهار'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {screen.is_active ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => openEditModal(screen)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="تعديل"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(screen.id)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    title="حذف"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {screens.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-800 mb-4 font-medium">لا توجد شاشات ترحيب</p>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              إضافة أول شاشة
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editingScreen ? 'تعديل شاشة الترحيب' : 'إضافة شاشة ترحيب جديدة'}
                  </h2>
                  <button onClick={closeModal} className="text-white hover:bg-white/20 rounded-full p-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان الشاشة"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف الشاشة"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">الترتيب</label>
                    <input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">الحالة</label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">نشطة</option>
                      <option value="inactive">غير نشطة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">الصورة</label>
                  {editingScreen?.image_url && !formData.image_file && (
                    <img src={editingScreen.image_url} alt="Current" className="w-32 h-32 object-cover rounded-lg border mb-3" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image_file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-6 border-t flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
