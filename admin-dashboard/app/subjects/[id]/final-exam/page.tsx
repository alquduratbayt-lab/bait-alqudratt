'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import RichTextEditor from '@/components/RichTextEditor';

interface Question {
  id?: string;
  question_text: string;
  question_image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  order_index: number;
  source_type: string;
  source_id?: string;
}

interface SourceQuestion {
  id: string;
  question_text: string;
  question_image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  lesson_title?: string;
  source_type: 'video_question' | 'lesson_exam';
}

export default function FinalExamPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subjectName, setSubjectName] = useState('');
  const [examId, setExamId] = useState<string | null>(null);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جميع الأسئلة المتاحة للاختيار
  const [allQuestions, setAllQuestions] = useState<SourceQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // أسئلة يدوية مضافة
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState<Question & { question_image_file?: File }>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    order_index: 0,
    source_type: 'custom'
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // فلترة
  const [filterType, setFilterType] = useState<'all' | 'video' | 'exam'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      // جلب اسم المادة
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', subjectId)
        .single();
      
      if (subjectData) setSubjectName(subjectData.name);

      // جلب جميع الأسئلة المتاحة أولاً
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('subject_id', subjectId);

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        const allQs: SourceQuestion[] = [];
        
        // أسئلة الفيديو
        const { data: vQuestions } = await supabase
          .from('questions')
          .select('*')
          .in('lesson_id', lessonIds);

        if (vQuestions) {
          vQuestions.forEach(q => {
            const lesson = lessons.find(l => l.id === q.lesson_id);
            allQs.push({ ...q, lesson_title: lesson?.title || '', source_type: 'video_question' });
          });
        }

        // أسئلة امتحان الدرس
        const { data: eQuestions } = await supabase
          .from('exam_questions')
          .select('*')
          .in('lesson_id', lessonIds);

        if (eQuestions) {
          eQuestions.forEach(q => {
            const lesson = lessons.find(l => l.id === q.lesson_id);
            allQs.push({ ...q, lesson_title: lesson?.title || '', source_type: 'lesson_exam' });
          });
        }
        
        setAllQuestions(allQs);
      }

      // جلب الامتحان النهائي إذا كان موجوداً
      const { data: examData } = await supabase
        .from('subject_final_exams')
        .select('*')
        .eq('subject_id', subjectId)
        .single();
      
      if (examData) {
        setExamId(examData.id);
        setPassingPercentage(examData.passing_percentage);
        setIsActive(examData.is_active);

        // جلب أسئلة الامتحان المحفوظة
        const { data: savedQuestions } = await supabase
          .from('subject_final_exam_questions')
          .select('*')
          .eq('exam_id', examData.id)
          .order('order_index');

        if (savedQuestions && savedQuestions.length > 0) {
          // تحديد الأسئلة المختارة
          const ids = new Set<string>();
          const customs: Question[] = [];
          
          savedQuestions.forEach(q => {
            if (q.source_type === 'custom') {
              customs.push(q);
            } else if (q.source_id) {
              ids.add(`${q.source_type}_${q.source_id}`);
            }
          });
          
          setSelectedIds(ids);
          setCustomQuestions(customs);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (q: SourceQuestion) => {
    const key = `${q.source_type}_${q.id}`;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredQuestions();
    const newSelected = new Set(selectedIds);
    filtered.forEach(q => newSelected.add(`${q.source_type}_${q.id}`));
    setSelectedIds(newSelected);
  };

  const deselectAll = () => {
    const filtered = getFilteredQuestions();
    const newSelected = new Set(selectedIds);
    filtered.forEach(q => newSelected.delete(`${q.source_type}_${q.id}`));
    setSelectedIds(newSelected);
  };

  const addCustomQuestion = async () => {
    if (!newCustomQuestion.question_text && !newCustomQuestion.question_image_file && !newCustomQuestion.option_a) {
      alert('يرجى إدخال نص السؤال أو صورة والخيارات');
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = newCustomQuestion.question_image_url || null;

      // رفع الصورة إذا وجدت
      if (newCustomQuestion.question_image_file) {
        const fileName = `final-exam-questions/${Date.now()}_${newCustomQuestion.question_image_file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, newCustomQuestion.question_image_file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('حدث خطأ في رفع الصورة');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      setCustomQuestions([...customQuestions, { 
        ...newCustomQuestion, 
        question_image_url: imageUrl || undefined,
        order_index: customQuestions.length 
      }]);
      
      setNewCustomQuestion({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        order_index: 0,
        source_type: 'custom'
      });
      setShowAddCustom(false);
    } catch (error) {
      console.error('Error adding question:', error);
      alert('حدث خطأ في إضافة السؤال');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const getFilteredQuestions = () => {
    return allQuestions.filter(q => {
      const matchesType = filterType === 'all' || 
        (filterType === 'video' && q.source_type === 'video_question') ||
        (filterType === 'exam' && q.source_type === 'lesson_exam');
      
      const matchesSearch = !searchTerm || 
        q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.lesson_title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  };

  const getTotalSelectedCount = () => {
    return selectedIds.size + customQuestions.length;
  };

  const saveExam = async () => {
    if (selectedIds.size === 0 && customQuestions.length === 0) {
      alert('يجب اختيار سؤال واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      let currentExamId = examId;

      // إنشاء أو تحديث الامتحان
      if (!examId) {
        const { data: newExam, error: examError } = await supabase
          .from('subject_final_exams')
          .insert({
            subject_id: subjectId,
            passing_percentage: passingPercentage,
            is_active: isActive
          })
          .select()
          .single();

        if (examError) throw examError;
        currentExamId = newExam.id;
        setExamId(newExam.id);
      } else {
        const { error: updateError } = await supabase
          .from('subject_final_exams')
          .update({
            passing_percentage: passingPercentage,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', examId);

        if (updateError) throw updateError;
      }

      // حذف الأسئلة القديمة
      if (currentExamId) {
        await supabase
          .from('subject_final_exam_questions')
          .delete()
          .eq('exam_id', currentExamId);

        // تجميع الأسئلة المختارة
        const questionsToInsert: any[] = [];
        let orderIndex = 0;

        // إضافة الأسئلة المختارة من المصادر
        selectedIds.forEach(key => {
          // الـ key بصيغة: video_question_UUID أو lesson_exam_UUID
          // نستخرج الـ source_type والـ source_id بشكل صحيح
          let sourceType: string;
          let sourceId: string;
          
          if (key.startsWith('video_question_')) {
            sourceType = 'video_question';
            sourceId = key.replace('video_question_', '');
          } else if (key.startsWith('lesson_exam_')) {
            sourceType = 'lesson_exam';
            sourceId = key.replace('lesson_exam_', '');
          } else {
            // fallback للتوافق مع الصيغة القديمة
            const parts = key.split('_');
            sourceType = parts[0];
            sourceId = parts.slice(1).join('_');
          }
          
          const q = allQuestions.find(aq => aq.id === sourceId && aq.source_type === sourceType);
          if (q) {
            questionsToInsert.push({
              exam_id: currentExamId,
              question_text: q.question_text || '',
              question_image_url: q.question_image_url || null,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_answer: q.correct_answer,
              order_index: orderIndex++,
              source_type: q.source_type,
              source_id: q.id
            });
          }
        });

        // إضافة الأسئلة اليدوية
        customQuestions.forEach(q => {
          questionsToInsert.push({
            exam_id: currentExamId,
            question_text: q.question_text || '',
            question_image_url: q.question_image_url || null,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer,
            order_index: orderIndex++,
            source_type: 'custom',
            source_id: null
          });
        });

        if (questionsToInsert.length > 0) {
          const { error: questionsError } = await supabase
            .from('subject_final_exam_questions')
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      alert('تم حفظ الامتحان بنجاح!');
    } catch (error: any) {
      console.error('Error saving exam:', error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="الامتحان النهائي">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`الامتحان النهائي - ${subjectName}`}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push(`/subjects/${subjectId}/lessons`)} className="p-2 hover:bg-white/50 rounded-lg transition-all">
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">الامتحان النهائي</h1>
                <p className="text-gray-600">{subjectName}</p>
              </div>
            </div>
            <button
              onClick={saveExam}
              disabled={saving}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الامتحان'}
            </button>
          </div>

          {/* إعدادات الامتحان */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-right">إعدادات الامتحان</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 text-right">نسبة النجاح (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right text-gray-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="flex items-center justify-end gap-4">
                <label className="text-sm font-bold text-gray-700">تفعيل الامتحان</label>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isActive ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ملخص الاختيار */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={selectAll} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold">
                  تحديد الكل
                </button>
                <button onClick={deselectAll} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold">
                  إلغاء الكل
                </button>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{getTotalSelectedCount()} سؤال</p>
                <p className="text-sm opacity-80">تم اختيارهم للامتحان</p>
              </div>
            </div>
          </div>

          {/* فلترة وبحث */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  الكل ({allQuestions.length})
                </button>
                <button
                  onClick={() => setFilterType('video')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === 'video' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  📹 أسئلة الفيديو ({allQuestions.filter(q => q.source_type === 'video_question').length})
                </button>
                <button
                  onClick={() => setFilterType('exam')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === 'exam' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  📝 امتحانات الدروس ({allQuestions.filter(q => q.source_type === 'lesson_exam').length})
                </button>
              </div>
              <input
                type="text"
                placeholder="بحث في الأسئلة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl text-right text-gray-900 focus:border-indigo-500 w-64"
              />
            </div>
          </div>

          {/* قائمة الأسئلة مع Checkboxes */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="max-h-96 overflow-y-auto">
              {getFilteredQuestions().length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  لا توجد أسئلة متاحة
                </div>
              ) : (
                getFilteredQuestions().map((q) => {
                  const key = `${q.source_type}_${q.id}`;
                  const isSelected = selectedIds.has(key);
                  return (
                    <div
                      key={key}
                      onClick={() => toggleQuestion(q)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-indigo-50 ${isSelected ? 'bg-indigo-100' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${q.source_type === 'video_question' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {q.source_type === 'video_question' ? '📹 فيديو' : '📝 امتحان'}
                            </span>
                            <span className="text-xs text-gray-500">📚 {q.lesson_title}</span>
                          </div>
                          <p className="text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: q.question_text || '(سؤال بالصورة)' }} />
                          {q.question_image_url && (
                            <img src={q.question_image_url} alt="" className="mt-2 max-h-16 rounded" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* أسئلة يدوية */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowAddCustom(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة سؤال يدوي
              </button>
              <h3 className="text-lg font-bold text-gray-800">✏️ أسئلة يدوية ({customQuestions.length})</h3>
            </div>

            {customQuestions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لم تضف أي أسئلة يدوية بعد</p>
            ) : (
              <div className="space-y-3">
                {customQuestions.map((q, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
                    <button
                      onClick={() => removeCustomQuestion(index)}
                      className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="flex-1 text-right">
                      {q.question_image_url && (
                        <img src={q.question_image_url} alt="صورة السؤال" className="max-h-24 rounded-lg mb-2 mr-auto" />
                      )}
                      <p className="text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: q.question_text || '(سؤال بالصورة)' }} />
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>الإجابة: <span className="font-bold text-green-600">{q.correct_answer}</span></span>
                        <span>A: {q.option_a}</span>
                        <span>B: {q.option_b}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ملخص جميع الأسئلة المختارة */}
          {(selectedIds.size > 0 || customQuestions.length > 0) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-right flex items-center justify-end gap-2">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                  {getTotalSelectedCount()} سؤال
                </span>
                📋 ملخص أسئلة الامتحان
              </h3>
              
              <div className="space-y-4">
                {/* الأسئلة المختارة من المصادر */}
                {Array.from(selectedIds).map((key, index) => {
                  const q = allQuestions.find(aq => `${aq.source_type}_${aq.id}` === key);
                  if (!q) return null;
                  return (
                    <div key={key} className="border-2 border-gray-200 rounded-xl p-5 bg-gray-50">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <span className={`text-sm px-3 py-1 rounded-full flex-shrink-0 font-semibold ${q.source_type === 'video_question' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {q.source_type === 'video_question' ? '📹 فيديو' : '📝 امتحان'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 font-medium">📚 {q.lesson_title}</span>
                          <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      
                      {/* نص السؤال والصورة */}
                      <div className="text-right mb-4">
                        {q.question_image_url && (
                          <img src={q.question_image_url} alt="صورة السؤال" className="max-h-40 rounded-lg mb-3 mr-auto" />
                        )}
                        <p className="text-gray-900 font-semibold text-lg" dangerouslySetInnerHTML={{ __html: q.question_text || '(سؤال بالصورة)' }} />
                      </div>
                      
                      {/* الخيارات */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'A' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                          <span className="font-bold text-gray-800 text-base">A:</span> <span className="text-gray-900 text-base">{q.option_a}</span>
                          {q.correct_answer === 'A' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                        </div>
                        <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'B' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                          <span className="font-bold text-gray-800 text-base">B:</span> <span className="text-gray-900 text-base">{q.option_b}</span>
                          {q.correct_answer === 'B' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                        </div>
                        <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'C' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                          <span className="font-bold text-gray-800 text-base">C:</span> <span className="text-gray-900 text-base">{q.option_c}</span>
                          {q.correct_answer === 'C' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                        </div>
                        <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'D' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                          <span className="font-bold text-gray-800 text-base">D:</span> <span className="text-gray-900 text-base">{q.option_d}</span>
                          {q.correct_answer === 'D' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* الأسئلة اليدوية */}
                {customQuestions.map((q, index) => (
                  <div key={`custom-${index}`} className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex-shrink-0 font-semibold">
                        ✏️ يدوي
                      </span>
                      <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {selectedIds.size + index + 1}
                      </span>
                    </div>
                    
                    {/* نص السؤال والصورة */}
                    <div className="text-right mb-3">
                      {q.question_image_url && (
                        <img src={q.question_image_url} alt="صورة السؤال" className="max-h-32 rounded-lg mb-2 mr-auto" />
                      )}
                      <p className="text-gray-900 font-semibold text-lg" dangerouslySetInnerHTML={{ __html: q.question_text || '(سؤال بالصورة)' }} />
                    </div>
                    
                    {/* الخيارات */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'A' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                        <span className="font-bold text-gray-800 text-base">A:</span> <span className="text-gray-900 text-base">{q.option_a}</span>
                        {q.correct_answer === 'A' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                      </div>
                      <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'B' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                        <span className="font-bold text-gray-800 text-base">B:</span> <span className="text-gray-900 text-base">{q.option_b}</span>
                        {q.correct_answer === 'B' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                      </div>
                      <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'C' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                        <span className="font-bold text-gray-800 text-base">C:</span> <span className="text-gray-900 text-base">{q.option_c}</span>
                        {q.correct_answer === 'C' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                      </div>
                      <div className={`p-3 rounded-lg text-right ${q.correct_answer === 'D' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                        <span className="font-bold text-gray-800 text-base">D:</span> <span className="text-gray-900 text-base">{q.option_d}</span>
                        {q.correct_answer === 'D' && <span className="text-green-600 mr-2 font-bold">✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal إضافة سؤال يدوي */}
      {showAddCustom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => !uploadingImage && setShowAddCustom(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => !uploadingImage && setShowAddCustom(false)} className="text-gray-500 hover:text-gray-700" disabled={uploadingImage}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-800">إضافة سؤال يدوي</h2>
            </div>

            <div className="space-y-6">
              {/* نص السؤال مع محرر نص غني */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 text-right">نص السؤال (اختياري إذا رفعت صورة)</label>
                <RichTextEditor
                  value={newCustomQuestion.question_text}
                  onChange={(content) => setNewCustomQuestion({...newCustomQuestion, question_text: content})}
                  placeholder="اكتب نص السؤال هنا... يمكنك نسخ من Word"
                  height={150}
                />
              </div>

              {/* رفع صورة السؤال */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 text-right">صورة السؤال (اختياري)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const maxSize = 5 * 1024 * 1024;
                        if (file.size > maxSize) {
                          alert('حجم الصورة كبير جداً! الحد الأقصى 5MB');
                          e.target.value = '';
                          return;
                        }
                        setNewCustomQuestion({...newCustomQuestion, question_image_file: file});
                      }
                    }}
                    className="hidden"
                    id="question-image-upload"
                  />
                  <label htmlFor="question-image-upload" className="cursor-pointer">
                    {newCustomQuestion.question_image_file ? (
                      <div className="space-y-2">
                        <img 
                          src={URL.createObjectURL(newCustomQuestion.question_image_file)} 
                          alt="معاينة" 
                          className="max-h-40 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-green-600 font-semibold">✓ تم اختيار الصورة</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewCustomQuestion({...newCustomQuestion, question_image_file: undefined});
                          }}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          إزالة الصورة
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">اضغط لرفع صورة السؤال</p>
                        <p className="text-xs text-gray-400">PNG, JPG حتى 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* الخيارات */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1 text-right">الخيار A</label>
                  <input
                    type="text"
                    value={newCustomQuestion.option_a}
                    onChange={(e) => setNewCustomQuestion({...newCustomQuestion, option_a: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="أدخل الخيار الأول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1 text-right">الخيار B</label>
                  <input
                    type="text"
                    value={newCustomQuestion.option_b}
                    onChange={(e) => setNewCustomQuestion({...newCustomQuestion, option_b: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="أدخل الخيار الثاني"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1 text-right">الخيار C</label>
                  <input
                    type="text"
                    value={newCustomQuestion.option_c}
                    onChange={(e) => setNewCustomQuestion({...newCustomQuestion, option_c: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="أدخل الخيار الثالث"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1 text-right">الخيار D</label>
                  <input
                    type="text"
                    value={newCustomQuestion.option_d}
                    onChange={(e) => setNewCustomQuestion({...newCustomQuestion, option_d: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-right text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="أدخل الخيار الرابع"
                  />
                </div>
              </div>

              {/* الإجابة الصحيحة */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 text-right">الإجابة الصحيحة</label>
                <div className="flex gap-4 justify-end">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNewCustomQuestion({...newCustomQuestion, correct_answer: option})}
                      className={`w-14 h-14 rounded-xl font-bold text-lg transition-all ${
                        newCustomQuestion.correct_answer === option
                          ? 'bg-green-500 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* زر الإضافة */}
              <button
                onClick={addCustomQuestion}
                disabled={uploadingImage}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري رفع الصورة...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة السؤال
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
