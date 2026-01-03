'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  external_link: string | null;
  target_subscriptions: string[];
  event_start_time: string | null;
  is_active: boolean;
  order_number: number;
  created_at: string;
}

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    external_link: '',
    target_subscriptions: ['free', 'basic', 'premium'] as string[],
    event_start_time: '',
    is_active: true,
    order_number: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_number', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('حدث خطأ أثناء تحميل البانرات');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      alert('الرجاء إدخال العنوان والصورة');
      return;
    }

    try {
      setLoading(true);

      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url,
        link_url: formData.link_url || null,
        external_link: formData.external_link || null,
        target_subscriptions: formData.target_subscriptions,
        event_start_time: formData.event_start_time || null,
        is_active: formData.is_active,
        order_number: formData.order_number,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        alert('تم تحديث البانر بنجاح!');
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
        alert('تم إضافة البانر بنجاح!');
      }

      setShowModal(false);
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        external_link: '',
        target_subscriptions: ['free', 'basic', 'premium'],
        event_start_time: '',
        is_active: true,
        order_number: 0,
      });
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      alert(`حدث خطأ أثناء حفظ البانر:\n${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      external_link: banner.external_link || '',
      target_subscriptions: banner.target_subscriptions || ['free', 'basic', 'premium'],
      event_start_time: banner.event_start_time ? new Date(banner.event_start_time).toISOString().slice(0, 16) : '',
      is_active: banner.is_active,
      order_number: banner.order_number,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('تم حذف البانر بنجاح!');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('حدث خطأ أثناء حذف البانر');
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('حدث خطأ أثناء تحديث حالة البانر');
    }
  };

  return (
    <DashboardLayout title="البانرات الإعلانية">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">البانرات الإعلانية</h1>
          <button
            onClick={() => {
              setEditingBanner(null);
              setFormData({
                title: '',
                subtitle: '',
                image_url: '',
                link_url: '',
                external_link: '',
                target_subscriptions: ['free', 'basic', 'premium'],
                event_start_time: '',
                is_active: true,
                order_number: banners.length,
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + إضافة بانر جديد
          </button>
        </div>

        {loading && !showModal ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white rounded-lg shadow-md p-6 flex items-center gap-6"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
                  )}
                  {banner.event_start_time && (
                    <p className="text-sm text-red-600 mt-2">
                      🕐 وقت البدء: {new Date(banner.event_start_time).toLocaleString('ar-SA')}
                    </p>
                  )}
                  {(banner.link_url || banner.external_link) && (
                    <p className="text-sm text-blue-600 mt-1">
                      🔗 <a href={banner.external_link || banner.link_url || '#'} target="_blank" rel="noopener noreferrer">{banner.external_link || banner.link_url}</a>
                    </p>
                  )}
                  {banner.target_subscriptions && banner.target_subscriptions.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {banner.target_subscriptions.map((tier: string) => (
                        <span key={tier} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tier === 'free' ? 'مجاني' : tier === 'basic' ? 'أساسي' : 'مميز'}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">الترتيب: {banner.order_number}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      banner.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {banner.is_active ? '✓ مفعّل' : '✗ معطّل'}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}

            {banners.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                لا توجد بانرات. اضغط على "إضافة بانر جديد" للبدء.
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-slideUp">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8 text-right">
                {editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    النص الفرعي
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    الصورة *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-blue-600 mt-2">جاري رفع الصورة...</p>}
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="mt-4 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    رابط خارجي (اختياري)
                  </label>
                  <input
                    type="url"
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-left font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-gray-900 placeholder:font-bold"
                    placeholder="https://zoom.us/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيفتح هذا الرابط عند الضغط على البانر
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    يظهر للباقات التالية:
                  </label>
                  <div className="flex gap-4 justify-end flex-wrap">
                    {['free', 'basic', 'premium'].map((tier) => (
                      <label key={tier} className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all">
                        <span className="text-sm font-medium text-gray-800">
                          {tier === 'free' ? 'مجاني' : tier === 'basic' ? 'أساسي' : 'مميز'}
                        </span>
                        <input
                          type="checkbox"
                          checked={formData.target_subscriptions.includes(tier)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, target_subscriptions: [...formData.target_subscriptions, tier] });
                            } else {
                              setFormData({ ...formData, target_subscriptions: formData.target_subscriptions.filter(t => t !== tier) });
                            }
                          }}
                          className="w-6 h-6 text-indigo-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    وقت بدء الحدث (اختياري)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_start_time}
                    onChange={(e) => setFormData({ ...formData, event_start_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    إذا تم تحديد وقت، سيظهر عد تنازلي للطلاب
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 text-right">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    min="0"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 bg-gray-50 px-4 py-3 rounded-xl">
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-800">
                    مفعّل
                  </label>
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-6 h-6 text-indigo-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBanner(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-bold transition-all transform hover:scale-105 shadow-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'جاري الحفظ...' : editingBanner ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
