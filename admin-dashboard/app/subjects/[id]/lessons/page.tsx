'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateQuestionVariants, saveQuestionVariants, generateFinalExam } from '@/lib/generateQuestionVariants';
import DashboardLayout from '@/components/DashboardLayout';
import RichTextEditor from '@/components/RichTextEditor';
import MathEditor from '@/components/MathEditor';
import { latexToImage } from '@/lib/latexToImage';
import { uploadToCloudflareStream } from '@/lib/cloudflare';
import VideoPreviewModal from './VideoPreviewModal';

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  video_file: string | null;
  is_free: boolean;
  created_at?: string;
}

interface Question {
  question_text: string;
  question_image_url?: string;
  question_image_file?: File | null;
  equation_latex?: string;
  equation_image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  show_at_time: number;
}

export default function LessonsPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subjectName, setSubjectName] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState({
    id: null as string | null,
    title: '',
    video_url: '',
    video_file: null as File | null,
    is_free: false,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [selectedQuestionForVariants, setSelectedQuestionForVariants] = useState<string | null>(null);
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [currentMathField, setCurrentMathField] = useState<{ type: 'question' | 'exam', index: number, field: string } | null>(null);
  const [tempLatex, setTempLatex] = useState('');
  const [showExamModal, setShowExamModal] = useState(false);
  const [examQuestionsCount, setExamQuestionsCount] = useState(10);
  const [showGenerateVariantsModal, setShowGenerateVariantsModal] = useState(false);
  const [variantsCount, setVariantsCount] = useState(3);
  const [showGenerateExamQuestionsModal, setShowGenerateExamQuestionsModal] = useState(false);
  const [examQuestionsSource, setExamQuestionsSource] = useState<'current' | 'all'>('current');
  const [autoExamQuestionsCount, setAutoExamQuestionsCount] = useState(5);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'exam'>('info');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [expandedExamQuestion, setExpandedExamQuestion] = useState<number | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  
  // Question Bank States
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [questionVariants, setQuestionVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  // Video Preview States
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  
  // Video Upload Progress States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSubject();
    fetchLessons();
  }, []);

  const fetchSubject = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single();
    
    if (data) setSubjectName(data.name);
  };

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at');
    
    if (data) setLessons(data);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_image_url: '',
      question_image_file: null,
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      show_at_time: 0,
    }]);
  };

  const addExamQuestion = () => {
    setExamQuestions([...examQuestions, {
      question_text: '',
      question_image_url: '',
      question_image_file: null,
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      show_at_time: 0,
    }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateExamQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...examQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setExamQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const removeExamQuestion = (index: number) => {
    setExamQuestions(examQuestions.filter((_, i) => i !== index));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // إزالة حد الحجم - Cloudflare Stream يدعم فيديوهات كبيرة
      setCurrentLesson({ ...currentLesson, video_file: file });
    }
  };

  const handleGenerateVariants = async (questionId: string) => {
    setGeneratingVariants(true);
    setSelectedQuestionForVariants(questionId);
    
    try {
      const { data: questionData, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (error) throw error;
      
      const question = {
        question_text: questionData.question_text,
        options: [questionData.option_a, questionData.option_b, questionData.option_c, questionData.option_d],
        correct_answer: questionData.correct_answer === 'A' ? 0 : questionData.correct_answer === 'B' ? 1 : questionData.correct_answer === 'C' ? 2 : 3
      };
      
      const variants = await generateQuestionVariants(question, 3);
      setGeneratedVariants(variants);
      setShowVariantsModal(true);
    } catch (error) {
      console.error('Error generating variants:', error);
      alert('حدث خطأ أثناء توليد النسخ البديلة');
    } finally {
      setGeneratingVariants(false);
    }
  };

  const handleSaveVariants = async () => {
    if (!selectedQuestionForVariants) return;
    
    try {
      await saveQuestionVariants(supabase, selectedQuestionForVariants, generatedVariants);
      alert('تم حفظ النسخ البديلة بنجاح!');
      setShowVariantsModal(false);
      setGeneratedVariants([]);
      setSelectedQuestionForVariants(null);
    } catch (error) {
      console.error('Error saving variants:', error);
      alert('حدث خطأ أثناء حفظ النسخ البديلة');
    }
  };

  // توليد نماذج لجميع الأسئلة
  const handleGenerateAllVariants = async () => {
    if (questions.length === 0) {
      alert('لا توجد أسئلة لتوليد نماذج لها');
      return;
    }

    try {
      setLoading(true);
      let totalGenerated = 0;

      for (const question of questions) {
        const questionData = {
          question_text: question.question_text,
          options: [question.option_a, question.option_b, question.option_c, question.option_d],
          correct_answer: question.correct_answer === 'A' ? 0 : question.correct_answer === 'B' ? 1 : question.correct_answer === 'C' ? 2 : 3
        };

        const variants = await generateQuestionVariants(questionData, variantsCount);
        totalGenerated += variants.length;
      }

      alert(`تم توليد ${totalGenerated} نموذج بنجاح!\n\nالنماذج تغير صيغة السؤال فقط مع الحفاظ على نفس الأرقام والخيارات.`);
      setShowGenerateVariantsModal(false);
    } catch (error: any) {
      console.error('Error generating variants:', error);
      alert(`حدث خطأ أثناء توليد النماذج:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // توليد أسئلة الامتحان النهائي تلقائياً
  const handleGenerateExamQuestions = async () => {
    try {
      setLoading(true);
      
      let allQuestions = [];
      
      if (examQuestionsSource === 'current') {
        // من الدرس الحالي فقط
        allQuestions = questions;
      } else {
        // من جميع الدروس
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', subjectId);
        
        if (error) throw error;
        allQuestions = data || [];
      }

      if (allQuestions.length === 0) {
        alert('لا توجد أسئلة متاحة');
        return;
      }

      // اختيار أسئلة عشوائية
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(autoExamQuestionsCount, allQuestions.length));

      // تحويل إلى صيغة أسئلة الامتحان
      const newExamQuestions = selected.map(q => ({
        question_text: q.question_text,
        question_image_url: q.question_image_url,
        question_image_file: null,
        equation_latex: q.equation_latex,
        equation_image_url: q.equation_image_url,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        show_at_time: 0
      }));

      setExamQuestions([...examQuestions, ...newExamQuestions]);
      alert(`تم إضافة ${newExamQuestions.length} سؤال للامتحان النهائي!`);
      setShowGenerateExamQuestionsModal(false);
    } catch (error: any) {
      console.error('Error generating exam questions:', error);
      alert(`حدث خطأ أثناء توليد أسئلة الامتحان:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // فتح محرر الرياضيات
  const openMathEditor = (type: 'question' | 'exam', index: number, field: string) => {
    setCurrentMathField({ type, index, field });
    setTempLatex('');
    setShowMathEditor(true);
  };

  // إدراج المعادلة في الحقل
  const insertMathEquation = async () => {
    if (!currentMathField || !tempLatex) return;

    try {
      setLoading(true);
      
      // تحويل LaTeX إلى صورة ورفعها
      const imageUrl = await latexToImage(tempLatex);
      
      const { type, index, field } = currentMathField;
      const equationTag = `[EQUATION:${imageUrl}]`;

      if (type === 'question') {
        const updatedQuestions = [...questions];
        const currentText = (updatedQuestions[index] as any)[field] || '';
        // إضافة المعادلة إلى النص الموجود
        (updatedQuestions[index] as any)[field] = currentText ? `${currentText} ${equationTag}` : equationTag;
        // حفظ LaTeX أيضاً
        (updatedQuestions[index] as any).equation_latex = tempLatex;
        (updatedQuestions[index] as any).equation_image_url = imageUrl;
        setQuestions(updatedQuestions);
      } else {
        const updatedExamQuestions = [...examQuestions];
        const currentText = (updatedExamQuestions[index] as any)[field] || '';
        // إضافة المعادلة إلى النص الموجود
        (updatedExamQuestions[index] as any)[field] = currentText ? `${currentText} ${equationTag}` : equationTag;
        // حفظ LaTeX أيضاً
        (updatedExamQuestions[index] as any).equation_latex = tempLatex;
        (updatedExamQuestions[index] as any).equation_image_url = imageUrl;
        setExamQuestions(updatedExamQuestions);
      }

      setShowMathEditor(false);
      setCurrentMathField(null);
      setTempLatex('');
    } catch (error) {
      console.error('Error inserting equation:', error);
      alert('حدث خطأ أثناء إضافة المعادلة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const saveLesson = async () => {
    if (!currentLesson.title) {
      alert('الرجاء إدخال عنوان الدرس');
      return;
    }

    setLoading(true);
    try {
      let videoPath = currentLesson.video_url;

      if (currentLesson.video_file) {
        // رفع مباشر إلى Bunny.net باستخدام TUS
        setIsUploading(true);
        setUploadProgress(0);
        
        const result = await uploadToCloudflareStream(
          currentLesson.video_file,
          (progress) => setUploadProgress(progress)
        );
        
        setIsUploading(false);
        
        if (!result.success) {
          alert(`خطأ في رفع الفيديو: ${result.error}`);
          setLoading(false);
          return;
        }
        
        videoPath = result.playbackUrl || '';
      }

      let lessonData;
      
      if (editingLessonId) {
        const { data, error: updateError } = await supabase
          .from('lessons')
          .update({
            title: currentLesson.title,
            video_url: videoPath,
            is_free: currentLesson.is_free,
          })
          .eq('id', editingLessonId)
          .select()
          .single();

        if (updateError) throw updateError;
        lessonData = data;

        await supabase
          .from('questions')
          .delete()
          .eq('lesson_id', editingLessonId);
      } else {
        const { data, error: insertError } = await supabase
          .from('lessons')
          .insert([{
            subject_id: subjectId,
            title: currentLesson.title,
            video_url: videoPath,
            is_free: currentLesson.is_free,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        lessonData = data;
      }

      if (questions.length > 0) {
        const questionsToInsert = await Promise.all(questions.map(async (q) => {
          let imageUrl = q.question_image_url || null;
          
          if (q.question_image_file) {
            const fileName = `questions/${Date.now()}_${q.question_image_file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('videos')
              .upload(fileName, q.question_image_file);

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);
              
              imageUrl = publicUrl;
            }
          }
          
          // دالة لتنظيف HTML (الحفاظ على الجداول)
          const cleanHtml = (html: string) => {
            if (!html) return '';
            
            // إزالة Word fragments
            let clean = html
              .replace(/<!--StartFragment-->/g, '')
              .replace(/<!--EndFragment-->/g, '');
            
            // الحفاظ على HTML الكامل (بما في ذلك الجداول)
            clean = clean
              .replace(/&nbsp;/g, ' ')
              .trim();
            
            return clean;
          };
          
          return {
            question_text: cleanHtml(q.question_text) || 'سؤال',
            question_image_url: imageUrl,
            equation_latex: q.equation_latex || null,
            equation_image_url: q.equation_image_url || null,
            option_a: cleanHtml(q.option_a) || 'خيار أ',
            option_b: cleanHtml(q.option_b) || 'خيار ب',
            option_c: cleanHtml(q.option_c) || 'خيار ج',
            option_d: cleanHtml(q.option_d) || 'خيار د',
            correct_answer: q.correct_answer || 'A',
            show_at_time: q.show_at_time || 0,
            lesson_id: lessonData.id,
          };
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      if (examQuestions.length > 0) {
        if (editingLessonId) {
          await supabase
            .from('exam_questions')
            .delete()
            .eq('lesson_id', editingLessonId);
        }

        // دالة لتنظيف HTML (الحفاظ على الجداول)
        const cleanHtml = (html: string) => {
          if (!html) return '';
          
          // إزالة Word fragments
          let clean = html
            .replace(/<!--StartFragment-->/g, '')
            .replace(/<!--EndFragment-->/g, '');
          
          // الحفاظ على HTML الكامل (بما في ذلك الجداول)
          clean = clean
            .replace(/&nbsp;/g, ' ')
            .trim();
          
          return clean;
        };

        const examQuestionsToInsert = examQuestions.map((q, index) => ({
          lesson_id: lessonData.id,
          question_text: cleanHtml(q.question_text),
          equation_latex: q.equation_latex || null,
          equation_image_url: q.equation_image_url || null,
          option_a: cleanHtml(q.option_a),
          option_b: cleanHtml(q.option_b),
          option_c: cleanHtml(q.option_c),
          option_d: cleanHtml(q.option_d),
          correct_answer: q.correct_answer,
        }));

        const { error: examQuestionsError } = await supabase
          .from('exam_questions')
          .insert(examQuestionsToInsert);

        if (examQuestionsError) throw examQuestionsError;
      }

      alert(editingLessonId ? 'تم تحديث الدرس بنجاح!' : 'تم حفظ الدرس بنجاح!');
      setCurrentLesson({ id: null, title: '', video_url: '', video_file: null, is_free: false });
      setQuestions([]);
      setExamQuestions([]);
      setEditingLessonId(null);
      fetchLessons();
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      const errorMessage = error?.message || 'حدث خطأ غير معروف';
      alert(`حدث خطأ أثناء حفظ الدرس:\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // دوال إدارة بنك الأسئلة
  const openQuestionBank = async (questionIndex: number) => {
    // التحقق من حفظ الدرس أولاً
    if (!editingLessonId) {
      alert('⚠️ يجب حفظ الدرس أولاً قبل إضافة نماذج للبنك!\n\nالخطوات:\n1. احفظ الدرس بالضغط على "حفظ الدرس"\n2. ثم افتح بنك الأسئلة لإضافة النماذج');
      return;
    }
    
    setSelectedQuestionIndex(questionIndex);
    setShowQuestionBankModal(true);
    await fetchQuestionVariants(questionIndex);
  };

  const fetchQuestionVariants = async (questionIndex: number) => {
    setLoadingVariants(true);
    try {
      if (!editingLessonId) {
        setQuestionVariants([]);
        setLoadingVariants(false);
        return;
      }

      // جلب جميع أسئلة الدرس مع ترتيبها
      const { data: lessonQuestions, error: fetchError } = await supabase
        .from('questions')
        .select('id, question_text, created_at')
        .eq('lesson_id', editingLessonId)
        .order('created_at');

      if (fetchError) {
        console.error('Error fetching questions:', fetchError);
        throw fetchError;
      }

      if (!lessonQuestions || lessonQuestions.length === 0) {
        console.log('No questions found for this lesson');
        setQuestionVariants([]);
        setLoadingVariants(false);
        return;
      }

      // التحقق من وجود السؤال في الـ index المطلوب
      if (questionIndex >= lessonQuestions.length) {
        console.log(`Question index ${questionIndex} out of range (total: ${lessonQuestions.length})`);
        setQuestionVariants([]);
        setLoadingVariants(false);
        return;
      }

      const questionId = lessonQuestions[questionIndex].id;
      console.log(`Fetching variants for question ${questionIndex} (ID: ${questionId})`);
      
      // جلب النماذج البديلة
      const { data: variants, error: variantsError } = await supabase
        .from('question_variants')
        .select('*')
        .eq('parent_question_id', questionId)
        .order('created_at');

      if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        throw variantsError;
      }
      
      console.log(`Found ${variants?.length || 0} variants`);
      setQuestionVariants(variants || []);
    } catch (error: any) {
      console.error('Error in fetchQuestionVariants:', error);
      alert(`حدث خطأ أثناء جلب النماذج:\n${error.message || 'خطأ غير معروف'}`);
      setQuestionVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const addVariantToBank = () => {
    if (selectedQuestionIndex === null) return;
    
    const newVariant = {
      id: null,
      variant_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      is_active: true,
    };
    
    setQuestionVariants([...questionVariants, newVariant]);
  };

  const updateVariant = (variantIndex: number, field: string, value: any) => {
    const updated = [...questionVariants];
    updated[variantIndex] = { ...updated[variantIndex], [field]: value };
    setQuestionVariants(updated);
  };

  const removeVariant = (variantIndex: number) => {
    setQuestionVariants(questionVariants.filter((_, i) => i !== variantIndex));
  };

  const saveVariantsToBank = async () => {
    if (selectedQuestionIndex === null) return;
    
    setLoading(true);
    try {
      // نحتاج أولاً لحفظ الدرس إذا لم يكن محفوظاً
      if (!editingLessonId) {
        alert('يجب حفظ الدرس أولاً قبل إضافة النماذج للبنك');
        return;
      }

      // جلب question_id
      const { data: lessonQuestions } = await supabase
        .from('questions')
        .select('id')
        .eq('lesson_id', editingLessonId)
        .order('created_at');

      if (!lessonQuestions || !lessonQuestions[selectedQuestionIndex]) {
        alert('لم يتم العثور على السؤال. يرجى حفظ الدرس أولاً.');
        return;
      }

      const questionId = lessonQuestions[selectedQuestionIndex].id;

      // حذف النماذج القديمة أولاً
      await supabase
        .from('question_variants')
        .delete()
        .eq('parent_question_id', questionId);

      // إدراج النماذج الجديدة
      if (questionVariants.length > 0) {
        const variantsToInsert = questionVariants.map(v => ({
          parent_question_id: questionId,
          variant_text: v.variant_text,
          option_a: v.option_a,
          option_b: v.option_b,
          option_c: v.option_c,
          option_d: v.option_d,
          correct_answer: v.correct_answer,
          is_active: v.is_active ?? true,
        }));

        const { error } = await supabase
          .from('question_variants')
          .insert(variantsToInsert);

        if (error) throw error;
      }

      alert(`تم حفظ ${questionVariants.length} نموذج في البنك بنجاح! 🎉`);
      setShowQuestionBankModal(false);
    } catch (error: any) {
      console.error('Error saving variants:', error);
      alert(`حدث خطأ أثناء حفظ النماذج:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title={`إضافة دروس - ${subjectName}`}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/subjects')} className="p-2 hover:bg-white/50 rounded-lg transition-all">
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">إضافة دروس</h1>
                <p className="text-gray-600">{subjectName}</p>
              </div>
            </div>
          </div>


          {lessons.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">{lessons.length}</span>
                الدروس المضافة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="group bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">{index + 1}</span>
                          {lesson.is_free && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">مجاني</span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{lesson.title}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>فيديو تعليمي</span>
                      {lesson.video_url && (
                        <button
                          onClick={() => {
                            setPreviewVideoUrl(lesson.video_url);
                            setShowVideoPreview(true);
                          }}
                          className="mr-auto text-indigo-600 hover:text-indigo-800 font-semibold"
                          title="معاينة الفيديو"
                        >
                          👁️ معاينة
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          setCurrentLesson({ id: lesson.id, title: lesson.title, video_url: lesson.video_url || '', video_file: null, is_free: lesson.is_free || false });
                          setEditingLessonId(lesson.id);
                          setActiveTab('info');
                          try {
                            const { data: questionsData, error: questionsError } = await supabase
                              .from('questions')
                              .select('*')
                              .eq('lesson_id', lesson.id)
                              .order('show_at_time');
                            if (questionsError) throw questionsError;
                            setQuestions(questionsData || []);
                            
                            const { data: examData, error: examError } = await supabase
                              .from('exam_questions')
                              .select('*')
                              .eq('lesson_id', lesson.id)
                              .order('created_at');
                            if (examError) throw examError;
                            setExamQuestions(examData || []);
                          } catch (error) {
                            console.error('Error fetching questions:', error);
                          }
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تعديل
                      </button>
                      <button 
                        onClick={() => handleGenerateVariants(lesson.id)} 
                        disabled={generatingVariants}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title="توليد نسخ بديلة"
                      >
                        🤖
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
                            try {
                              const { error } = await supabase.from('lessons').delete().eq('id', lesson.id);
                              if (error) throw error;
                              alert('تم حذف الدرس بنجاح!');
                              fetchLessons();
                            } catch (error) {
                              console.error('Error deleting lesson:', error);
                              alert('حدث خطأ أثناء حذف الدرس');
                            }
                          }
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold"
                        title="حذف الدرس"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {editingLessonId ? 'تعديل الدرس' : 'إضافة درس جديد'}
              </h2>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex gap-1 px-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-4 font-semibold transition-all relative ${
                    activeTab === 'info'
                      ? 'text-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    معلومات الدرس
                  </div>
                  {activeTab === 'info' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`px-6 py-4 font-semibold transition-all relative ${
                    activeTab === 'questions'
                      ? 'text-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    أسئلة الفيديو
                    {questions.length > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full">{questions.length}</span>
                    )}
                  </div>
                  {activeTab === 'questions' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('exam')}
                  className={`px-6 py-4 font-semibold transition-all relative ${
                    activeTab === 'exam'
                      ? 'text-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    الامتحان النهائي
                    {examQuestions.length > 0 && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">{examQuestions.length}</span>
                    )}
                  </div>
                  {activeTab === 'exam' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* معلومات الدرس */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">عنوان الدرس</label>
                    <input 
                      type="text" 
                      value={currentLesson.title} 
                      onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })} 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-800 font-semibold" 
                      placeholder="مثال: الدرس الأول - المقدمة" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">الفيديو</label>
                    <div className="space-y-3">
                      <input type="text" value={currentLesson.video_url} onChange={(e) => setCurrentLesson({ ...currentLesson, video_url: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-800 font-semibold" placeholder="رابط الفيديو (YouTube, Vimeo, etc.)" />
                      <div className="text-center text-gray-500">أو</div>
                      <input type="file" accept="video/*" onChange={handleVideoFileChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-semibold" />
                      
                      {/* شريط تقدم رفع الفيديو */}
                      {isUploading && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-blue-700">جاري الرفع...</span>
                            <span className="text-lg font-bold text-indigo-600">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {currentLesson.video_file && !isUploading && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 text-right">
                            ✅ تم اختيار: <strong>{currentLesson.video_file.name}</strong> ({(currentLesson.video_file.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-end gap-3 cursor-pointer">
                      <span className="text-sm font-semibold text-gray-700">درس مجاني (متاح للطلاب غير المشتركين)</span>
                      <input 
                        type="checkbox" 
                        checked={currentLesson.is_free} 
                        onChange={(e) => setCurrentLesson({ ...currentLesson, is_free: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <p className="text-xs text-gray-500 text-right mt-2">✨ الدروس المجانية يمكن للطلاب غير المشتركين مشاهدتها</p>
                  </div>
                </div>
              )}

              {/* أسئلة الفيديو */}
              {activeTab === 'questions' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <button onClick={addQuestion} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all">➕ إضافة سؤال</button>
                      {questions.length > 0 && (
                        <button onClick={() => setShowGenerateVariantsModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">🤖 توليد نماذج</button>
                      )}
                    </div>
                    <h3 className="text-md font-semibold text-gray-800">الأسئلة ({questions.length})</h3>
                  </div>

                  <div className="space-y-4">
                    {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <button onClick={() => removeQuestion(index)} className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition">حذف</button>
                        <button 
                          onClick={() => openQuestionBank(index)} 
                          className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          بنك الأسئلة
                        </button>
                      </div>
                      <h4 className="font-medium text-gray-700">السؤال {index + 1}</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700 text-right">نص السؤال</label>
                          <button
                            type="button"
                            onClick={() => openMathEditor('question', index, 'question_text')}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-2"
                          >
                            🧮 إضافة معادلة رياضية
                          </button>
                        </div>
                        <RichTextEditor
                          value={question.question_text}
                          onChange={(content) => updateQuestion(index, 'question_text', content)}
                          placeholder="اكتب السؤال هنا... أو اضغط 'إضافة معادلة رياضية' للمعادلات المعقدة"
                          height={250}
                        />
                        
                        {/* معاينة LaTeX */}
                        {question.question_text && /\\(frac|sqrt|sum|int|lim|pi|infty|geq|leq|neq|times|div|pm)/i.test(question.question_text) && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-2 text-right">📐 معاينة المعادلة:</p>
                            <div className="bg-white p-3 rounded border border-blue-300 text-center">
                              <img
                                src={`https://latex.codecogs.com/svg.latex?${encodeURIComponent(question.question_text.replace(/\$\$/g, ''))}`}
                                alt="معادلة"
                                className="inline-block max-w-full"
                              />
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2 text-right">
                          💡 <strong>نصيحة:</strong> للمعادلات البسيطة: اكتب مباشرة (مثل: 2/3). للمعادلات المعقدة: اضغط زر "إضافة معادلة رياضية" 🧮
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1 text-right">صورة السؤال (اختياري - للمعادلات المعقدة جداً)</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const maxSize = 5 * 1024 * 1024;
                            if (file.size > maxSize) {
                              alert('حجم الصورة كبير جداً! الحد الأقصى 5MB');
                              e.target.value = '';
                              return;
                            }
                            const updated = [...questions];
                            updated[index] = { ...updated[index], question_image_file: file };
                            setQuestions(updated);
                          }
                        }} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                        <p className="text-xs text-gray-500 mt-1 text-right">استخدم الصورة فقط للمعادلات المعقدة جداً (الحد الأقصى 5MB)</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={question.option_a} onChange={(e) => updateQuestion(index, 'option_a', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار A" />
                        <input type="text" value={question.option_b} onChange={(e) => updateQuestion(index, 'option_b', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار B" />
                        <input type="text" value={question.option_c} onChange={(e) => updateQuestion(index, 'option_c', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار C" />
                        <input type="text" value={question.option_d} onChange={(e) => updateQuestion(index, 'option_d', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار D" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 text-right">الإجابة الصحيحة</label>
                          <select value={question.correct_answer} onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-bold">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 text-right">وقت الظهور</label>
                          <div className="flex items-center gap-1 justify-center">
                            <div className="flex flex-col items-center">
                              <input 
                                type="number" 
                                min="0"
                                max="59"
                                value={Math.floor((question.show_at_time || 0) % 60)}
                                onChange={(e) => {
                                  const totalSeconds = question.show_at_time || 0;
                                  const hours = Math.floor(totalSeconds / 3600);
                                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                                  const newSeconds = parseInt(e.target.value) || 0;
                                  updateQuestion(index, 'show_at_time', hours * 3600 + minutes * 60 + newSeconds);
                                }} 
                                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-gray-900 font-mono text-lg" 
                              />
                              <span className="text-xs text-gray-500 mt-1">ثانية</span>
                            </div>
                            <span className="text-xl font-bold text-gray-400 mb-5">:</span>
                            <div className="flex flex-col items-center">
                              <input 
                                type="number" 
                                min="0"
                                max="59"
                                value={Math.floor(((question.show_at_time || 0) % 3600) / 60)}
                                onChange={(e) => {
                                  const totalSeconds = question.show_at_time || 0;
                                  const hours = Math.floor(totalSeconds / 3600);
                                  const seconds = totalSeconds % 60;
                                  const newMinutes = parseInt(e.target.value) || 0;
                                  updateQuestion(index, 'show_at_time', hours * 3600 + newMinutes * 60 + seconds);
                                }} 
                                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-gray-900 font-mono text-lg" 
                              />
                              <span className="text-xs text-gray-500 mt-1">دقيقة</span>
                            </div>
                            <span className="text-xl font-bold text-gray-400 mb-5">:</span>
                            <div className="flex flex-col items-center">
                              <input 
                                type="number" 
                                min="0"
                                max="23"
                                value={Math.floor((question.show_at_time || 0) / 3600)}
                                onChange={(e) => {
                                  const totalSeconds = question.show_at_time || 0;
                                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                                  const seconds = totalSeconds % 60;
                                  const newHours = parseInt(e.target.value) || 0;
                                  updateQuestion(index, 'show_at_time', newHours * 3600 + minutes * 60 + seconds);
                                }} 
                                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-gray-900 font-mono text-lg" 
                              />
                              <span className="text-xs text-gray-500 mt-1">ساعة</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                </div>
              )}

              {/* الامتحان النهائي */}
              {activeTab === 'exam' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <button onClick={addExamQuestion} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">+ إضافة سؤال</button>
                      {questions.length > 0 && (
                        <button onClick={() => setShowGenerateExamQuestionsModal(true)} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all">📝 توليد أسئلة تلقائياً</button>
                      )}
                    </div>
                    <h3 className="text-md font-semibold text-gray-800">أسئلة الامتحان النهائي ({examQuestions.length})</h3>
                  </div>

                  <div className="space-y-4">
                    {examQuestions.map((question, index) => (
                  <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => removeExamQuestion(index)} className="text-red-500 hover:text-red-700">حذف</button>
                      <h4 className="font-medium text-gray-700">سؤال الامتحان {index + 1}</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700 text-right">نص السؤال</label>
                          <button
                            type="button"
                            onClick={() => openMathEditor('exam', index, 'question_text')}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-2"
                          >
                            🧮 إضافة معادلة رياضية
                          </button>
                        </div>
                        <RichTextEditor
                          value={question.question_text}
                          onChange={(content) => updateExamQuestion(index, 'question_text', content)}
                          placeholder="اكتب السؤال هنا... أو اضغط 'إضافة معادلة رياضية'"
                          height={200}
                        />
                        
                        {/* معاينة LaTeX */}
                        {question.question_text && /\\(frac|sqrt|sum|int|lim|pi|infty|geq|leq|neq|times|div|pm)/i.test(question.question_text) && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-2 text-right">📐 معاينة المعادلة:</p>
                            <div className="bg-white p-3 rounded border border-blue-300 text-center">
                              <img
                                src={`https://latex.codecogs.com/svg.latex?${encodeURIComponent(question.question_text.replace(/\$\$/g, ''))}`}
                                alt="معادلة"
                                className="inline-block max-w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={question.option_a} onChange={(e) => updateExamQuestion(index, 'option_a', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار A" />
                        <input type="text" value={question.option_b} onChange={(e) => updateExamQuestion(index, 'option_b', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار B" />
                        <input type="text" value={question.option_c} onChange={(e) => updateExamQuestion(index, 'option_c', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار C" />
                        <input type="text" value={question.option_d} onChange={(e) => updateExamQuestion(index, 'option_d', e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-right placeholder:text-gray-900 placeholder:font-bold text-gray-900 font-bold" placeholder="الخيار D" />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1 text-right">الإجابة الصحيحة</label>
                        <select value={question.correct_answer} onChange={(e) => updateExamQuestion(index, 'correct_answer', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-bold">
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={saveLesson} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50">
                  {loading ? 'جاري الحفظ...' : 'حفظ الدرس'}
                </button>
              </div>
            </div>
          </div>

        {showVariantsModal ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowVariantsModal(false)}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">النسخ البديلة المولدة</h2>
              
              <div className="space-y-6">
                {generatedVariants.map((variant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-3 text-right">النسخة {index + 1}</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700 text-right"><strong>السؤال:</strong> {variant.question_text}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {variant.options.map((opt: string, i: number) => (
                          <p key={i} className={`text-sm p-2 rounded text-right ${i === variant.correct_answer ? 'bg-green-100 text-green-800 font-semibold' : 'bg-white text-gray-600'}`}>
                            {String.fromCharCode(65 + i)}) {opt}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowVariantsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
                <button onClick={handleSaveVariants} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">حفظ النسخ البديلة</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal توليد نماذج الأسئلة */}
        {showGenerateVariantsModal ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowGenerateVariantsModal(false)}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">🤖 توليد نماذج الأسئلة</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">عدد النماذج لكل سؤال</label>
                <input type="number" min="1" max="10" value={variantsCount} onChange={(e) => setVariantsCount(parseInt(e.target.value) || 3)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-bold" />
                <p className="text-xs text-gray-500 mt-1 text-right">سيتم توليد {variantsCount} نموذج لكل سؤال من الأسئلة الموجودة ({questions.length} سؤال)</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowGenerateVariantsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
                <button onClick={handleGenerateAllVariants} disabled={loading} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400">
                  {loading ? 'جاري التوليد...' : 'توليد النماذج'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal توليد أسئلة الامتحان */}
        {showGenerateExamQuestionsModal ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowGenerateExamQuestionsModal(false)}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">📝 توليد أسئلة الامتحان</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">مصدر الأسئلة</label>
                <select value={examQuestionsSource} onChange={(e) => setExamQuestionsSource(e.target.value as 'current' | 'all')} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-bold mb-4">
                  <option value="current">من الدرس الحالي فقط</option>
                  <option value="all">من جميع الدروس</option>
                </select>
                
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">عدد الأسئلة</label>
                <input type="number" min="1" max="50" value={autoExamQuestionsCount} onChange={(e) => setAutoExamQuestionsCount(parseInt(e.target.value) || 5)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-bold" />
                <p className="text-xs text-gray-500 mt-1 text-right">سيتم اختيار {autoExamQuestionsCount} سؤال عشوائياً</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowGenerateExamQuestionsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
                <button onClick={handleGenerateExamQuestions} disabled={loading} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-400">
                  {loading ? 'جاري التوليد...' : 'إضافة الأسئلة'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal محرر الرياضيات */}
        {showMathEditor ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fadeIn" onClick={() => setShowMathEditor(false)}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-right">محرر المعادلات الرياضية 🧮</h2>
              
              {/* أمثلة سريعة */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-right">⚡ أمثلة سريعة:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    { latex: '\\frac{2}{3}', label: 'كسر بسيط: ²⁄₃' },
                    { latex: '\\frac{2 \\times 333}{9 \\times 1.01}', label: 'كسر معقد' },
                    { latex: '\\sqrt{x^{2} + y^{2}}', label: 'جذر تربيعي: √' },
                    { latex: '\\sqrt[3]{27}', label: 'جذر تكعيبي: ∛' },
                    { latex: 'x^{2} + 5x + 6 = 0', label: 'معادلة تربيعية' },
                    { latex: 'x \\geq 3', label: 'متباينة: ≥' },
                    { latex: 'x \\leq 5', label: 'متباينة: ≤' },
                    { latex: 'a^{2} + b^{2} = c^{2}', label: 'فيثاغورس' },
                    { latex: '\\frac{a}{b} = \\frac{c}{d}', label: 'نسبة وتناسب' },
                    { latex: '\\sum_{i=1}^{n} i^{2}', label: 'مجموع: ∑' },
                    { latex: '\\int_{0}^{\\infty} e^{-x} dx', label: 'تكامل: ∫' },
                    { latex: '\\lim_{x \\to \\infty} \\frac{1}{x}', label: 'نهاية: lim' },
                    { latex: '\\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}', label: 'القانون العام' },
                    { latex: '\\pi r^{2}', label: 'مساحة دائرة: πr²' },
                    { latex: '2\\pi r', label: 'محيط دائرة: 2πr' },
                    { latex: '\\frac{1}{2}bh', label: 'مساحة مثلث' },
                    { latex: '(a + b)^{2} = a^{2} + 2ab + b^{2}', label: 'مربع مجموع' },
                    { latex: '(a - b)^{2} = a^{2} - 2ab + b^{2}', label: 'مربع فرق' },
                    { latex: 'a^{2} - b^{2} = (a+b)(a-b)', label: 'فرق مربعين' },
                    { latex: '\\frac{\\Delta y}{\\Delta x}', label: 'معدل التغير' },
                    { latex: 'y = mx + b', label: 'معادلة خطية' },
                    { latex: '\\sqrt{\\frac{a}{b}}', label: 'جذر كسر' },
                    { latex: 'x \\neq 0', label: 'لا يساوي: ≠' },
                    { latex: '\\frac{s}{\\frac{t}{2}}', label: 'كسر متداخل' },
                  ].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTempLatex(example.latex)}
                      className="px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-sm text-right font-semibold text-gray-900"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4 text-right">
                  استخدم الأزرار أدناه لإنشاء معادلة رياضية احترافية، أو اختر مثالاً سريعاً من الأعلى.
                </p>
                
                <MathEditor
                  value={tempLatex}
                  onChange={setTempLatex}
                  placeholder="أدخل المعادلة الرياضية... أو اختر مثالاً من الأعلى"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowMathEditor(false)} 
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={insertMathEquation} 
                  disabled={!tempLatex}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  إدراج المعادلة
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal بنك الأسئلة */}
        {showQuestionBankModal && selectedQuestionIndex !== null ? (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowQuestionBankModal(false)}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setShowQuestionBankModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  بنك الأسئلة - السؤال {selectedQuestionIndex + 1}
                </h2>
              </div>

              {/* السؤال الأساسي */}
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-800 mb-3 text-right">📌 السؤال الأساسي</h3>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-gray-800 text-right mb-2" dangerouslySetInnerHTML={{ __html: questions[selectedQuestionIndex].question_text }} />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="text-right text-sm"><strong>A:</strong> {questions[selectedQuestionIndex].option_a}</div>
                    <div className="text-right text-sm"><strong>B:</strong> {questions[selectedQuestionIndex].option_b}</div>
                    <div className="text-right text-sm"><strong>C:</strong> {questions[selectedQuestionIndex].option_c}</div>
                    <div className="text-right text-sm"><strong>D:</strong> {questions[selectedQuestionIndex].option_d}</div>
                  </div>
                  <p className="text-green-600 font-bold text-right mt-2">✓ الإجابة الصحيحة: {questions[selectedQuestionIndex].correct_answer}</p>
                </div>
              </div>

              {/* النماذج البديلة */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={addVariantToBank}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة نموذج بديل
                  </button>
                  <h3 className="text-lg font-bold text-gray-800">النماذج البديلة ({questionVariants.length})</h3>
                </div>

                {loadingVariants ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">جاري تحميل النماذج...</p>
                  </div>
                ) : questionVariants.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-semibold">لا توجد نماذج بديلة بعد</p>
                    <p className="text-gray-500 text-sm mt-2">اضغط "إضافة نموذج بديل" لإنشاء نماذج جديدة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questionVariants.map((variant, vIndex) => (
                      <div key={vIndex} className="border-2 border-amber-200 rounded-xl p-4 bg-amber-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <button 
                            onClick={() => removeVariant(vIndex)}
                            className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            حذف
                          </button>
                          <h4 className="font-bold text-amber-800">النموذج البديل {vIndex + 1}</h4>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-700 text-right">نص السؤال</label>
                              <button
                                type="button"
                                onClick={() => openMathEditor('question', vIndex, 'variant_text')}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-2"
                              >
                                🧮 إضافة معادلة رياضية
                              </button>
                            </div>
                            <RichTextEditor
                              value={variant.variant_text}
                              onChange={(content) => updateVariant(vIndex, 'variant_text', content)}
                              placeholder="اكتب نص السؤال البديل... يمكنك إضافة جداول وتنسيقات"
                              height={200}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الخيار A</label>
                              <input
                                type="text"
                                value={variant.option_a}
                                onChange={(e) => updateVariant(vIndex, 'option_a', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الخيار B</label>
                              <input
                                type="text"
                                value={variant.option_b}
                                onChange={(e) => updateVariant(vIndex, 'option_b', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الخيار C</label>
                              <input
                                type="text"
                                value={variant.option_c}
                                onChange={(e) => updateVariant(vIndex, 'option_c', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الخيار D</label>
                              <input
                                type="text"
                                value={variant.option_d}
                                onChange={(e) => updateVariant(vIndex, 'option_d', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-semibold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">الإجابة الصحيحة</label>
                            <select
                              value={variant.correct_answer}
                              onChange={(e) => updateVariant(vIndex, 'correct_answer', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right text-gray-900 font-semibold"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* أزرار الحفظ */}
              <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                <button 
                  onClick={() => setShowQuestionBankModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={saveVariantsToBank}
                  disabled={loading || questionVariants.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري الحفظ...' : `حفظ ${questionVariants.length} نموذج في البنك`}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={showVideoPreview}
        onClose={() => setShowVideoPreview(false)}
        videoUrl={previewVideoUrl}
      />
    </DashboardLayout>
  );
}
