import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Alert, Image, SafeAreaView } from 'react-native';
import { Video, Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import Svg, { Circle, Path, Text as SvgText, Rect } from 'react-native-svg';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as ScreenCapture from 'expo-screen-capture';
import HtmlRenderer from '../components/HtmlRenderer';

const { width } = Dimensions.get('window');

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة التشغيل الكبيرة
const PlayIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
    <Circle cx={30} cy={30} r={28} fill="rgba(0,0,0,0.5)" stroke="#fff" strokeWidth={2} />
    <Path d="M24 18l18 12-18 12V18z" fill="#fff" />
  </Svg>
);

// أيقونة التشغيل الصغيرة
const PlaySmallIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M5 3l14 9-14 9V3z" fill="#fff" />
  </Svg>
);

// أيقونة الصوت
const VolumeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M11 5L6 9H2v6h4l5 4V5z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15.54 8.46a5 5 0 010 7.07" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة الإعدادات
const SettingsIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke="#fff" strokeWidth={2} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="#fff" strokeWidth={2} />
  </Svg>
);

// أيقونة ملء الشاشة
const FullscreenIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الكتاب
const BookIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
    {/* الكتاب المفتوح */}
    <Path 
      d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" 
      stroke="#2196F3" 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="#E3F2FD"
    />
    <Path 
      d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" 
      stroke="#2196F3" 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="#E3F2FD"
    />
    {/* خطوط الصفحات */}
    <Path d="M6 8h3M6 12h3" stroke="#2196F3" strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M15 8h3M15 12h3" stroke="#2196F3" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// دالة تنسيق الوقت من ميلي ثانية إلى MM:SS
const formatTime = (millis) => {
  if (!millis || millis < 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// دالة للتحقق من نوع الفيديو
const getVideoType = (url) => {
  if (!url) return 'none';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'direct';
};

// دالة لتحويل رابط YouTube إلى embed
const getYouTubeEmbedUrl = (url) => {
  const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/)?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

// دالة لتحويل رابط Vimeo إلى embed
const getVimeoEmbedUrl = (url) => {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
};

export default function LessonDetailScreen({ navigation, route }) {
  const { lesson, subjectId, passingPercentage, savedPosition: initialPosition } = route.params || { lesson: { id: null, title: 'الدرس' } };
  const [lessonData, setLessonData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [questionResults, setQuestionResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [savedPosition, setSavedPosition] = useState(initialPosition || 0);
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);
  const positionSaveInterval = useRef(null);
  const hasRestoredPosition = useRef(false);
  const videoStatusRef = useRef({});
  const isNavigating = useRef(false);

  // إعداد الصوت ليعمل في وضع الصامت
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        console.log('🔊 تم إعداد الصوت ليعمل في وضع الصامت');
      } catch (error) {
        console.error('خطأ في إعداد الصوت:', error);
      }
    };
    setupAudio();
  }, []);

  // منع تصوير الشاشة عند فتح صفحة الدرس
  useEffect(() => {
    const preventScreenCapture = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        console.log('🔒 تم منع تصوير الشاشة');
      } catch (error) {
        console.error('خطأ في منع تصوير الشاشة:', error);
      }
    };

    preventScreenCapture();

    // السماح بتصوير الشاشة عند مغادرة الصفحة
    return () => {
      ScreenCapture.allowScreenCaptureAsync()
        .then(() => console.log('🔓 تم السماح بتصوير الشاشة'))
        .catch(error => console.error('خطأ في السماح بتصوير الشاشة:', error));
    };
  }, []);

  useEffect(() => {
    if (lesson.id) {
      fetchLessonData();
      updateLastWatched();
      sendLessonStartNotification();
    }
  }, [lesson.id]);

  const sendLessonStartNotification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (userData) {
        const { sendParentLessonStartNotification } = require('../lib/pushNotifications');
        await sendParentLessonStartNotification(user.id, userData.name, lesson.title);
      }
    } catch (error) {
      console.error('Error sending lesson start notification:', error);
    }
  };

  const updateLastWatched = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // جلب موضع الفيديو المحفوظ
      const { data: progress } = await supabase
        .from('student_progress')
        .select('video_position')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single();

      console.log('Fetched saved position:', progress);

      if (progress && progress.video_position > 0) {
        console.log('Setting saved position to:', progress.video_position);
        setSavedPosition(progress.video_position);
      } else {
        console.log('No saved position found or position is 0');
      }

      // تحديث آخر وقت مشاهدة (بدون تغيير video_position)
      if (progress) {
        // إذا كان السجل موجود، نحدث فقط last_watched_at
        await supabase
          .from('student_progress')
          .update({
            last_watched_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('lesson_id', lesson.id);
      } else {
        // إذا لم يكن موجود، ننشئ سجل جديد
        await supabase
          .from('student_progress')
          .insert({
            user_id: user.id,
            lesson_id: lesson.id,
            video_position: 0,
            last_watched_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error updating last watched:', error);
    }
  };

  // فتح الدوران عند الدخول للصفحة وقفله عند الخروج
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔓 فتح الدوران في صفحة الدرس');
      ScreenOrientation.unlockAsync();

      return async () => {
        console.log('🔒 قفل الدوران عند الخروج من صفحة الدرس');
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        console.log('✅ تم قفل الدوران بنجاح');
      };
    }, [])
  );

  // دالة للرجوع مع قفل الشاشة
  const handleGoBack = async () => {
    if (isNavigating.current) {
      console.log('⚠️ جاري الرجوع بالفعل...');
      return;
    }
    
    isNavigating.current = true;
    console.log('🔙 الرجوع للصفحة السابقة...');
    
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      console.log('🔒 تم قفل الشاشة قبل الرجوع');
      navigation.goBack();
    } catch (error) {
      console.error('خطأ في الرجوع:', error);
      isNavigating.current = false;
    }
  };

  useEffect(() => {
    // تحديد الاتجاه الأولي
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);

    // الاستماع للتغييرات
    const subscription = Dimensions.addEventListener('change', async ({ window }) => {
      const { width: w, height: h } = window;
      const landscape = w > h;
      console.log('Orientation changed:', landscape ? 'Landscape' : 'Portrait');
      
      // حفظ موقع الفيديو الحالي قبل تغيير الاتجاه
      const currentStatus = videoStatusRef.current;
      if (currentStatus?.isLoaded && currentStatus?.positionMillis) {
        const currentPosition = Math.floor(currentStatus.positionMillis / 1000);
        console.log('Saving position before orientation change:', currentPosition);
        setSavedPosition(currentPosition);
        
        // إعادة تعيين flag لاستعادة الموقع
        hasRestoredPosition.current = false;
        
        // استعادة الموقع بعد تغيير الاتجاه
        setTimeout(async () => {
          if (videoRef.current && currentPosition > 0) {
            console.log('Restoring position after orientation change:', currentPosition);
            await videoRef.current.setPositionAsync(currentPosition * 1000);
            hasRestoredPosition.current = true;
          }
        }, 100);
      }
      
      setIsLandscape(landscape);
    });

    // حفظ موضع الفيديو كل 5 ثواني
    positionSaveInterval.current = setInterval(() => {
      saveVideoPosition();
    }, 5000);

    return () => {
      subscription?.remove();
      // حفظ موضع الفيديو عند الخروج
      saveVideoPosition();
      // إيقاف الحفظ الدوري
      if (positionSaveInterval.current) {
        clearInterval(positionSaveInterval.current);
      }
    };
  }, []);

  const saveVideoPosition = async () => {
    try {
      const status = videoStatusRef.current;
      console.log('saveVideoPosition called, videoStatus:', {
        isLoaded: status.isLoaded,
        positionMillis: status.positionMillis
      });

      if (!status.isLoaded || status.positionMillis === undefined || status.positionMillis === null) {
        console.log('Skipping save: video not loaded or position not available');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Skipping save: no user');
        return;
      }

      const currentSeconds = Math.floor(status.positionMillis / 1000);
      console.log('Saving video position:', currentSeconds, 'seconds');

      // محاولة التحديث أولاً
      const { error: updateError, count } = await supabase
        .from('student_progress')
        .update({
          video_position: currentSeconds,
          last_watched_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id);

      // إذا لم يتم التحديث (السجل غير موجود)، أنشئ سجل جديد
      if (updateError || count === 0) {
        const { error: insertError } = await supabase
          .from('student_progress')
          .insert({
            user_id: user.id,
            lesson_id: lesson.id,
            video_position: currentSeconds,
            last_watched_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting video position:', insertError);
        } else {
          console.log('Video position inserted successfully:', currentSeconds);
        }
      } else {
        console.log('Video position updated successfully:', currentSeconds);
      }
    } catch (error) {
      console.error('Error saving video position:', error);
    }
  };

  const fetchLessonData = async () => {
    try {
      const { data: lessonInfo, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lesson.id)
        .single();

      if (lessonError) throw lessonError;
      setLessonData(lessonInfo);

      // جلب الأسئلة مع النسخ البديلة
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          question_variants (*)
        `)
        .eq('lesson_id', lesson.id)
        .order('show_at_time');

      if (questionsError) throw questionsError;
      
      // لكل سؤال، اختيار نسخة عشوائية
      const questionsWithVariants = (questionsData || []).map(q => {
        const allVariants = [
          {
            id: q.id,
            question_text: q.question_text,
            question_image_url: q.question_image_url,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer,
            show_at_time: q.show_at_time
          },
          ...(q.question_variants || []).map(v => ({
            id: v.id,
            question_text: v.question_text,
            question_image_url: v.question_image_url,
            option_a: v.options[0],
            option_b: v.options[1],
            option_c: v.options[2],
            option_d: v.options[3],
            correct_answer: ['A', 'B', 'C', 'D'][v.correct_answer],
            show_at_time: q.show_at_time
          }))
        ];
        
        // اختيار نسخة عشوائية
        return allVariants[Math.floor(Math.random() * allVariants.length)];
      });
      
      setQuestions(questionsWithVariants);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPlaybackStatusUpdate = async (status) => {
    setVideoStatus(status);
    videoStatusRef.current = status;
    
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      
      // استعادة موضع الفيديو المحفوظ عند أول تشغيل مرة واحدة فقط
      if (savedPosition > 0 && !hasRestoredPosition.current) {
        console.log('Restoring video position to:', savedPosition, 'seconds');
        hasRestoredPosition.current = true;
        await videoRef.current?.setPositionAsync(savedPosition * 1000);
        setSavedPosition(0);
      }
      
      if (status.positionMillis) {
        const currentSeconds = Math.floor(status.positionMillis / 1000);
        
        const questionToShow = questions.find(
          q => q.show_at_time === currentSeconds && 
               !currentQuestion && 
               !answeredQuestions.has(q.id)
        );

        if (questionToShow) {
          videoRef.current?.pauseAsync();
          setCurrentQuestion(questionToShow);
          setSelectedAnswer(null);
          // قفل الشاشة على الوضع العمودي عند ظهور السؤال
          console.log('Locking screen to portrait for question');
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      }
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const rewind10Seconds = async () => {
    if (videoRef.current && videoStatus.isLoaded) {
      const newPosition = Math.max(0, videoStatus.positionMillis - 10000);
      await videoRef.current.setPositionAsync(newPosition);
    }
  };

  const handleVideoPress = () => {
    setShowControls(true);
    
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) {
      alert('الرجاء اختيار إجابة');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // حفظ نتيجة السؤال
    setQuestionResults(prev => [...prev, {
      question: currentQuestion,
      userAnswer: selectedAnswer,
      isCorrect: isCorrect
    }]);
    
    // إضافة السؤال للأسئلة المجاب عليها
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
    
    // إذا أجاب على جميع الأسئلة
    if (answeredQuestions.size + 1 === questions.length) {
      setTimeout(() => {
        setShowResults(true);
      }, 500);
    }
    
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    
    // فتح الدوران مرة أخرى بعد الإجابة
    console.log('Unlocking screen orientation after answer');
    await ScreenOrientation.unlockAsync();
    
    videoRef.current?.playAsync();
  };

  const goToQuestionTime = async (questionId, timeInSeconds) => {
    // إزالة السؤال من القائمة المجاب عليها ليظهر مرة أخرى
    setAnsweredQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
    
    // إزالة نتيجة السؤال القديمة من questionResults
    setQuestionResults(prev => prev.filter(r => r.question.id !== questionId));
    
    setShowResults(false);
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          // الرجوع 5 ثواني قبل السؤال لفهم السياق
          const targetTime = Math.max(0, (timeInSeconds - 5) * 1000);
          await videoRef.current.setPositionAsync(targetTime);
          await videoRef.current.playAsync();
        } catch (error) {
          console.error('Error seeking video:', error);
        }
      }
    }, 300);
  };

  const correctCount = questionResults.filter(r => r.isCorrect).length;
  const wrongCount = questionResults.length - correctCount;
  const percentage = questionResults.length > 0 ? Math.round((correctCount / questionResults.length) * 100) : 0;

  if (showResults) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        {/* الهيدر */}
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={handleGoBack}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.resultsHeaderTitle}>نتيجتك في الامتحان</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.resultsContent}>
          {/* الرسم الدائري */}
          <View style={styles.chartContainer}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              {/* الدائرة الخضراء (صحيحة) */}
              <Circle
                cx={100}
                cy={100}
                r={80}
                fill="#22c55e"
                stroke="none"
              />
              {/* الدائرة الحمراء (خاطئة) */}
              {wrongCount > 0 && (
                <Path
                  d={`M 100 100 L 100 20 A 80 80 0 ${wrongCount / questionResults.length > 0.5 ? 1 : 0} 1 ${100 + 80 * Math.sin(2 * Math.PI * wrongCount / questionResults.length)} ${100 - 80 * Math.cos(2 * Math.PI * wrongCount / questionResults.length)} Z`}
                  fill="#ef4444"
                />
              )}
              <Circle cx={100} cy={100} r={60} fill="#fff" />
              <Text
                x={100}
                y={105}
                fontSize={32}
                fontWeight="bold"
                fill="#22c55e"
                textAnchor="middle"
              >
                {percentage}%
              </Text>
            </Svg>
          </View>

          {/* الإحصائيات */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.statText}>إجابات صحيحة {correctCount}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.statText}>إجابات خاطئة {wrongCount}</Text>
            </View>
          </View>

          <Text style={styles.scoreTitle}>النتيجة المحسوبة</Text>
          <Text style={styles.scoreValue}>{correctCount * 10} نقاط</Text>

          {/* زر الامتحان النهائي - يظهر فقط عند النجاح الكامل */}
          {percentage === 100 && (
            <TouchableOpacity
              style={styles.examButton}
              onPress={() => navigation.navigate('Exam', { 
                lessonId: lesson.id, 
                lessonTitle: lesson.title,
                subjectId: subjectId,
                passingPercentage: passingPercentage || 80
              })}
            >
              <Text style={styles.examButtonText}>الانتقال إلى الامتحان النهائي</Text>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12h14M12 5l7 7-7 7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          )}

          {/* الأسئلة الصحيحة */}
          {questionResults.filter(r => r.isCorrect).length > 0 && (
            <>
              <Text style={styles.questionsTitle}>إجابات صحيحة:</Text>
              {questionResults.filter(r => r.isCorrect).map((result, index) => (
                <View key={index} style={styles.questionResultCard}>
                  <HtmlRenderer html={result.question.question_text} style={styles.questionResultText} />
                  <View style={styles.answerRow}>
                    <View style={styles.answerIcon}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                    <HtmlRenderer html={result.question[`option_${result.userAnswer.toLowerCase()}`]} style={styles.answerText} />
                  </View>
                </View>
              ))}
            </>
          )}

          {/* الأسئلة الخاطئة */}
          {questionResults.filter(r => !r.isCorrect).length > 0 && (
            <>
              <Text style={styles.questionsTitle}>إجابات خطأ:</Text>
              {questionResults.filter(r => !r.isCorrect).map((result, index) => (
                <View key={index} style={styles.questionResultCard}>
                  <View style={styles.questionResultHeader}>
                    <TouchableOpacity
                      onPress={() => goToQuestionTime(result.question.id, result.question.show_at_time)}
                      style={styles.bookButton}
                    >
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#2196F3" strokeWidth={2} />
                        <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
                      </Svg>
                    </TouchableOpacity>
                    <HtmlRenderer html={result.question.question_text} style={styles.questionResultText} />
                  </View>
                  <View style={styles.answerRow}>
                    <View style={styles.answerIcon}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                    <HtmlRenderer html={result.question[`option_${result.userAnswer.toLowerCase()}`]} style={styles.answerText} />
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  const ContainerComponent = isLandscape ? View : SafeAreaView;
  
  return (
    <ContainerComponent style={styles.container}>
      <StatusBar style="light" hidden={isLandscape} />
      
      {/* قسم الفيديو */}
      <View style={[styles.videoContainer, isLandscape && styles.videoContainerFullscreen]}>
        {loading ? (
          <View style={styles.videoBackground}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : lessonData?.video_url ? (
          <>
            {getVideoType(lessonData.video_url) === 'youtube' ? (
              <WebView
                source={{ uri: getYouTubeEmbedUrl(lessonData.video_url) }}
                style={styles.video}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
              />
            ) : getVideoType(lessonData.video_url) === 'vimeo' ? (
              <WebView
                source={{ uri: getVimeoEmbedUrl(lessonData.video_url) }}
                style={styles.video}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
              />
            ) : (
              <>
                <Video
                  ref={videoRef}
                  source={{ uri: lessonData.video_url }}
                  style={styles.video}
                  resizeMode="contain"
                  shouldPlay={!currentQuestion}
                  useNativeControls={false}
                  onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                  progressUpdateIntervalMillis={500}
                  isMuted={false}
                />
                <TouchableOpacity 
                  style={styles.videoOverlay}
                  activeOpacity={1}
                  onPress={handleVideoPress}
                >
                  {showControls && (
                <View style={styles.controlsOverlay}>
                  <TouchableOpacity 
                    style={styles.rewindButton}
                    onPress={rewind10Seconds}
                  >
                    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={11} fill="rgba(0,0,0,0.8)" stroke="#fff" strokeWidth={1} />
                      <Path 
                        d="M11 8l-4 4 4 4" 
                        stroke="#fff" 
                        strokeWidth={2.5} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      <Path 
                        d="M7 12h10" 
                        stroke="#fff" 
                        strokeWidth={2.5} 
                        strokeLinecap="round" 
                      />
                    </Svg>
                    <View style={styles.rewindBadge}>
                      <Text style={styles.rewindBadgeText}>10s</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={togglePlayPause}
                  >
                    <Svg width={70} height={70} viewBox="0 0 24 24" fill="none">
                      <Circle cx={12} cy={12} r={11} fill="rgba(0,0,0,0.8)" stroke="#fff" strokeWidth={1.5} />
                      {isPlaying ? (
                        <>
                          <Rect x={9} y={7} width={2} height={10} fill="#fff" />
                          <Rect x={13} y={7} width={2} height={10} fill="#fff" />
                        </>
                      ) : (
                        <Path d="M10 7l7 5-7 5V7z" fill="#fff" />
                      )}
                    </Svg>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <View style={styles.videoBackground}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.placeholderText}>لا يوجد فيديو</Text>
            </View>
          </View>
        )}

        {/* زر الرجوع */}
        {showControls && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
          >
            <BackIcon />
          </TouchableOpacity>
        )}
      </View>

      {/* قسم المحتوى */}
      {!isLandscape && (
        <View style={styles.contentWrapper}>
          {/* شريط التقدم والوقت - فوق المحتوى */}
          {videoStatus?.isLoaded && (
            <View style={styles.progressContainerAbsolute}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, ((videoStatus.positionMillis || 0) / (videoStatus.durationMillis || 1)) * 100)}%` }
                  ]} 
                />
              </View>
              <View style={styles.timeBubbleContainer}>
                <View style={styles.timeBubble}>
                  <Text style={styles.timeText}>
                    {formatTime(videoStatus.positionMillis || 0)} / {formatTime(videoStatus.durationMillis || 0)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {currentQuestion ? (
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>سؤال</Text>
            
            {currentQuestion.question_image_url ? (
              <Image 
                source={{ uri: currentQuestion.question_image_url }} 
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : (
              <HtmlRenderer 
                html={currentQuestion.question_text} 
                style={styles.questionText}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
              style={styles.submitButton}
              onPress={handleAnswerSubmit}
            >
              <Text style={styles.submitButtonText}>تأكيد الإجابة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitingSection}>
            <BookIcon />
            <Text style={styles.waitingTitle}>ابدأ بمشاهدة الفيديو</Text>
            <Text style={styles.waitingText}>ستظهر الأسئلة تلقائياً أثناء تقدمك في الدرس</Text>
          </View>
        )}
          </ScrollView>
        </View>
      )}
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    videoContainer: {
      width: '100%',
      height: 250,
      backgroundColor: '#1a1a2e',
      position: 'relative',
    },
    videoContainerFullscreen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
    },
    contentWrapper: {
      flex: 1,
      position: 'relative',
    },
    progressContainerAbsolute: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#dee2e6',
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
    },
    progressBar: {
      height: 6,
      backgroundColor: '#dee2e6',
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#2196F3',
      borderRadius: 3,
    },
    timeBubbleContainer: {
      alignItems: 'center',
    },
    timeBubble: {
      backgroundColor: '#2196F3',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: '#2196F3',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    timeText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    videoBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    videoPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#2d3748',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: '#fff',
      fontSize: 18,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 8,
    },
    videoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlsOverlay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 30,
    },
    controlButton: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    controlButtonText: {
      position: 'absolute',
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    rewindButton: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    rewindBadge: {
      position: 'absolute',
      bottom: -5,
      backgroundColor: '#2196F3',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    rewindBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    playButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginLeft: -30,
      marginTop: -30,
    },
    controlsBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    controlsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    controlsRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    controlButton: {
      padding: 8,
    },
    progressDot: {
      position: 'absolute',
      left: '60%',
      top: -4,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#fff',
      marginLeft: -6,
    },
    content: {
      flex: 1,
      backgroundColor: '#fff',
    },
    contentContainer: {
      flexGrow: 1,
      paddingTop: 90,
    },
    waitingSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 40,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 30,
    },
    waitingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginTop: 20,
      marginBottom: 8,
    },
    waitingText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      lineHeight: 22,
    },
    questionsCount: {
      fontSize: 14,
      color: '#2196F3',
      marginTop: 10,
      fontWeight: '600',
    },
    questionContainer: {
      padding: 20,
    },
    questionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2196F3',
      marginBottom: 10,
      textAlign: 'right',
    },
    questionText: {
      fontSize: 16,
      color: '#333',
      marginBottom: 20,
      textAlign: 'right',
      lineHeight: 24,
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
      borderColor: '#2196F3',
      backgroundColor: '#e3f2fd',
    },
    optionCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#e0e0e0',
      marginLeft: 10,
    },
    optionCircleSelected: {
      borderColor: '#2196F3',
      backgroundColor: '#2196F3',
    },
    optionText: {
      fontSize: 16,
      color: '#333',
      textAlign: 'right',
    },
    optionTextSelected: {
      color: '#2196F3',
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: '#2196F3',
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    questionImage: {
      width: '100%',
      height: 200,
      marginBottom: 20,
      borderRadius: 10,
    },
    video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2d3748',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 18,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  controlButtonText: {
    position: 'absolute',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewindButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rewindBadge: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rewindBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  progressDot: {
    position: 'absolute',
    left: '60%',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: -6,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  waitingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  questionsCount: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 10,
    fontWeight: '600',
  },
  questionContainer: {
    padding: 20,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
    textAlign: 'right',
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'right',
    lineHeight: 24,
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
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
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
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  resultsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resultsContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  scoreTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  questionResultCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questionResultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookButton: {
    padding: 5,
    marginLeft: 10,
  },
  questionResultText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'right',
    lineHeight: 28,
    marginBottom: 20,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerIcon: {
    marginLeft: 10,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  examButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
