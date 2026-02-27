import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LessonCardSkeleton } from '../components/SkeletonLoader';
import SubscriptionModal from '../components/SubscriptionModal';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة القفل
const LockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#fff" strokeWidth={2} />
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة الكتاب
const BookIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 30 30" fill="none">
    <Rect x={5} y={3} width={20} height={5} rx={1} fill="#22c55e" />
    <Rect x={4} y={7} width={22} height={18} rx={2} fill="#dcfce7" stroke="#22c55e" strokeWidth={1} />
    <Path d="M9 12h12M9 16h8" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// أيقونة الرئيسية
const HomeIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} fill={active ? '#e8f4f8' : 'none'} />
    <Path d="M9 22V12h6v10" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} />
  </Svg>
);

// أيقونة الكتب
const BooksIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} fill={active ? '#e8f4f8' : 'none'} />
  </Svg>
);

// أيقونة المنهج
const CurriculumIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} fill={active ? '#e8f4f8' : 'none'} />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} />
  </Svg>
);

// أيقونة حسابي
const ProfileIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} />
    <Circle cx={12} cy={7} r={4} stroke={active ? '#1a5f7a' : '#999'} strokeWidth={2} fill={active ? '#e8f4f8' : 'none'} />
  </Svg>
);

export default function LessonsScreen({ navigation, route }) {
  const { subjectId, title, type, passingPercentage = 80 } = route.params || {};
  const [activeTab, setActiveTab] = useState('home');
  const [lessons, setLessons] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [unlockAllLessons, setUnlockAllLessons] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [completedLessonData, setCompletedLessonData] = useState(null);
  const [finalExamAvailable, setFinalExamAvailable] = useState(false);
  const [allLessonsCompleted, setAllLessonsCompleted] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      // تحديث البيانات عند العودة للصفحة
      if (subjectId) {
        fetchStudentProgress();
      }
    }, [subjectId])
  );

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  const loadData = async () => {
    const subscription = await fetchUserSubscription();
    await fetchLessons(subscription);
    await fetchStudentProgress();
    await checkFinalExamAvailability();
  };

  const checkFinalExamAvailability = async () => {
    try {
      // التحقق من وجود امتحان نهائي مفعّل للمادة
      const { data: examData } = await supabase
        .from('subject_final_exams')
        .select('id, is_active')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .single();

      setFinalExamAvailable(!!examData);
    } catch (error) {
      setFinalExamAvailable(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // جلب مباشر بدون cache - للحصول على حالة الاشتراك اللحظية
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_end, subscription_status, unlock_all_lessons')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // التحقق من انتهاء الاشتراك
      let subscriptionData = { ...data };
      if (data?.subscription_end) {
        const endDate = new Date(data.subscription_end);
        const today = new Date();
        if (endDate < today) {
          // الاشتراك منتهي - نعامله كـ free
          console.log('⚠️ الاشتراك منتهي في:', data.subscription_end);
          subscriptionData.subscription_tier = 'free';
          subscriptionData.isExpired = true;
        }
      }
      
      setUserSubscription(subscriptionData);
      setUnlockAllLessons(data?.unlock_all_lessons || false);
      return subscriptionData;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  };

  const fetchLessons = async (subscription) => {
    try {
      const { fetchWithCache } = require('../lib/cacheService');
      
      const data = await fetchWithCache(
        `lessons_${subjectId}`,
        async () => {
          const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('subject_id', subjectId)
            .order('created_at');
          if (error) throw error;
          return data;
        }
      );

      if (!data) return;
      
      console.log('📚 إجمالي الدروس:', data?.length || 0);
      console.log('🔑 subscription_tier في fetchLessons:', subscription?.subscription_tier);
      
      // عرض جميع الدروس لجميع الطلاب
      // سيتم قفل الدروس غير المجانية في renderLesson
      const filteredLessons = data || [];
      
      if (subscription?.subscription_tier === 'free' || !subscription) {
        console.log('⚠️ الطالب غير مشترك - عرض جميع الدروس (مع قفل غير المجانية)');
      } else {
        console.log('✅ الطالب مشترك (' + subscription?.subscription_tier + ') - عرض جميع الدروس');
      }
      
      console.log('📝 عدد الدروس المعروضة:', filteredLessons.length);
      
      setLessons(filteredLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      // الحصول على المستخدم الحالي من Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in');
        return;
      }

      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setStudentProgress(data || []);
      
      // التحقق من إكمال جميع الدروس
      if (lessons.length > 0 && data) {
        const completedLessons = data.filter(p => p.passed === true);
        const allCompleted = lessons.every(lesson => 
          completedLessons.some(p => p.lesson_id === lesson.id)
        );
        setAllLessonsCompleted(allCompleted);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const isLessonUnlocked = (lessonIndex, lesson) => {
    // إذا كان لدى الطالب صلاحية فتح جميع الدروس
    if (unlockAllLessons) {
      return true;
    }
    
    // إذا كان الطالب غير مشترك، فقط الدرس المجاني مفتوح
    if (userSubscription?.subscription_tier === 'free' || !userSubscription) {
      return lesson?.is_free === true;
    }
    
    // للطلاب المشتركين: الدرس الأول مفتوح دائماً
    if (lessonIndex === 0) return true;
    
    // إذا كان الطالب دخل هذا الدرس من قبل (يوجد سجل تقدم له)، يعني الدرس مفتوح
    const currentLessonProgress = studentProgress.find(p => p.lesson_id === lesson?.id);
    if (currentLessonProgress) {
      return true;
    }
    
    // باقي الدروس تحتاج إكمال الدرس السابق (passed = true)
    const previousLesson = lessons[lessonIndex - 1];
    const previousProgress = studentProgress.find(p => p.lesson_id === previousLesson?.id);
    
    return previousProgress?.passed === true;
  };

  const renderLesson = ({ item, index }) => {
    const unlocked = isLessonUnlocked(index, item);
    const isFreeTier = userSubscription?.subscription_tier === 'free' || !userSubscription;
    const isLockedForFree = isFreeTier && !item.is_free;
    
    // جلب التقدم لهذا الدرس
    const progress = studentProgress.find(p => p.lesson_id === item.id);
    const videoPosition = progress?.video_position || 0;
    
    // تحويل الثواني إلى دقيقة:ثانية
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    return (
      <TouchableOpacity 
        style={[styles.lessonCard, !unlocked && styles.lessonCardLocked]}
        onPress={async () => {
          if (unlocked) {
            // التحقق من اكتمال الدرس (passed يعني نجح سابقاً)
            if (progress?.passed) {
              // جلب نتيجة الدرس
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data: answers } = await supabase
                    .from('video_question_answers')
                    .select('is_correct')
                    .eq('user_id', user.id)
                    .eq('lesson_id', item.id);
                  
                  const total = answers?.length || 0;
                  const correct = answers?.filter(a => a.is_correct).length || 0;
                  
                  setCompletedLessonData({
                    lesson: item,
                    correct,
                    total,
                    videoPosition
                  });
                  setShowCompletedModal(true);
                  return;
                }
              } catch (error) {
                console.error('خطأ في جلب نتيجة الدرس:', error);
              }
            }
            
            // الدرس غير مكتمل - الدخول مباشرة
            navigation.navigate('LessonDetail', { 
              lesson: item,
              subjectId: subjectId,
              passingPercentage: passingPercentage,
              savedPosition: videoPosition
            });
          } else {
            // إذا كان الدرس مقفل بسبب عدم الاشتراك
            if (isLockedForFree) {
              console.log('🔒 محاولة فتح درس مقفل - عرض Modal');
              setShowSubscriptionModal(true);
            } else {
              // الدرس مقفل بسبب عدم إكمال الدرس السابق
              alert('يجب إكمال الدرس السابق بنجاح أولاً');
            }
          }
        }}
      >
        <View style={styles.lessonContent}>
          <View style={styles.lessonLeft}>
            {!unlocked ? (
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#999" strokeWidth={2} />
                <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#999" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            ) : (
              <Text style={styles.lessonNumber}>
                {index + 1}
              </Text>
            )}
          </View>
          <View style={styles.lessonRight}>
            <Text style={[styles.lessonTitle, !unlocked && styles.lessonTitleLocked]}>
              {item.title}
            </Text>
            <View style={styles.subjectRow}>
              <Text style={[styles.lessonSubject, !unlocked && styles.lessonSubjectLocked]}>
                {unlocked ? title : 'مقفل'}
              </Text>
              <BookIcon />
            </View>
            {unlocked && videoPosition > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  ⏱️ توقفت عند: {formatTime(videoPosition)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'books') navigation.navigate('Books');
    if (tab === 'curriculum') navigation.navigate('Curriculum');
    if (tab === 'profile') navigation.navigate('Profile');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ScrollView style={styles.lessonsList} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((item) => (
            <LessonCardSkeleton key={item} />
          ))}
        </ScrollView>
      );
    }

    if (lessons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد دروس في هذه المادة</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.lessonsList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {lessons.map((lesson, index) => (
          <View key={lesson.id || index}>
            {renderLesson({ item: lesson, index })}
          </View>
        ))}
        
        {/* زر الامتحان النهائي */}
        {finalExamAvailable && (
          <TouchableOpacity
            style={[
              styles.finalExamButton,
              !(allLessonsCompleted || unlockAllLessons) && styles.finalExamButtonLocked
            ]}
            onPress={() => {
              if (allLessonsCompleted || unlockAllLessons) {
                navigation.navigate('SubjectFinalExam', {
                  subjectId: subjectId,
                  subjectName: title,
                  passingPercentage: passingPercentage
                });
              } else {
                alert('يجب إكمال جميع الدروس أولاً للدخول للامتحان النهائي');
              }
            }}
          >
            <View style={styles.finalExamContent}>
              <View style={styles.finalExamIcon}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke={(allLessonsCompleted || unlockAllLessons) ? "#fff" : "#999"} strokeWidth={2} />
                </Svg>
              </View>
              <View style={styles.finalExamTextContainer}>
                <Text style={[styles.finalExamTitle, !(allLessonsCompleted || unlockAllLessons) && styles.finalExamTitleLocked]}>
                  الامتحان النهائي
                </Text>
                <Text style={[styles.finalExamSubtitle, !(allLessonsCompleted || unlockAllLessons) && styles.finalExamSubtitleLocked]}>
                  {(allLessonsCompleted || unlockAllLessons) ? 'اضغط للبدء في الامتحان' : 'أكمل جميع الدروس أولاً'}
                </Text>
              </View>
              {!(allLessonsCompleted || unlockAllLessons) && (
                <View style={styles.finalExamLockIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#999" strokeWidth={2} />
                    <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#999" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* قائمة الدروس */}
      {renderContent()}

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribe={() => {
          setShowSubscriptionModal(false);
        }}
        hideSubscribeButton={true}
      />

      {/* Modal الدرس المكتمل */}
      {showCompletedModal && completedLessonData && (
        <View style={styles.modalOverlay}>
          <View style={styles.completedModal}>
            <View style={styles.completedModalIcon}>
              <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} fill="#4CAF50" />
                <Path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            
            <Text style={styles.completedModalTitle}>الدرس مكتمل ✅</Text>
            <Text style={styles.completedModalSubtitle}>{completedLessonData.lesson?.title}</Text>
            
            <View style={styles.completedModalScore}>
              <Text style={styles.completedModalScoreText}>
                نتيجتك: {completedLessonData.total > 0 ? Math.round((completedLessonData.correct / completedLessonData.total) * 100) : 100}%
              </Text>
              <Text style={styles.completedModalScoreDetails}>
                ({completedLessonData.correct}/{completedLessonData.total})
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.completedModalButton}
              onPress={async () => {
                // حذف الإجابات القديمة وبدء مراجعة جديدة
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    // حذف الإجابات القديمة
                    await supabase
                      .from('video_question_answers')
                      .delete()
                      .eq('user_id', user.id)
                      .eq('lesson_id', completedLessonData.lesson.id);
                    
                    // إعادة تعيين حالة الدرس للمراجعة (بدون تغيير passed للحفاظ على فتح الدروس التالية)
                    await supabase
                      .from('student_progress')
                      .update({
                        completed: false,
                        video_position: 0
                      })
                      .eq('user_id', user.id)
                      .eq('lesson_id', completedLessonData.lesson.id);
                  }
                } catch (error) {
                  console.error('خطأ في إعادة تعيين الدرس:', error);
                }
                
                setShowCompletedModal(false);
                
                // تحديث studentProgress محلياً (بدون تغيير passed)
                setStudentProgress(prev => prev.map(p => 
                  p.lesson_id === completedLessonData.lesson.id 
                    ? { ...p, completed: false, video_position: 0 }
                    : p
                ));
                
                // الانتقال للدرس
                navigation.navigate('LessonDetail', { 
                  lesson: completedLessonData.lesson,
                  subjectId: subjectId,
                  passingPercentage: passingPercentage,
                  savedPosition: 0
                });
              }}
            >
              <Text style={styles.completedModalButtonText}>مراجعة الدرس 🔄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.completedModalCloseButton}
              onPress={() => {
                setShowCompletedModal(false);
              }}
            >
              <Text style={styles.completedModalCloseButtonText}>إغلاق ✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
          onPress={() => handleTabPress('profile')}
        >
          <ProfileIcon active={activeTab === 'profile'} />
          {activeTab === 'profile' && <Text style={styles.navTextActive}>حسابي</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'curriculum' && styles.navItemActive]}
          onPress={() => handleTabPress('curriculum')}
        >
          <CurriculumIcon active={activeTab === 'curriculum'} />
          {activeTab === 'curriculum' && <Text style={styles.navTextActive}>المنهج</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'books' && styles.navItemActive]}
          onPress={() => handleTabPress('books')}
        >
          <BooksIcon active={activeTab === 'books'} />
          {activeTab === 'books' && <Text style={styles.navTextActive}>الكتب</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => handleTabPress('home')}
        >
          <HomeIcon active={activeTab === 'home'} />
          {activeTab === 'home' && <Text style={styles.navTextActive}>الرئيسية</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  lessonsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  lessonCardLocked: {
    backgroundColor: '#64748b',
    borderColor: '#64748b',
  },
  lessonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockIcon: {
    marginRight: 4,
  },
  lessonDuration: {
    fontSize: 13,
    color: '#666',
  },
  lessonRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    marginBottom: 6,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonSubject: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  lessonSubjectLocked: {
    color: '#999',
  },
  textWhite: {
    color: '#fff',
  },
  textWhiteLight: {
    color: 'rgba(255,255,255,0.8)',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 6,
  },
  navItemActive: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 20,
  },
  navTextActive: {
    fontSize: 13,
    color: '#1a5f7a',
    fontWeight: '600',
  },
  lessonNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f4f8',
    textAlign: 'center',
    lineHeight: 32,
  },
  lessonTitleLocked: {
    color: '#fff',
  },
  progressContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 12,
    color: '#1a5f7a',
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Skeleton Loader Styles
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  skeletonRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  skeletonTitle: {
    width: '70%',
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubject: {
    width: '40%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  completedModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  completedModalIcon: {
    marginBottom: 15,
  },
  completedModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  completedModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  completedModalScore: {
    backgroundColor: '#f0f9ff',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginBottom: 25,
    alignItems: 'center',
  },
  completedModalScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  completedModalScoreDetails: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  completedModalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedModalCloseButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  completedModalCloseButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Final Exam Button Styles
  finalExamButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finalExamButtonLocked: {
    backgroundColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  finalExamContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  finalExamIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  finalExamTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  finalExamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  finalExamTitleLocked: {
    color: '#666',
  },
  finalExamSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  finalExamSubtitleLocked: {
    color: '#999',
  },
  finalExamLockIcon: {
    marginRight: 8,
  },
});
