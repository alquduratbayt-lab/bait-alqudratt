'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  points_required: number;
  is_active: boolean;
  stock_quantity: number | null;
  order_number: number;
  created_at: string;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    points_required: 0,
    is_active: true,
    stock_quantity: null as number | null,
    order_number: 0,
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('order_number');

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      alert('حدث خطأ أثناء جلب الجوائز');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rewards')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('rewards')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(formData)
          .eq('id', editingReward.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert([formData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingReward(null);
      fetchRewards();
      alert(editingReward ? 'تم تحديث الجائزة بنجاح!' : 'تم إضافة الجائزة بنجاح!');
    } catch (error) {
      console.error('Error saving reward:', error);
      alert('حدث خطأ أثناء حفظ الجائزة');
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description || '',
      image_url: reward.image_url,
      points_required: reward.points_required,
      is_active: reward.is_active,
      stock_quantity: reward.stock_quantity,
      order_number: reward.order_number,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجائزة؟')) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      alert('حدث خطأ أثناء حذف الجائزة');
    }
  };

  const toggleActive = async (reward: Reward) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !reward.is_active })
        .eq('id', reward.id);

      if (error) throw error;
      fetchRewards();
    } catch (error) {
      console.error('Error toggling reward:', error);
      alert('حدث خطأ أثناء تحديث حالة الجائزة');
    }
  };

  return (
    <DashboardLayout title="إدارة الجوائز">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">إدارة الجوائز</h1>
          <button
            onClick={() => {
              setEditingReward(null);
              setFormData({
                title: '',
                description: '',
                image_url: '',
                points_required: 0,
                is_active: true,
                stock_quantity: null,
                order_number: rewards.length,
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + إضافة جائزة جديدة
          </button>
        </div>

        {loading && !showModal ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                  {reward.image_url ? (
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      لا توجد صورة
                    </div>
                  )}
                  {!reward.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">غير نشط</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{reward.title}</h3>
                  {reward.description && (
                    <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-blue-600 font-bold text-lg">
                      {reward.points_required} نقطة
                    </span>
                    {reward.stock_quantity !== null && (
                      <span className="text-gray-600 text-sm">
                        الكمية: {reward.stock_quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(reward)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => toggleActive(reward)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        reward.is_active
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {reward.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-slideUp">
              <div className="p-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8 text-right">
                  {editingReward ? 'تعديل الجائزة' : 'إضافة جائزة جديدة'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">عنوان الجائزة *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold text-right placeholder:text-gray-900 placeholder:font-bold"
                      placeholder="مثال: خصم 10% على الاشتراك"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">الوصف</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold text-right placeholder:text-gray-900 placeholder:font-bold"
                      rows={3}
                      placeholder="وصف تفصيلي للجائزة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">صورة الجائزة</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-medium"
                    />
                    {uploading && <p className="text-blue-600 font-medium text-sm mt-2">جاري رفع الصورة...</p>}
                    {formData.image_url && (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="max-w-xs h-40 object-contain rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">النقاط المطلوبة *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.points_required}
                      onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold text-right placeholder:text-gray-900 placeholder:font-bold"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">الكمية المتاحة (اختياري)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold text-right placeholder:text-gray-900 placeholder:font-bold"
                      placeholder="اتركه فارغاً إذا كانت الكمية غير محدودة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-right">ترتيب العرض</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.order_number}
                      onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold text-right"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 bg-gray-50 px-4 py-3 rounded-xl">
                    <label htmlFor="is_active" className="text-sm font-bold text-gray-800">
                      جائزة نشطة
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
                        setEditingReward(null);
                      }}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-bold transition-all transform hover:scale-105 shadow-md"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold transition-all transform hover:scale-105 shadow-lg"
                    >
                      {editingReward ? 'تحديث' : 'إضافة'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
