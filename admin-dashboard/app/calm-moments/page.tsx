'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface CalmMoment {
  id: string;
  type: 'verse' | 'dua' | 'azkar' | 'video';
  title: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  video_file?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export default function CalmMomentsPage() {
  const router = useRouter();
  const [moments, setMoments] = useState<CalmMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMoment, setEditingMoment] = useState<CalmMoment | null>(null);
  const [formData, setFormData] = useState({
    type: 'verse' as 'verse' | 'dua' | 'azkar' | 'video',
    title: '',
    content: '',
    video_url: '',
    order_index: 0,
    image_file: null as File | null,
    video_file: null as File | null,
  });

  useEffect(() => {
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    try {
      const { data, error } = await supabase
        .from('calm_moments')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setMoments(data || []);
    } catch (error) {
      console.error('Error fetching calm moments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('الرجاء إدخال العنوان');
      return;
    }

    try {
      let imageUrl = editingMoment?.image_url || null;
      let videoFileUrl = editingMoment?.video_file || null;

      // رفع الصورة
      if (formData.image_file) {
        const fileName = `calm-moments/${Date.now()}_${formData.image_file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, formData.image_file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      // رفع الفيديو
      if (formData.video_file) {
        const fileName = `calm-moments/${Date.now()}_${formData.video_file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, formData.video_file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        videoFileUrl = publicUrl;
      }

      const momentData = {
        type: formData.type,
        title: formData.title,
        content: formData.content || null,
        image_url: imageUrl,
        video_url: formData.video_url || null,
        video_file: videoFileUrl,
        order_index: formData.order_index,
        is_active: true,
      };

      if (editingMoment) {
        // تحديث
        const { error } = await supabase
          .from('calm_moments')
          .update(momentData)
          .eq('id', editingMoment.id);

        if (error) throw error;
        alert('تم التحديث بنجاح!');
      } else {
        // إضافة جديد
        const { error } = await supabase
          .from('calm_moments')
          .insert([momentData]);

        if (error) throw error;
        alert('تم الإضافة بنجاح!');
      }

      setShowAddModal(false);
      setEditingMoment(null);
      resetForm();
      fetchMoments();
    } catch (error) {
      console.error('Error saving calm moment:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;

    try {
      const { error } = await supabase
        .from('calm_moments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('تم الحذف بنجاح!');
      fetchMoments();
    } catch (error) {
      console.error('Error deleting calm moment:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleEdit = (moment: CalmMoment) => {
    setEditingMoment(moment);
    setFormData({
      type: moment.type,
      title: moment.title,
      content: moment.content || '',
      video_url: moment.video_url || '',
      order_index: moment.order_index,
      image_file: null,
      video_file: null,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'verse',
      title: '',
      content: '',
      video_url: '',
      order_index: 0,
      image_file: null,
      video_file: null,
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      verse: 'آية',
      dua: 'دعاء',
      azkar: 'أذكار',
      video: 'فيديو',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="لحظات الهدوء">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">لحظات الهدوء</h1>
              <p className="text-gray-600">إدارة المحتوى الروحاني والتحفيزي</p>
            </div>
            <button
              onClick={() => {
                setEditingMoment(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة محتوى جديد
            </button>
          </div>

        {/* Cards Grid */}
        <div className="grid gap-6">
          {moments.map((moment) => (
            <div key={moment.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                        moment.type === 'verse' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                        moment.type === 'dua' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700' :
                        moment.type === 'azkar' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' :
                        'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700'
                      }`}>
                        {getTypeLabel(moment.type)}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-800">{moment.title}</h3>
                    </div>
                    {moment.content && (
                      <p className="text-gray-600 mt-3 leading-relaxed whitespace-pre-line">{moment.content}</p>
                    )}
                    {moment.video_url && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">رابط الفيديو متوفر</span>
                      </div>
                    )}
                    {moment.image_url && (
                      <img src={moment.image_url} alt={moment.title} className="mt-4 w-40 h-40 object-cover rounded-xl shadow-md" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(moment)}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(moment.id)}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {editingMoment ? 'تعديل المحتوى' : 'إضافة محتوى جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMoment(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">النوع</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold"
                  >
                    <option value="verse">آية</option>
                    <option value="dua">دعاء</option>
                    <option value="azkar">أذكار</option>
                    <option value="video">فيديو</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">العنوان</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold placeholder:text-gray-900 placeholder:font-bold"
                    placeholder="مثال: آية اليوم"
                  />
                </div>

                {formData.type !== 'video' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">المحتوى</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all h-40 resize-none text-gray-900 font-bold placeholder:text-gray-900 placeholder:font-bold"
                      placeholder="النص الكامل..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">رفع صورة</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image_file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-100"
                  />
                </div>

                {formData.type === 'video' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">رابط الفيديو (يوتيوب)</label>
                      <input
                        type="text"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                        placeholder="https://youtube.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">أو رفع ملف فيديو</label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setFormData({ ...formData, video_file: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">الترتيب</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMoment(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-bold transition-all transform hover:scale-105 shadow-md"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  {editingMoment ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}
