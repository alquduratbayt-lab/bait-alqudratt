import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import HtmlRenderer from '../components/HtmlRenderer';

const { width } = Dimensions.get('window');

function hasOptionTextContent(html) {
  if (!html) return false;
  const plain = String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
  return plain.length > 0;
}

export default function SubjectFinalExamScreen({ navigation, route }) {
  const { subjectId, subjectName, passingPercentage = 60 } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [subjectId]);

  const fetchExamData = async () => {
    try {
      // جلب بيانات الامتحان
      const { data: exam, error: examError } = await supabase
        .from('subject_final_exams')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .single();

      if (examError || !exam) {
        Alert.alert('خطأ', 'الامتحان غير متاح حالياً');
        navigation.goBack();
        return;
      }

      setExamData(exam);

      // جلب أسئلة الامتحان
      const { data: questionsData, error: questionsError } = await supabase
        .from('subject_final_exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('order_index');

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        Alert.alert('خطأ', 'لا توجد أسئلة في الامتحان');
        navigation.goBack();
        return;
      }

      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching exam:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل الامتحان');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectAnswer = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers({ ...answers, [currentQuestion.id]: selectedAnswer });
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[questions[currentQuestionIndex + 1]?.id] || null);
    } else {
      // آخر سؤال - عرض صفحة المراجعة
      setShowReview(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      if (selectedAnswer) {
        setAnswers({ ...answers, [currentQuestion.id]: selectedAnswer });
      }
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[questions[currentQuestionIndex - 1]?.id] || null);
    }
  };

  const handleGoToQuestion = (index) => {
    if (selectedAnswer) {
      setAnswers({ ...answers, [currentQuestion.id]: selectedAnswer });
    }
    setCurrentQuestionIndex(index);
    setSelectedAnswer(answers[questions[index]?.id] || null);
    setShowReview(false);
  };

  const handleSubmit = async () => {
    // حفظ الإجابة الحالية
    const finalAnswers = { ...answers };
    if (selectedAnswer) {
      finalAnswers[currentQuestion.id] = selectedAnswer;
    }

    // التحقق من الإجابة على جميع الأسئلة
    const unanswered = questions.filter(q => !finalAnswers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert(
        'أسئلة غير مجابة',
        `لديك ${unanswered.length} سؤال بدون إجابة. هل تريد المتابعة؟`,
        [
          { text: 'العودة للمراجعة', style: 'cancel' },
          { text: 'تسليم الامتحان', onPress: () => submitExam(finalAnswers) }
        ]
      );
    } else {
      submitExam(finalAnswers);
    }
  };

  const submitExam = async (finalAnswers) => {
    setSubmitting(true);
    try {
      // حساب النتيجة
      let correctCount = 0;
      const answersArray = questions.map(q => {
        const userAnswer = finalAnswers[q.id] || null;
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) correctCount++;
        return {
          question_id: q.id,
          answer: userAnswer,
          is_correct: isCorrect
        };
      });

      const percentage = Math.round((correctCount / questions.length) * 100);
      const passed = percentage >= (examData.passing_percentage || 60);

      // حفظ النتيجة في قاعدة البيانات
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // البحث عن المستخدم في جدول users
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (userData) {
          // حذف النتيجة القديمة إذا وجدت
          await supabase
            .from('student_final_exam_results')
            .delete()
            .eq('user_id', userData.id)
            .eq('exam_id', examData.id);

          // إضافة النتيجة الجديدة
          await supabase
            .from('student_final_exam_results')
            .insert({
              user_id: userData.id,
              exam_id: examData.id,
              score: correctCount,
              total_questions: questions.length,
              percentage: percentage,
              passed: passed,
              answers: answersArray
            });
        }
      }

      setResults({
        correct: correctCount,
        total: questions.length,
        percentage: percentage,
        passed: passed,
        answers: answersArray
      });
      setShowReview(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting exam:', error);
      Alert.alert('خطأ', 'حدث خطأ في تسليم الامتحان');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>جاري تحميل الامتحان...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // صفحة النتائج
  if (showResults && results) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={[styles.resultCard, results.passed ? styles.resultCardPassed : styles.resultCardFailed]}>
            <View style={styles.resultIconContainer}>
              {results.passed ? (
                <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} fill="#22c55e" />
                  <Path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              ) : (
                <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} fill="#ef4444" />
                  <Path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
            </View>

            <Text style={styles.resultTitle}>
              {results.passed ? '🎉 مبروك! نجحت في الامتحان' : '😔 للأسف لم تنجح'}
            </Text>

            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreText, results.passed ? styles.scoreTextPassed : styles.scoreTextFailed]}>
                {results.percentage}%
              </Text>
              <Text style={styles.scoreDetails}>
                {results.correct} من {results.total} إجابة صحيحة
              </Text>
              <Text style={styles.passingText}>
                نسبة النجاح المطلوبة: {examData.passing_percentage}%
              </Text>
            </View>
          </View>

          {/* نصائح للطالب */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 نصائح لك</Text>
            {results.percentage === 100 ? (
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>🏆 درجة كاملة! أنت متميز</Text>
                <Text style={styles.tipItem}>🌟 أداء رائع ومثالي، استمر على هذا المستوى</Text>
                <Text style={styles.tipItem}>📚 شارك معرفتك مع زملائك</Text>
              </View>
            ) : results.passed ? (
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>✨ أداء ممتاز! نجحت في الامتحان</Text>
                {results.correct < results.total && (
                  <Text style={styles.tipItem}>📚 راجع الأسئلة التي أخطأت فيها ({results.total - results.correct} أسئلة)</Text>
                )}
                <Text style={styles.tipItem}>🎯 استمر في التفوق والتميز</Text>
              </View>
            ) : (
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>📖 راجع الدروس مرة أخرى بتركيز</Text>
                <Text style={styles.tipItem}>✍️ دوّن الملاحظات المهمة أثناء المراجعة</Text>
                <Text style={styles.tipItem}>🔄 أعد الامتحان بعد المراجعة الجيدة</Text>
                <Text style={styles.tipItem}>💪 لا تستسلم! النجاح يحتاج مثابرة</Text>
              </View>
            )}
          </View>

          {/* ملخص الإجابات */}
          <Text style={styles.summaryTitle}>ملخص الإجابات</Text>
          {questions.map((q, index) => {
            const answer = results.answers.find(a => a.question_id === q.id);
            const getOptionText = (optionLetter) => {
              switch(optionLetter) {
                case 'A': return q.option_a;
                case 'B': return q.option_b;
                case 'C': return q.option_c;
                case 'D': return q.option_d;
                default: return optionLetter;
              }
            };
            const getArabicNumber = (optionLetter) => {
              switch(optionLetter) {
                case 'A': return '١';
                case 'B': return '٢';
                case 'C': return '٣';
                case 'D': return '٤';
                default: return '';
              }
            };
            return (
              <View key={q.id} style={[styles.summaryCard, answer?.is_correct ? styles.summaryCorrect : styles.summaryWrong]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIcon, answer?.is_correct ? styles.summaryIconCorrect : styles.summaryIconWrong]}>
                    {answer?.is_correct ? (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </View>
                  <Text style={styles.summaryNumber}>السؤال {index + 1}</Text>
                </View>
                {q.question_text ? (
                  <Text style={styles.summaryQuestion} numberOfLines={2}>{q.question_text.replace(/<[^>]*>/g, '')}</Text>
                ) : q.question_image_url ? (
                  <Text style={styles.summaryQuestion}>(سؤال بالصورة)</Text>
                ) : null}
                <View style={styles.summaryAnswersContainer}>
                  <View style={styles.answerRow}>
                    <Text style={styles.summaryAnswerLabel}>إجابتك:</Text>
                    <Text style={[styles.answerValue, answer?.is_correct ? styles.correctText : styles.wrongText]}>
                      {answer?.answer ? `(${getArabicNumber(answer.answer)}) ${getOptionText(answer.answer)}` : 'لم تجب'}
                    </Text>
                  </View>
                  {!answer?.is_correct && (
                    <View style={styles.correctAnswerRow}>
                      <Text style={styles.correctAnswerLabel}>✓ الإجابة الصحيحة:</Text>
                      <Text style={styles.correctAnswerValue}>
                        ({getArabicNumber(q.correct_answer)}) {getOptionText(q.correct_answer)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.finishButtonText}>العودة للدروس</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // صفحة المراجعة
  if (showReview) {
    const answeredCount = Object.keys(answers).length + (selectedAnswer ? 1 : 0);
    const unansweredCount = questions.length - answeredCount;
    
    const getOptionText = (q, optionLetter) => {
      switch(optionLetter) {
        case 'A': return q.option_a;
        case 'B': return q.option_b;
        case 'C': return q.option_c;
        case 'D': return q.option_d;
        default: return '';
      }
    };
    
    const getArabicNumber = (optionLetter) => {
      switch(optionLetter) {
        case 'A': return '١';
        case 'B': return '٢';
        case 'C': return '٣';
        case 'D': return '٤';
        default: return '';
      }
    };
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowReview(false)} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>مراجعة قبل التسليم</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.reviewContent}>
          {/* ملخص الحالة */}
          <View style={styles.reviewSummaryBox}>
            <Text style={styles.reviewSummaryTitle}>📋 ملخص إجاباتك</Text>
            <View style={styles.reviewSummaryStats}>
              <View style={styles.reviewStatItem}>
                <Text style={styles.reviewStatNumber}>{answeredCount}</Text>
                <Text style={styles.reviewStatLabel}>تمت الإجابة ✓</Text>
              </View>
              <View style={styles.reviewStatDivider} />
              <View style={styles.reviewStatItem}>
                <Text style={[styles.reviewStatNumber, unansweredCount > 0 && styles.reviewStatWarning]}>{unansweredCount}</Text>
                <Text style={styles.reviewStatLabel}>بدون إجابة</Text>
              </View>
              <View style={styles.reviewStatDivider} />
              <View style={styles.reviewStatItem}>
                <Text style={styles.reviewStatNumber}>{questions.length}</Text>
                <Text style={styles.reviewStatLabel}>إجمالي الأسئلة</Text>
              </View>
            </View>
            {unansweredCount > 0 && (
              <View style={styles.reviewWarningBox}>
                <Text style={styles.reviewWarningText}>⚠️ لديك {unansweredCount} سؤال بدون إجابة</Text>
              </View>
            )}
          </View>

          {/* تعليمات */}
          <View style={styles.reviewInstructions}>
            <Text style={styles.reviewInstructionsText}>👆 اضغط على أي سؤال للعودة إليه وتعديل إجابتك</Text>
          </View>

          {/* عرض الأسئلة مع الإجابات */}
          <Text style={styles.reviewSectionTitle}>الأسئلة والإجابات:</Text>
          {questions.map((q, index) => {
            const currentAnswer = answers[q.id] || (index === currentQuestionIndex ? selectedAnswer : null);
            const isAnswered = !!currentAnswer;
            
            return (
              <TouchableOpacity
                key={q.id}
                style={[styles.reviewQuestionCard, isAnswered ? styles.reviewCardAnswered : styles.reviewCardUnanswered]}
                onPress={() => handleGoToQuestion(index)}
              >
                <View style={styles.reviewQuestionHeader}>
                  <View style={[styles.reviewQuestionNumber, isAnswered ? styles.reviewNumberAnswered : styles.reviewNumberUnanswered]}>
                    <Text style={[styles.reviewNumberText, isAnswered && styles.reviewNumberTextAnswered]}>{index + 1}</Text>
                  </View>
                  <View style={styles.reviewQuestionTitleContainer}>
                    <Text style={styles.reviewQuestionLabel}>السؤال {index + 1}</Text>
                    {isAnswered ? (
                      <Text style={styles.reviewStatusAnswered}>✓ تمت الإجابة</Text>
                    ) : (
                      <Text style={styles.reviewStatusUnanswered}>⚠️ بدون إجابة</Text>
                    )}
                  </View>
                </View>
                
                <Text style={styles.reviewQuestionText} numberOfLines={3}>
                  {q.question_text ? q.question_text.replace(/<[^>]*>/g, '') : '📷 سؤال بالصورة'}
                </Text>
                
                <View style={styles.reviewAnswerSection}>
                  {isAnswered ? (
                    <View style={styles.reviewSelectedAnswer}>
                      <Text style={styles.reviewAnswerLabel}>✅ إجابتك المختارة:</Text>
                      <Text style={styles.reviewAnswerText}>
                        ({getArabicNumber(currentAnswer)}) {getOptionText(q, currentAnswer)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.reviewNoAnswer}>
                      <Text style={styles.reviewNoAnswerText}>❌ لم تختر إجابة - اضغط هنا للإجابة</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.reviewEditHint}>
                  <Text style={styles.reviewEditHintText}>اضغط للتعديل ←</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.reviewFooter}>
          <TouchableOpacity
            style={[styles.submitButton, unansweredCount > 0 && styles.submitButtonWarning]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Text style={styles.submitButtonText}>
                  {unansweredCount > 0 ? `تسليم الامتحان (${unansweredCount} بدون إجابة)` : '✓ تسليم الامتحان'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // صفحة السؤال
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'إنهاء الامتحان',
              'هل أنت متأكد من إنهاء الامتحان؟ سيتم فقدان جميع إجاباتك.',
              [
                { text: 'متابعة', style: 'cancel' },
                { text: 'إنهاء', style: 'destructive', onPress: () => navigation.goBack() }
              ]
            );
          }} 
          style={styles.backButton}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M6 18L18 6M6 6l12 12" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <TouchableOpacity onPress={() => setShowReview(true)} style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>مراجعة</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          السؤال {currentQuestionIndex + 1} من {questions.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionContainer} contentContainerStyle={styles.questionContent}>
        {/* عرض صورة السؤال أولاً إذا لم يكن هناك نص */}
        {currentQuestion.question_image_url && (!currentQuestion.question_text || currentQuestion.question_text.trim() === '') && (
          <Image
            source={{ uri: currentQuestion.question_image_url }}
            style={styles.questionImageOnly}
            resizeMode="contain"
          />
        )}
        
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

        {/* Options */}
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D'].map((option, index) => {
            const optLower = option.toLowerCase();
            const optionHtml = currentQuestion[`option_${optLower}`];
            const optionImageUrl = currentQuestion[`option_${optLower}_image_url`];
            const showText = hasOptionTextContent(optionHtml);
            const isSelected = selectedAnswer === option;
            const arabicNumbers = ['١', '٢', '٣', '٤'];
            
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                onPress={() => handleSelectAnswer(option)}
              >
                <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                  <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>{arabicNumbers[index]}</Text>
                </View>
                <View style={styles.optionContentCol}>
                  {optionImageUrl ? (
                    <Image
                      source={{ uri: optionImageUrl }}
                      style={styles.optionChoiceImage}
                      resizeMode="contain"
                    />
                  ) : null}
                  {showText ? (
                    <HtmlRenderer
                      html={optionHtml}
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        optionImageUrl ? { marginTop: 8 } : null
                      ]}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={currentQuestionIndex === 0 ? '#ccc' : '#6366f1'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>السابق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === questions.length - 1 ? 'مراجعة' : 'التالي'}
          </Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    lineHeight: 28,
    marginBottom: 16,
  },
  questionImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.2,
    borderRadius: 12,
    marginBottom: 15,
    marginTop: 0,
  },
  questionImageOnly: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 15,
    marginTop: 0,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  optionContentCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  optionChoiceImage: {
    width: width - 100,
    maxWidth: '100%',
    height: 120,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  optionCircleSelected: {
    backgroundColor: '#6366f1',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  optionLetterSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  optionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  prevButton: {
    backgroundColor: '#f3f4f6',
  },
  nextButton: {
    backgroundColor: '#6366f1',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Review styles
  reviewContent: {
    flex: 1,
    padding: 16,
  },
  reviewSummaryBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  reviewSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  reviewStatItem: {
    alignItems: 'center',
  },
  reviewStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  reviewStatWarning: {
    color: '#f59e0b',
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  reviewStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  reviewWarningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  reviewWarningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '600',
  },
  reviewInstructions: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  reviewInstructionsText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 12,
  },
  reviewStats: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  reviewStatsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  reviewQuestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderRightWidth: 4,
  },
  reviewCardAnswered: {
    borderRightColor: '#22c55e',
  },
  reviewCardUnanswered: {
    borderRightColor: '#fbbf24',
  },
  reviewQuestionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewQuestionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  reviewNumberAnswered: {
    backgroundColor: '#22c55e',
  },
  reviewNumberUnanswered: {
    backgroundColor: '#fbbf24',
  },
  reviewNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  reviewNumberTextAnswered: {
    color: '#fff',
  },
  reviewQuestionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewQuestionTitleContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewStatusAnswered: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  reviewStatusUnanswered: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  reviewEditHint: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  reviewEditHintText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  submitButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewQuestionText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 22,
  },
  reviewAnswerSection: {
    marginTop: 8,
  },
  reviewSelectedAnswer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
  },
  reviewAnswerLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  reviewAnswerText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
    textAlign: 'right',
  },
  reviewNoAnswer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
  },
  reviewNoAnswerText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'right',
    fontWeight: '600',
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  reviewItem: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewItemAnswered: {
    backgroundColor: '#22c55e',
  },
  reviewItemUnanswered: {
    backgroundColor: '#e5e7eb',
  },
  reviewItemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewItemTextAnswered: {
    color: '#fff',
  },
  reviewItemTextUnanswered: {
    color: '#666',
  },
  reviewLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  reviewFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Results styles
  resultsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  resultCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultCardPassed: {
    backgroundColor: '#dcfce7',
  },
  resultCardFailed: {
    backgroundColor: '#fee2e2',
  },
  resultIconContainer: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreTextPassed: {
    color: '#22c55e',
  },
  scoreTextFailed: {
    color: '#ef4444',
  },
  scoreDetails: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  passingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  tipsContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
    textAlign: 'right',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 15,
    color: '#0c4a6e',
    textAlign: 'right',
    lineHeight: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderRightWidth: 4,
  },
  summaryCorrect: {
    borderRightColor: '#22c55e',
  },
  summaryWrong: {
    borderRightColor: '#ef4444',
  },
  summaryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  summaryIconCorrect: {
    backgroundColor: '#22c55e',
  },
  summaryIconWrong: {
    backgroundColor: '#ef4444',
  },
  summaryNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryQuestion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 8,
  },
  summaryAnswers: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryAnswersContainer: {
    marginTop: 8,
  },
  answerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  answerValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  correctAnswerRow: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  correctAnswerLabel: {
    fontSize: 13,
    color: '#166534',
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  correctAnswerValue: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summaryAnswerLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
  },
  correctText: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  wrongText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
