import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import HtmlRenderer from '../components/HtmlRenderer';
import { addExamCompletionPoints } from '../lib/pointsService';

// Skeleton Loader للسؤال
const QuestionSkeleton = () => {
  const animatedValue = new Animated.Value(0);
  
  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={skeletonStyles.container}>
      <Animated.View style={[skeletonStyles.questionNumber, { opacity }]} />
      <Animated.View style={[skeletonStyles.questionText, { opacity }]} />
      <Animated.View style={[skeletonStyles.questionTextShort, { opacity }]} />
      
      {[1, 2, 3, 4].map((item) => (
        <Animated.View key={item} style={[skeletonStyles.option, { opacity }]} />
      ))}
      
      <Animated.View style={[skeletonStyles.button, { opacity }]} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
  },
  questionNumber: {
    width: 120,
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 15,
    alignSelf: 'flex-end',
  },
  questionText: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  questionTextShort: {
    width: '70%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  option: {
    width: '100%',
    height: 50,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginTop: 10,
  },
});

// أيقونة التخرج
const GraduationCapIcon = () => (
  <Svg width={100} height={100} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" 
      fill="#2196F3"
    />
    <Path 
      d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" 
      fill="#1976D2"
    />
  </Svg>
);

// أيقونة الكتاب
const BookIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#2196F3" strokeWidth={2} />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
  </Svg>
);

// أيقونة الأسئلة
const QuestionIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={17} r={1} fill="#2196F3" />
  </Svg>
);

// أيقونة الروبوت AI
const AIIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={8} width={14} height={12} rx={2} stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Circle cx={9} cy={13} r={1.5} fill="#2196F3" />
    <Circle cx={15} cy={13} r={1.5} fill="#2196F3" />
    <Path d="M9 17h6" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 8V5" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={12} cy={4} r={1} fill="#2196F3" />
  </Svg>
);

// أيقونة الامتحان
const ExamIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Path d="M14 2v6h6M9 13h6M9 17h3" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة التحليل
const AnalyticsIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3v18h18" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" />
    <Path d="M7 16l4-4 4 4 6-6" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={7} cy={16} r={2} fill="#2196F3" />
    <Circle cx={11} cy={12} r={2} fill="#2196F3" />
    <Circle cx={15} cy={16} r={2} fill="#2196F3" />
    <Circle cx={21} cy={10} r={2} fill="#2196F3" />
  </Svg>
);

export default function ExamScreen({ navigation, route }) {
  const { lessonId, lessonTitle, subjectId, passingPercentage = 80 } = route.params || {};
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    fetchExamQuestions();
  }, []);

  const fetchExamQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching exam questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      alert('الرجاء اختيار إجابة');
      return;
    }

    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correct_answer;
    const newAnswers = [...answers, {
      question: questions[currentQuestionIndex],
      userAnswer: selectedAnswer,
      isCorrect: isCorrect
    }];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      // عرض skeleton أثناء الانتقال للسؤال التالي
      setQuestionLoading(true);
      setSelectedAnswer(null);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionLoading(false);
      }, 300);
    } else {
      // حساب النتيجة وحفظها
      const correctCount = newAnswers.filter(a => a.isCorrect).length;
      const percentage = Math.round((correctCount / newAnswers.length) * 100);
      const passed = percentage >= passingPercentage;

      setSaving(true);
      try {
        // الحصول على المستخدم الحالي من Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          alert('الرجاء تسجيل الدخول أولاً');
          return;
        }

        // حفظ النتيجة في قاعدة البيانات
        const { error } = await supabase
          .from('student_progress')
          .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            exam_score: correctCount,
            total_questions: newAnswers.length,
            passed: passed,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,lesson_id'
          });

        if (error) throw error;

        // إرسال إشعار لولي الأمر
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (userData) {
          const { notifyParentExamCompleted } = require('../lib/notificationService');
          notifyParentExamCompleted(user.id, userData.name, lessonTitle, correctCount, newAnswers.length);
        }

        // إضافة نقاط الامتحان النهائي
        const pointsResult = await addExamCompletionPoints(user.id, lessonId, lessonTitle, percentage);
        
        // حفظ معلومات النقاط لعرضها في شاشة النتائج
        setAnswers(prev => {
          prev.pointsResult = pointsResult;
          return prev;
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      } finally {
        setSaving(false);
      }

      setShowResults(true);
    }
  };

  const correctCount = answers.filter(a => a.isCorrect).length;
  const percentage = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>جاري تحميل الامتحان...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الامتحان النهائي</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد أسئلة للامتحان</Text>
        </View>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>نتيجة الامتحان</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>نتيجتك النهائية</Text>
            <Text style={styles.resultsPercentage}>{percentage}%</Text>
            <Text style={styles.resultsScore}>{correctCount} من {questions.length}</Text>
            
            {percentage >= passingPercentage ? (
              <Text style={styles.resultsSuccess}>🎉 ممتاز! لقد نجحت في الامتحان</Text>
            ) : (
              <Text style={styles.resultsFail}>النسبة المطلوبة {passingPercentage}% - حاول مرة أخرى</Text>
            )}
            
            {/* زر العودة للدروس للطالب المشترك */}
            {!answers.pointsResult?.isFreeTier && (
              <TouchableOpacity
                style={styles.subscribedBackButton}
                onPress={() => navigation.navigate('Lessons', { 
                  subjectId: subjectId,
                  title: lessonTitle,
                  passingPercentage: passingPercentage
                })}
              >
                <Text style={styles.subscribedBackButtonText}>العودة للدروس</Text>
              </TouchableOpacity>
            )}
            
            {/* رسالة للطالب غير المشترك */}
            {answers.pointsResult?.isFreeTier && (
              <View style={styles.freeUserNotice}>
                <View style={styles.iconContainer}>
                  <GraduationCapIcon />
                </View>
                <Text style={styles.freeUserTitle}>جاهز لتحقيق حلمك في اختبار القدرات؟</Text>
                <Text style={styles.freeUserSubtitle}>اشترك الآن واحصل على:</Text>
                
                <View style={styles.benefitsList}>
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitText}>دروس كمي ولفظي شاملة</Text>
                    <View style={styles.iconWrapper}>
                      <BookIcon />
                    </View>
                  </View>
                  
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitText}>آلاف الأسئلة التدريبية</Text>
                    <View style={styles.iconWrapper}>
                      <QuestionIcon />
                    </View>
                  </View>
                  
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitText}>مدرسك الذكي AI متاح 24/7</Text>
                    <View style={styles.iconWrapper}>
                      <AIIcon />
                    </View>
                  </View>
                  
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitText}>اختبارات تجريبية واقعية</Text>
                    <View style={styles.iconWrapper}>
                      <ExamIcon />
                    </View>
                  </View>
                  
                  <View style={styles.benefitRow}>
                    <Text style={styles.benefitText}>تحليل أدائك وتحسينه</Text>
                    <View style={styles.iconWrapper}>
                      <AnalyticsIcon />
                    </View>
                  </View>
                </View>
                
                
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.navigate('Lessons', { 
                    subjectId: subjectId,
                    title: lessonTitle,
                    passingPercentage: passingPercentage
                  })}
                >
                  <Text style={styles.backButtonText}>العودة للدروس</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الامتحان النهائي</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content}>
        {questionLoading ? (
          <QuestionSkeleton />
        ) : (
          <View style={styles.questionCard}>
            <Text style={styles.questionNumber}>السؤال {currentQuestionIndex + 1} من {questions.length}</Text>
            
            {/* عرض صورة السؤال أولاً إذا لم يكن هناك نص */}
            {currentQuestion.question_image_url && (!currentQuestion.question_text || currentQuestion.question_text.trim() === '') && (
              <Image 
                source={{ uri: currentQuestion.question_image_url }} 
                style={styles.questionImageOnly}
                resizeMode="contain"
              />
            )}
            
            {/* عرض نص السؤال إذا كان موجوداً */}
            {currentQuestion.question_text && currentQuestion.question_text.trim() !== '' && (
              <HtmlRenderer html={currentQuestion.question_text} style={styles.questionText} />
            )}
            
            {/* عرض صورة السؤال بعد النص إذا كان هناك نص */}
            {currentQuestion.question_image_url && currentQuestion.question_text && currentQuestion.question_text.trim() !== '' && (
              <Image 
                source={{ uri: currentQuestion.question_image_url }} 
                style={styles.questionImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.optionsContainer}>
              {['A', 'B', 'C', 'D'].map((option, index) => {
                const arabicLetters = ['أ', 'ب', 'ج', 'د'];
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      selectedAnswer === option && styles.optionButtonSelected,
                      { flexDirection: 'row-reverse', justifyContent: 'flex-end' }
                    ]}
                    onPress={() => setSelectedAnswer(option)}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', flex: 1 }}>
                      <Text style={[
                        styles.optionText,
                        selectedAnswer === option && styles.optionTextSelected,
                        { fontWeight: 'bold', marginLeft: 10, fontSize: 18 }
                      ]}>
                        {arabicLetters[index]}.
                      </Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <HtmlRenderer 
                          html={currentQuestion[`option_${option.toLowerCase()}`]} 
                          style={[
                            styles.optionText,
                            selectedAnswer === option && styles.optionTextSelected
                          ]} 
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'التالي' : 'إنهاء الامتحان'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
  },
  questionCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'right',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'right',
    lineHeight: 28,
  },
  questionImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.2,
    marginBottom: 15,
    borderRadius: 12,
    marginTop: 0,
  },
  questionImageOnly: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: 15,
    borderRadius: 12,
    marginTop: 0,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 10,
  },
  optionButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    marginLeft: 10,
  },
  optionCircleSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  optionTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  resultsCard: {
    margin: 20,
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  resultsPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 10,
  },
  resultsScore: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  resultsSuccess: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  resultsFail: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
  },
  freeUserNotice: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 10,
  },
  freeUserTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
  },
  freeUserSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  websiteNotice: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  websiteText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  websiteUrl: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 12,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 6,
    paddingVertical: 2,
  },
  iconWrapper: {
    marginLeft: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
    fontWeight: '500',
    lineHeight: 18,
  },
  subscribeNowButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    width: '90%',
    marginBottom: 8,
  },
  subscribeNowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '90%',
  },
  backButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  subscribedBackButton: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  subscribedBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
