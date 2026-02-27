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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import HtmlRenderer from '../components/HtmlRenderer';

export default function PlacementTestScreen({ navigation, route }) {
  const { userData } = route.params || {};
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('quantitative'); // 'quantitative' or 'verbal'
  const [quantitativeQuestions, setQuantitativeQuestions] = useState([]);
  const [verbalQuestions, setVerbalQuestions] = useState([]);

  useEffect(() => {
    fetchPlacementTestQuestions();
  }, []);

  const fetchPlacementTestQuestions = async () => {
    try {
      // جلب الأسئلة الكمية
      const { data: quantData, error: quantError } = await supabase
        .from('placement_test_questions')
        .select('*')
        .eq('type', 'quantitative')
        .order('order_index');

      if (quantError) throw quantError;

      // جلب الأسئلة اللفظية
      const { data: verbalData, error: verbalError } = await supabase
        .from('placement_test_questions')
        .select('*')
        .eq('type', 'verbal')
        .order('order_index');

      if (verbalError) throw verbalError;

      setQuantitativeQuestions(quantData || []);
      setVerbalQuestions(verbalData || []);
      setQuestions(quantData || []);
    } catch (error) {
      console.error('Error fetching placement test questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      alert('الرجاء اختيار إجابة');
      return;
    }

    const currentQuestions = currentSection === 'quantitative' ? quantitativeQuestions : verbalQuestions;
    const isCorrect = selectedAnswer === currentQuestions[currentQuestionIndex].correct_answer;
    const newAnswers = [...answers, {
      question: currentQuestions[currentQuestionIndex],
      userAnswer: selectedAnswer,
      isCorrect: isCorrect,
      section: currentSection
    }];
    setAnswers(newAnswers);

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // إذا انتهى القسم الكمي، انتقل للقسم اللفظي
      if (currentSection === 'quantitative' && verbalQuestions.length > 0) {
        setCurrentSection('verbal');
        setQuestions(verbalQuestions);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
      } else {
        // انتهى الامتحان - احسب النتائج
        await saveResults(newAnswers);
      }
    }
  };

  const saveResults = async (allAnswers) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('الرجاء تسجيل الدخول أولاً');
        return;
      }

      // حساب نتائج القسم الكمي
      const quantAnswers = allAnswers.filter(a => a.section === 'quantitative');
      const quantCorrect = quantAnswers.filter(a => a.isCorrect).length;
      const quantTotal = quantAnswers.length;
      const quantPercentage = quantTotal > 0 ? Math.round((quantCorrect / quantTotal) * 100) : 0;

      // حساب نتائج القسم اللفظي
      const verbalAnswers = allAnswers.filter(a => a.section === 'verbal');
      const verbalCorrect = verbalAnswers.filter(a => a.isCorrect).length;
      const verbalTotal = verbalAnswers.length;
      const verbalPercentage = verbalTotal > 0 ? Math.round((verbalCorrect / verbalTotal) * 100) : 0;

      // حفظ النتائج
      const { error } = await supabase
        .from('placement_test_results')
        .upsert({
          user_id: user.id,
          quantitative_score: quantCorrect,
          quantitative_total: quantTotal,
          quantitative_percentage: quantPercentage,
          verbal_score: verbalCorrect,
          verbal_total: verbalTotal,
          verbal_percentage: verbalPercentage,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // الانتقال لصفحة النتائج
      navigation.replace('PlacementTestResults', {
        quantitativeScore: quantCorrect,
        quantitativeTotal: quantTotal,
        quantitativePercentage: quantPercentage,
        verbalScore: verbalCorrect,
        verbalTotal: verbalTotal,
        verbalPercentage: verbalPercentage,
        userData: userData
      });
    } catch (error) {
      console.error('Error saving placement test results:', error);
      alert('حدث خطأ أثناء حفظ النتائج');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>جاري تحميل امتحان تحديد المستوى...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>امتحان تحديد المستوى</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد أسئلة متاحة حالياً</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = quantitativeQuestions.length + verbalQuestions.length;
  const currentOverallIndex = currentSection === 'quantitative' 
    ? currentQuestionIndex 
    : quantitativeQuestions.length + currentQuestionIndex;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>امتحان تحديد المستوى</Text>
        <Text style={styles.sectionTitle}>
          {currentSection === 'quantitative' ? '📊 القسم الكمي' : '📝 القسم اللفظي'}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentOverallIndex + 1) / totalQuestions) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>
            السؤال {currentQuestionIndex + 1} من {questions.length}
          </Text>
          
          {/* عرض نص السؤال إذا كان موجوداً */}
          {currentQuestion.question_text && currentQuestion.question_text.trim() !== '' && (
            <HtmlRenderer html={currentQuestion.question_text} style={styles.questionText} />
          )}
          
          {/* عرض صورة السؤال إذا كانت موجودة */}
          {currentQuestion.question_image_url && (
            <Image 
              source={{ uri: currentQuestion.question_image_url }} 
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.optionsContainer}>
            {['A', 'B', 'C', 'D'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.optionButtonSelected
                ]}
                onPress={() => setSelectedAnswer(option)}
              >
                <View style={[
                  styles.optionCircle,
                  selectedAnswer === option && styles.optionCircleSelected
                ]} />
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.optionTextSelected
                  ]}>
                    {option}.{' '}
                  </Text>
                  <View style={{ flex: 1 }}>
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
            ))}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < questions.length - 1 
                ? 'التالي' 
                : (currentSection === 'quantitative' && verbalQuestions.length > 0 
                    ? 'الانتقال للقسم اللفظي' 
                    : 'إنهاء الامتحان')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
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
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
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
});
