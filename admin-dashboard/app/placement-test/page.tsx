'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import RichTextEditor from '@/components/RichTextEditor';

interface Question {
  id?: string;
  question_text: string;
  equation_latex?: string;
  equation_image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  type: 'quantitative' | 'verbal';
  order_index: number;
}

export default function PlacementTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quantitative' | 'verbal'>('quantitative');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('placement_test_questions')
        .select('*')
        .order('type')
        .order('order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      type: activeTab,
      order_index: questions.filter(q => q.type === activeTab).length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const saveQuestions = async () => {
    setLoading(true);
    try {
      // حذف جميع الأسئلة القديمة
      await supabase
        .from('placement_test_questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // إدراج الأسئلة الجديدة
      const questionsToInsert = questions.map((q, index) => ({
        question_text: q.question_text,
        equation_latex: q.equation_latex || null,
        equation_image_url: q.equation_image_url || null,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        type: q.type,
        order_index: index,
      }));

      const { error } = await supabase
        .from('placement_test_questions')
        .insert(questionsToInsert);

      if (error) throw error;

      alert('تم حفظ الأسئلة بنجاح!');
      fetchQuestions();
    } catch (error: any) {
      console.error('Error saving questions:', error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => q.type === activeTab);

  return (
    <DashboardLayout title="امتحان تحديد المستوى">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              امتحان تحديد المستوى
            </h1>
            <p className="text-gray-600">إضافة وإدارة أسئلة امتحان تحديد المستوى للطلاب الجدد</p>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6 border border-gray-100">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('quantitative')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  activeTab === 'quantitative'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 القسم الكمي ({questions.filter(q => q.type === 'quantitative').length})
              </button>
              <button
                onClick={() => setActiveTab('verbal')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  activeTab === 'verbal'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📝 القسم اللفظي ({questions.filter(q => q.type === 'verbal').length})
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <button
                onClick={addQuestion}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                ➕ إضافة سؤال {activeTab === 'quantitative' ? 'كمي' : 'لفظي'}
              </button>
              <button
                onClick={saveQuestions}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50"
              >
                {loading ? '⏳ جاري الحفظ...' : '💾 حفظ جميع الأسئلة'}
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => {
                const actualIndex = questions.findIndex(q => q === question);
                return (
                  <div key={actualIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => removeQuestion(actualIndex)}
                        className="text-red-500 hover:text-red-700 font-semibold"
                      >
                        🗑️ حذف
                      </button>
                      <h4 className="font-bold text-gray-700">
                        السؤال {index + 1} - {activeTab === 'quantitative' ? '📊 كمي' : '📝 لفظي'}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                          نص السؤال
                        </label>
                        <RichTextEditor
                          value={question.question_text}
                          onChange={(content) => updateQuestion(actualIndex, 'question_text', content)}
                          placeholder="اكتب السؤال هنا..."
                          height={200}
                        />
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={question.option_a}
                          onChange={(e) => updateQuestion(actualIndex, 'option_a', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold"
                          placeholder="الخيار A"
                        />
                        <input
                          type="text"
                          value={question.option_b}
                          onChange={(e) => updateQuestion(actualIndex, 'option_b', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold"
                          placeholder="الخيار B"
                        />
                        <input
                          type="text"
                          value={question.option_c}
                          onChange={(e) => updateQuestion(actualIndex, 'option_c', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold"
                          placeholder="الخيار C"
                        />
                        <input
                          type="text"
                          value={question.option_d}
                          onChange={(e) => updateQuestion(actualIndex, 'option_d', e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold"
                          placeholder="الخيار D"
                        />
                      </div>

                      {/* Correct Answer */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1 text-right">الإجابة الصحيحة</label>
                        <select
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(actualIndex, 'correct_answer', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-bold"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">لا توجد أسئلة {activeTab === 'quantitative' ? 'كمية' : 'لفظية'} حالياً</p>
                  <p className="text-sm mt-2">اضغط "إضافة سؤال" لإضافة سؤال جديد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
