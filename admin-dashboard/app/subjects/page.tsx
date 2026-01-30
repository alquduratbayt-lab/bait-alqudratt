'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

interface Subject {
  id: string;
  name: string;
  type: string;
  description?: string;
  passing_percentage: number;
  lessons_count: number;
  duration: number;
  created_at: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ id: null as string | null, name: '', type: '', description: '', passing_percentage: 80, icon_file: null as File | null });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubject = async () => {
    if (!newSubject.name || !newSubject.type) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      let iconUrl = null;

      // رفع الأيقونة إذا كانت موجودة
      if (newSubject.icon_file) {
        const fileName = `icons/${Date.now()}_${newSubject.icon_file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, newSubject.icon_file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        iconUrl = publicUrl;
      }

      if (isEditing && newSubject.id) {
        // تحديث المادة الموجودة
        const updateData: any = {
          name: newSubject.name,
          type: newSubject.type,
          description: newSubject.description,
          passing_percentage: newSubject.passing_percentage,
        };
        if (iconUrl) updateData.icon_url = iconUrl;

        const { error } = await supabase
          .from('subjects')
          .update(updateData)
          .eq('id', newSubject.id);

        if (error) throw error;
        
        setSubjects(subjects.map(s => s.id === newSubject.id ? { ...s, ...updateData } : s));
        alert('تم تحديث المنهج بنجاح!');
      } else {
        // إضافة مادة جديدة
        const { data, error } = await supabase
          .from('subjects')
          .insert([{
            name: newSubject.name,
            type: newSubject.type,
            description: newSubject.description,
            passing_percentage: newSubject.passing_percentage,
            icon_url: iconUrl,
            lessons_count: 0,
            duration: 0
          }])
          .select();

        if (error) throw error;
        
        setSubjects([...data, ...subjects]);
        alert('تم إضافة المنهج بنجاح!');
      }

      setShowAddModal(false);
      setIsEditing(false);
      setNewSubject({ id: null, name: '', type: '', description: '', passing_percentage: 80, icon_file: null });
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('حدث خطأ أثناء حفظ المنهج');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubjects(subjects.filter(s => s.id !== id));
      alert('تم حذف المادة بنجاح!');
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('حدث خطأ أثناء حذف المادة');
    }
  };

  return (
    <DashboardLayout title="المواد الدراسية">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">المواد الدراسية</h1>
              <p className="text-gray-600">إدارة وتنظيم جميع المواد الدراسية في النظام</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setNewSubject({ id: null, name: '', type: '', description: '', passing_percentage: 80, icon_file: null });
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة مادة جديدة
              </button>
              <button 
                onClick={fetchSubjects}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-indigo-200 rounded-xl text-indigo-700 font-semibold hover:bg-white hover:border-indigo-300 transition-all"
              >
                تحديث
              </button>
            </div>
          </div>

          {/* بطاقات المواد */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">جاري التحميل...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl">
              <p className="text-gray-600 text-lg">لا توجد مواد دراسية</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-right">{subject.name}</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{subject.type}</span>
                    <span className="text-gray-500">مادة دراسية البرنامج</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-gray-600">{subject.lessons_count} درس</span>
                    </div>
                    <span className="text-gray-500">عدد الدروس</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">{subject.duration} ساعة</span>
                    </div>
                    <span className="text-gray-500">المدة الزمنية</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => router.push(`/subjects/${subject.id}/lessons`)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all text-sm"
                  >
                    إضافة دروس
                  </button>
                  <button 
                    onClick={() => {
                      setNewSubject({ 
                        id: subject.id,
                        name: subject.name, 
                        type: subject.type, 
                        description: subject.description || '',
                        passing_percentage: subject.passing_percentage || 80,
                        icon_file: null 
                      });
                      setIsEditing(true);
                      setShowAddModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all text-sm"
                  >
                    تعديل
                  </button>
                  <button 
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all text-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}

        </div>
      </div>

      {/* Modal إضافة مادة */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowAddModal(false)}>
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-white/20 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 text-right">{isEditing ? 'تعديل المنهج' : 'إضافة منهج جديد'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 text-right">اسم المنهج</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900 font-bold placeholder:text-gray-900 placeholder:font-bold text-right"
                  placeholder="مثال: الكمي"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 text-right">النوع (يظهر في الواجهة)</label>
                <input
                  type="text"
                  value={newSubject.type}
                  onChange={(e) => setNewSubject({...newSubject, type: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="مثال: الكمي"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 text-right">الوصف</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="وصف المنهج..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 text-right">نسبة النجاح المطلوبة (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newSubject.passing_percentage}
                  onChange={(e) => setNewSubject({...newSubject, passing_percentage: parseInt(e.target.value) || 80})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  placeholder="80"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">النسبة المطلوبة للنجاح في الامتحان النهائي</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 text-right">أيقونة المادة</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewSubject({...newSubject, icon_file: e.target.files[0]});
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">تظهر في الصفحة الرئيسية للتطبيق</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-bold transition-all transform hover:scale-105 shadow-md"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSubject}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                {isEditing ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
