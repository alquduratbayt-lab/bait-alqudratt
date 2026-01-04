import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// أيقونة الشمس
const SunIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={4} stroke="#1e3a5f" strokeWidth={2} fill="none" />
    <Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#1e3a5f" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة النقطة الخضراء
const GreenDot = () => (
  <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
    <Circle cx={5} cy={5} r={4} fill="#22c55e" />
  </Svg>
);

// أيقونة الجرس الصغيرة
const SmallBellIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة الرئيسية
const HomeIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
    <Path d="M9 22V12h6v10" stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} />
  </Svg>
);

// أيقونة الإحصائيات
const StatsIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={14} width={4} height={6} rx={1} stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
    <Rect x={10} y={10} width={4} height={10} rx={1} stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
    <Rect x={16} y={6} width={4} height={14} rx={1} stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
  </Svg>
);

// أيقونة الجرس
const BellIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة حسابي
const ProfileIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} />
    <Circle cx={12} cy={7} r={4} stroke={active ? '#2196F3' : '#94a3b8'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
  </Svg>
);

export default function ParentHomeScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats] = useState({
    totalVideos: 0,
    completedLessons: 0,
    completedExams: 0,
    averageScore: 0,
    performanceLevel: 'جديد',
    lastLogin: null,
    recentActivities: []
  });

  useEffect(() => {
    fetchParentAndStudentData();
  }, []);

  // إعادة جلب البيانات عند العودة للصفحة
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchParentAndStudentData();
    });

    return unsubscribe;
  }, [navigation]);

  // Real-time subscription لمراقبة طلبات الموافقة الجديدة
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // الاشتراك في تغييرات جدول users للطلاب المرتبطين بولي الأمر
      const subscription = supabase
        .channel('parent-students-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'users',
            filter: `parent_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            // إعادة جلب البيانات عند أي تغيير
            fetchParentAndStudentData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupRealtimeSubscription();
  }, []);

  const fetchParentAndStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      // جلب بيانات ولي الأمر
      const { data: parent, error: parentError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (parentError) throw parentError;
      setParentData(parent);

      // جلب الابن المختار من AsyncStorage
      const selectedChildId = await AsyncStorage.getItem('selectedChildId');

      // جلب بيانات الطالب المرتبط بولي الأمر
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('*')
        .eq('parent_id', user.id)
        .eq('type', 'student')
        .eq('approval_status', 'approved');

      if (studentsError) throw studentsError;

      if (students && students.length > 0) {
        // إذا كان هناك ابن محدد، استخدمه، وإلا استخدم الأول
        let student;
        if (selectedChildId) {
          student = students.find(s => s.id === selectedChildId) || students[0];
        } else {
          student = students[0];
          // حفظ الابن الأول كافتراضي
          await AsyncStorage.setItem('selectedChildId', student.id);
        }
        
        setStudentData(student);

        // جلب إحصائيات الطالب
        await fetchStudentStats(student.id, student.updated_at);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async (studentId, studentUpdatedAt) => {
    try {
      // جلب تقدم الطالب
      const { data: progress, error: progressError } = await supabase
        .from('student_progress')
        .select(`
          *,
          lessons (
            id,
            title,
            subject_id,
            subjects (name)
          )
        `)
        .eq('user_id', studentId);

      if (progressError) throw progressError;

      console.log('Progress data:', JSON.stringify(progress, null, 2));
      console.log('Progress count:', progress?.length);
      console.log('Sample record:', progress[0]);
      console.log('Student updated_at:', studentUpdatedAt);

      // حساب الإحصائيات
      // الدروس المكتملة = الدروس التي نجح فيها الطالب في الامتحان
      const completedLessons = progress.filter(p => p.passed === true).length;
      
      // عدد الفيديوهات المشاهدة = الدروس التي لها last_watched_at
      const totalVideos = progress.filter(p => p.last_watched_at).length;
      
      // عدد الامتحانات المكتملة
      const completedExams = progress.filter(p => p.exam_score !== null && p.exam_score !== undefined).length;
      
      console.log('Stats:', { completedLessons, totalVideos, completedExams });
      
      const examScores = progress
        .filter(p => p.exam_score !== null && p.total_questions !== null && p.total_questions > 0)
        .map(p => ({
          score: p.exam_score,
          total: p.total_questions,
          percentage: (p.exam_score / p.total_questions) * 100
        }))
        .filter(exam => !isNaN(exam.percentage) && isFinite(exam.percentage));
      
      const averageScore = examScores.length > 0
        ? Math.round(examScores.reduce((sum, exam) => sum + exam.percentage, 0) / examScores.length)
        : 0;
      
      console.log('Exam scores:', examScores);
      console.log('Average score:', averageScore);

      // آخر دخول - استخدام أحدث نشاط من الطالب
      const allActivities = [
        studentUpdatedAt,
        ...progress.map(p => p.last_watched_at),
        ...progress.map(p => p.completed_at)
      ].filter(Boolean);
      
      const lastLoginTime = allActivities.length > 0
        ? allActivities.sort((a, b) => new Date(b) - new Date(a))[0]
        : studentUpdatedAt;

      // النشاطات الأخيرة
      const recentActivities = progress
        .filter(p => p.last_watched_at || p.completed_at)
        .sort((a, b) => {
          const dateA = new Date(a.last_watched_at || a.completed_at);
          const dateB = new Date(b.last_watched_at || b.completed_at);
          return dateB - dateA;
        })
        .slice(0, 3)
        .map(p => {
          // تحديد نوع النشاط
          let activityText = '';
          let activityTime = '';
          
          if (p.passed && p.completed_at) {
            activityText = `أتم درس: "${p.lessons?.title || 'درس'}" في ${p.lessons?.subjects?.name || 'مادة'} (درجة: ${p.exam_score}/${p.total_questions})`;
            activityTime = formatTime(p.completed_at);
          } else if (p.last_watched_at) {
            activityText = `شاهد درس: "${p.lessons?.title || 'درس'}" في ${p.lessons?.subjects?.name || 'مادة'}`;
            activityTime = formatTime(p.last_watched_at);
          }
          
          return {
            time: activityTime,
            text: activityText,
            type: p.passed ? 'completed' : 'watched'
          };
        });

      // حساب المستوى بناءً على التقدم
      const performanceLevel = calculatePerformanceLevel({
        completedLessons,
        totalLessons: progress.length,
        averageScore,
        completedExams
      });

      setStats({
        totalVideos,
        completedLessons,
        completedExams,
        averageScore,
        performanceLevel,
        lastLogin: lastLoginTime,
        recentActivities
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // التحقق من صحة التاريخ
      if (isNaN(date.getTime())) return '';
      
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      return `منذ ${diffDays} يوم`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const calculatePerformanceLevel = ({ completedLessons, totalLessons, averageScore, completedExams }) => {
    // إذا لم يكمل أي درس
    if (completedLessons === 0) return 'جديد';
    
    // حساب نسبة الإكمال
    const completionRate = (completedLessons / totalLessons) * 100;
    
    // المستوى بناءً على المعدل ونسبة الإكمال
    if (averageScore >= 90 && completionRate >= 80) return 'ممتاز';
    if (averageScore >= 80 && completionRate >= 60) return 'جيد جداً';
    if (averageScore >= 70 && completionRate >= 40) return 'جيد';
    if (averageScore >= 60 && completionRate >= 20) return 'مقبول';
    if (completedLessons > 0 && averageScore < 60) return 'يحتاج تحسين';
    
    return 'في التقدم';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const parentName = parentData?.name || 'ولي الأمر';

  const handleTabPress = (tab) => {
    if (tab === 'home') return;
    if (tab === 'children') navigation.replace('ParentChildren', { parentName });
    if (tab === 'stats') navigation.navigate('ParentReports', { parentName });
    if (tab === 'notifications') navigation.navigate('ParentNotifications', { parentName });
    if (tab === 'profile') navigation.navigate('ParentProfile', { parentName });
  };

  const handleRemindStudent = async () => {
    if (!studentData) return;

    try {
      const { sendStudyReminderToStudent } = require('../lib/notificationService');
      const success = await sendStudyReminderToStudent(studentData.id, parentName);
      
      if (success) {
        alert('تم إرسال التذكير للطالب بنجاح ✅');
      } else {
        alert('حدث خطأ أثناء إرسال التذكير');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('حدث خطأ أثناء إرسال التذكير');
    }
  };

  const isInactive24Hours = () => {
    if (!stats.lastLogin) return true;
    
    const lastActivity = new Date(stats.lastLogin);
    const now = new Date();
    const diffMinutes = (now - lastActivity) / (1000 * 60);
    
    // للاختبار: دقيقة واحدة بدلاً من 24 ساعة
    return diffMinutes >= 1;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <SunIcon />
            <Text style={styles.greetingText}>صباح الخير</Text>
          </View>
          <Text style={styles.parentName}>{parentName}</Text>
        </View>

        {/* بطاقة آخر دخول */}
        {studentData && (
          <View style={styles.lastLoginCard}>
            <View style={styles.lastLoginHeader}>
              <GreenDot />
              <Text style={styles.lastLoginTitle}>آخر دخول - {studentData.name}</Text>
            </View>
            <Text style={styles.lastLoginTime}>
              {stats.lastLogin ? formatTime(stats.lastLogin) : 'لم يسجل دخول بعد'}
            </Text>
            <TouchableOpacity 
              style={[styles.remindButton, !isInactive24Hours() && styles.remindButtonDisabled]}
              onPress={handleRemindStudent}
              disabled={!isInactive24Hours()}
            >
              <SmallBellIcon />
              <Text style={[styles.remindButtonText, !isInactive24Hours() && styles.remindButtonTextDisabled]}>
                {isInactive24Hours() ? 'ذكره بالمذاكرة' : 'نشط مؤخراً'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* تحليل مستوى الطالب */}
        <Text style={styles.sectionTitle}>تحليل مستوى الطالب</Text>
        
        <Text style={styles.percentageText}>{stats.averageScore}%</Text>

        {/* الإحصائيات */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{stats.performanceLevel}</Text>
            <Text style={styles.statTitle}>المستوى الحالي:</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{stats.totalVideos}</Text>
            <Text style={styles.statTitle}>عدد الفيديوهات التي شاهدها:</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{stats.completedLessons}</Text>
            <Text style={styles.statTitle}>عدد الدروس التي تم إنهاؤها:</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{stats.completedExams}</Text>
            <Text style={styles.statTitle}>عدد الامتحانات التي أتمها:</Text>
          </View>
        </View>

        {/* ماذا فعل مؤخراً */}
        <Text style={styles.sectionTitle}>ماذا فعل مؤخراً؟</Text>
        
        <View style={styles.activityContainer}>
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <View 
                key={index} 
                style={[
                  styles.activityItem, 
                  index === stats.recentActivities.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={styles.activityText}>
                  <Text style={styles.activityTime}>{activity.time}: </Text>
                  {activity.text}
                </Text>
                <GreenDot />
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>لا توجد نشاطات حديثة</Text>
          )}
        </View>
      </ScrollView>

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('profile')}
        >
          <ProfileIcon active={false} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('notifications')}
        >
          <BellIcon active={false} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('stats')}
        >
          <StatsIcon active={false} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleTabPress('home')}
        >
          <HomeIcon active={true} />
          <Text style={styles.navTextActive}>الرئيسية</Text>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  greetingSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 14,
    color: '#1e3a5f',
  },
  parentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 4,
  },
  lastLoginCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  lastLoginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  lastLoginTitle: {
    fontSize: 14,
    color: '#1e3a5f',
  },
  lastLoginTime: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 12,
  },
  remindButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  remindButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  remindButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  remindButtonTextDisabled: {
    color: '#e5e7eb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
    marginBottom: 16,
  },
  percentageText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#0ea5e9',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  activityContainer: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  activityText: {
    fontSize: 13,
    color: '#1e3a5f',
    textAlign: 'right',
    lineHeight: 20,
    flex: 1,
  },
  activityTime: {
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  noActivityText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomNav: {
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
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
  },
  navTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});
