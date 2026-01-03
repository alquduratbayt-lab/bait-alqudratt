import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة التقويم
const CalendarIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#0ea5e9" strokeWidth={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke="#0ea5e9" strokeWidth={2} strokeLinecap="round" />
    <Rect x={7} y={14} width={3} height={3} fill="#0ea5e9" />
    <Rect x={14} y={14} width={3} height={3} fill="#0ea5e9" />
  </Svg>
);

// أيقونة الرئيسية
const HomeIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} fill={active ? '#2196F3' : 'none'} />
    <Path d="M9 22V12h6v10" stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} />
  </Svg>
);

// أيقونة التقارير
const ReportsIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={14} width={4} height={6} rx={1} stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} fill={active ? '#2196F3' : 'none'} />
    <Rect x={10} y={10} width={4} height={10} rx={1} stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} fill={active ? '#2196F3' : 'none'} />
    <Rect x={16} y={6} width={4} height={14} rx={1} stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} fill={active ? '#2196F3' : 'none'} />
  </Svg>
);

// أيقونة الجرس
const BellIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة حسابي
const ProfileIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} />
    <Circle cx={12} cy={7} r={4} stroke={active ? '#fff' : '#94a3b8'} strokeWidth={2} fill={active ? '#2196F3' : 'none'} />
  </Svg>
);

const COLORS = ['#1e3a5f', '#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatLastActivity = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function ParentReportsScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [barChartData, setBarChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [stats, setStats] = useState({
    totalHours: 0,
    completedLessons: 0,
    totalLessons: 0,
    completedExams: 0,
    averageScore: 0,
    activeDays: 0,
    avgHoursPerDay: 0,
    lastActivity: null,
    topSubject: null,
    recentLessons: []
  });
  const [alerts, setAlerts] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState(null);
  const [weeklyGoal, setWeeklyGoal] = useState({ target: 10, current: 0, percentage: 0 });
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  // إعادة جلب البيانات عند العودة للصفحة
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReportsData();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchReportsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      // جلب الابن المختار من AsyncStorage
      const selectedChildId = await AsyncStorage.getItem('selectedChildId');

      // جلب بيانات الطالب المرتبط
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

        // جلب بيانات التقدم
        await fetchProgressData(student.id);
      }

      // تعيين التاريخ الحالي
      const today = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(today.toLocaleDateString('ar-SA', options));
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressData = async (studentId) => {
    try {
      // جلب تقدم الطالب مع بيانات المواد
      const { data: progress, error } = await supabase
        .from('student_progress')
        .select(`
          *,
          lessons (
            id,
            title,
            subject_id,
            subjects (id, name)
          )
        `)
        .eq('user_id', studentId);

      if (error) throw error;

      // حساب الإحصائيات الشاملة
      let totalSeconds = 0;
      let completedLessons = 0;
      let completedExams = 0;
      let totalScore = 0;
      let examCount = 0;
      const activeDaysSet = new Set();
      let lastActivityDate = null;
      const subjectHours = {};

      progress.forEach(p => {
        // الدروس المكتملة (كل سجل = درس مكتمل)
        completedLessons++;
        
        // الامتحانات المجتازة
        if (p.passed) {
          completedExams++;
          totalScore += p.exam_score || 0;
          examCount++;
        }
        
        // الأيام النشطة (من completed_at)
        if (p.completed_at) {
          const date = new Date(p.completed_at).toDateString();
          activeDaysSet.add(date);
          
          // آخر نشاط
          if (!lastActivityDate || new Date(p.completed_at) > lastActivityDate) {
            lastActivityDate = new Date(p.completed_at);
          }
        }
        
        // عدد الدروس لكل مادة
        if (p.lessons?.subjects) {
          const subjectName = p.lessons.subjects.name;
          if (!subjectHours[subjectName]) subjectHours[subjectName] = 0;
          subjectHours[subjectName]++; // عدد الدروس بدلاً من الساعات
        }
      });

      // حساب إجمالي الساعات (تقدير: 30 دقيقة لكل درس)
      const totalHours = completedLessons * 0.5; // 30 دقيقة = 0.5 ساعة
      const activeDays = activeDaysSet.size;
      const avgHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0;
      // حساب المعدل كنسبة مئوية
      let totalMaxScore = 0;
      progress.forEach(p => {
        if (p.passed) {
          totalMaxScore += (p.total_questions || 10);
        }
      });
      const averageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
      
      // أكثر مادة (بناءً على عدد الدروس)
      let topSubject = null;
      let maxLessons = 0;
      Object.entries(subjectHours).forEach(([subject, count]) => {
        if (count > maxLessons) {
          maxLessons = count;
          topSubject = { name: subject, lessons: count };
        }
      });

      // آخر 5 دروس
      const recentLessons = progress
        .filter(p => p.completed_at && p.lessons)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 5)
        .map(p => ({
          title: p.lessons.title,
          subject: p.lessons.subjects?.name || 'غير محدد',
          date: new Date(p.completed_at),
          completed: true // كل سجل في student_progress = درس مكتمل
        }));

      setStats({
        totalHours: totalHours.toFixed(1),
        completedLessons,
        totalLessons: progress.length,
        completedExams,
        averageScore: averageScore.toFixed(1),
        activeDays,
        avgHoursPerDay: avgHoursPerDay.toFixed(1),
        lastActivity: lastActivityDate,
        topSubject,
        recentLessons
      });

      // حساب التنبيهات الذكية
      calculateAlerts(lastActivityDate, averageScore, totalHours, activeDays);

      // مقارنة الأداء الشهري
      calculateMonthlyComparison(progress);

      // حساب الهدف الأسبوعي
      calculateWeeklyGoal(progress);

      // تحليل نقاط القوة والضعف
      analyzeStrengthsWeaknesses(progress);

      // ملخص أسبوعي
      calculateWeeklySummary(progress);

      // حساب بيانات الرسم البياني (آخر 7 أيام)
      const last7Days = getLast7Days();
      const chartData = last7Days.map(day => {
        const dayProgress = progress.filter(p => {
          if (!p.completed_at) return false;
          const progressDate = new Date(p.completed_at).toDateString();
          return progressDate === day.date.toDateString();
        });

        // عدد الدروس * 0.5 ساعة (30 دقيقة لكل درس)
        const totalHours = dayProgress.length * 0.5;
        const displayHours = Math.min(totalHours, 10);

        return {
          day: day.label,
          fullDay: day.fullLabel,
          hours: totalHours.toFixed(1),
          green: Math.round(displayHours),
          red: 0,
          blue: 0
        };
      });
      setBarChartData(chartData);

      // حساب بيانات الدائرة (توزيع المواد)
      const subjectsMap = {};
      progress.forEach(p => {
        if (p.lessons?.subjects) {
          const subjectName = p.lessons.subjects.name;
          if (!subjectsMap[subjectName]) {
            subjectsMap[subjectName] = 0;
          }
          subjectsMap[subjectName]++;
        }
      });

      const total = Object.values(subjectsMap).reduce((a, b) => a + b, 0);
      const pieChartData = Object.entries(subjectsMap)
        .map(([label, count], index) => ({
          label,
          percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.percentage - a.percentage);

      setPieData(pieChartData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };

  const calculateAlerts = (lastActivity, avgScore, totalHours, activeDays) => {
    const alertsList = [];
    const now = new Date();
    
    // تنبيه: عدم الدخول لمدة 3 أيام
    if (lastActivity) {
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity >= 3) {
        alertsList.push({
          type: 'warning',
          icon: '⚠️',
          message: `لم يدخل الطالب منذ ${daysSinceActivity} أيام`,
          action: 'ذكّره بالمذاكرة'
        });
      }
    }
    
    // تنبيه: انخفاض المعدل
    if (avgScore > 0 && avgScore < 60) {
      alertsList.push({
        type: 'danger',
        icon: '📉',
        message: `المعدل منخفض (${avgScore}%) - يحتاج تحسين`,
        action: 'عرض التفاصيل'
      });
    }
    
    // تنبيه: نشاط ممتاز
    if (activeDays >= 7 && totalHours >= 10) {
      alertsList.push({
        type: 'success',
        icon: '🎉',
        message: 'أداء ممتاز! الطالب ملتزم بالدراسة',
        action: 'أرسل تشجيع'
      });
    }
    
    setAlerts(alertsList);
  };

  const calculateMonthlyComparison = (progress) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    let currentMonthHours = 0;
    let lastMonthHours = 0;
    
    progress.forEach(p => {
      if (p.completed_at) {
        const date = new Date(p.completed_at);
        const hours = 0.5; // 30 دقيقة لكل درس
        
        if (date.getMonth() === currentMonth) {
          currentMonthHours += hours;
        } else if (date.getMonth() === lastMonth) {
          lastMonthHours += hours;
        }
      }
    });
    
    const change = lastMonthHours > 0 
      ? ((currentMonthHours - lastMonthHours) / lastMonthHours * 100).toFixed(1)
      : 0;
    
    setMonthlyComparison({
      current: currentMonthHours.toFixed(1),
      previous: lastMonthHours.toFixed(1),
      change: parseFloat(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    });
  };

  const calculateWeeklyGoal = (progress) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    
    let weekHours = 0;
    progress.forEach(p => {
      if (p.completed_at) {
        const date = new Date(p.completed_at);
        if (date >= weekStart) {
          weekHours += 0.5; // 30 دقيقة لكل درس
        }
      }
    });
    
    const target = 10;
    const percentage = Math.min((weekHours / target) * 100, 100);
    
    setWeeklyGoal({
      target,
      current: weekHours.toFixed(1),
      percentage: percentage.toFixed(0)
    });
  };

  const analyzeStrengthsWeaknesses = (progress) => {
    const subjectScores = {};
    
    progress.forEach(p => {
      if (p.passed && p.lessons?.subjects) {
        const subject = p.lessons.subjects.name;
        if (!subjectScores[subject]) {
          subjectScores[subject] = { total: 0, count: 0 };
        }
        subjectScores[subject].total += p.exam_score || 0;
        subjectScores[subject].count++;
      }
    });
    
    const subjectAverages = Object.entries(subjectScores).map(([name, data]) => {
      // حساب النسبة المئوية لكل مادة
      const totalQuestions = data.count * 10; // افتراض 10 أسئلة لكل امتحان
      const percentage = (data.total / totalQuestions) * 100;
      return {
        name,
        average: percentage.toFixed(1)
      };
    });
    
    const sorted = subjectAverages.sort((a, b) => b.average - a.average);
    setStrengths(sorted.slice(0, 3));
    setWeaknesses(sorted.slice(-3).reverse());
  };

  const calculateWeeklySummary = (progress) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    let weekLessons = 0;
    let weekExams = 0;
    let weekHours = 0;
    
    progress.forEach(p => {
      if (p.completed_at) {
        const date = new Date(p.completed_at);
        if (date >= weekStart) {
          weekHours += 0.5; // 30 دقيقة لكل درس
          weekLessons++; // كل سجل = درس مكتمل
          if (p.passed) weekExams++;
        }
      }
    });
    
    setWeeklySummary({
      hours: weekHours.toFixed(1),
      lessons: weekLessons,
      exams: weekExams
    });
  };

  const getLast7Days = () => {
    const days = [];
    const dayLabels = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date,
        label: dayLabels[date.getDay()].charAt(0),
        fullLabel: dayLabels[date.getDay()]
      });
    }
    return days;
  };

  const parentName = route?.params?.parentName || 'ولي الأمر';

  const handleTabPress = (tab) => {
    if (tab === 'reports') return;
    if (tab === 'home') navigation.replace('ParentHome', { parentName });
    if (tab === 'notifications') navigation.navigate('ParentNotifications', { parentName });
    if (tab === 'profile') navigation.navigate('ParentProfile', { parentName });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // رسم الدائرة
  const renderPieChart = () => {
    let startAngle = 0;
    const paths = pieData.map((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const endAngle = startAngle + angle;
      
      const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
      const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
      const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
      const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathD = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      startAngle = endAngle;
      
      return <Path key={index} d={pathD} fill={item.color} />;
    });
    
    return (
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <G>{paths}</G>
        <Circle cx={100} cy={100} r={50} fill="#fff" />
      </Svg>
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
        <Text style={styles.headerTitle}>التقارير</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* رسالة توضيحية إذا لم يكن هناك بيانات */}
        {stats.totalHours === 0 ? (
          <View style={styles.emptyStateCard}>
            <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
              <Path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.emptyStateTitle}>لم يبدأ الطالب بعد</Text>
            <Text style={styles.emptyStateText}>لا توجد بيانات دراسية حتى الآن. سيتم عرض التقارير المفصلة بمجرد بدء الطالب بمشاهدة الدروس.</Text>
          </View>
        ) : (
          <>
            {/* بطاقات الإحصائيات */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <Text style={styles.statValue}>{stats.totalHours}</Text>
                <Text style={styles.statLabel}>إجمالي الساعات</Text>
                <Text style={styles.statSubtext}>منذ الاشتراك</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardSuccess]}>
                <Text style={styles.statValue}>{stats.completedLessons}</Text>
                <Text style={styles.statLabel}>دروس مكتملة</Text>
                <Text style={styles.statSubtext}>من {stats.totalLessons}</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardWarning]}>
                <Text style={styles.statValue}>{stats.completedExams}</Text>
                <Text style={styles.statLabel}>امتحانات مجتازة</Text>
                <Text style={styles.statSubtext}>نجاح</Text>
              </View>
              
              <View style={[styles.statCard, styles.statCardInfo]}>
                <Text style={styles.statValue}>{stats.averageScore}%</Text>
                <Text style={styles.statLabel}>المعدل العام</Text>
                <Text style={styles.statSubtext}>للامتحانات</Text>
              </View>
            </View>

            {/* معلومات إضافية */}
            <View style={styles.infoCardsRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardValue}>{stats.activeDays}</Text>
                <Text style={styles.infoCardLabel}>يوم نشط</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardValue}>{stats.avgHoursPerDay}</Text>
                <Text style={styles.infoCardLabel}>متوسط الساعات/يوم</Text>
              </View>
            </View>

            {/* آخر نشاط وأكثر مادة */}
            {stats.lastActivity && (
              <View style={styles.activityCard}>
                <View style={styles.activityRow}>
                  <Text style={styles.activityValue}>{formatLastActivity(stats.lastActivity)}</Text>
                  <Text style={styles.activityLabel}>آخر نشاط:</Text>
                </View>
                {stats.topSubject && (
                  <View style={styles.activityRow}>
                    <Text style={styles.activityValue}>{stats.topSubject.name} ({stats.topSubject.lessons} درس)</Text>
                    <Text style={styles.activityLabel}>أكثر مادة:</Text>
                  </View>
                )}
              </View>
            )}

            {/* التنبيهات الذكية */}
            {alerts.length > 0 && (
              <View style={styles.alertsCard}>
                <Text style={styles.cardTitle}>🔔 تنبيهات</Text>
                {alerts.map((alert, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.alertItem, styles[`alert${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}`]]}
                    onPress={() => {
                      if (alert.type === 'danger') {
                        // عرض نقاط الضعف - التمرير للأسفل
                        Alert.alert('نقاط الضعف', 'تحقق من قسم "يحتاج تحسين" في الأسفل لمعرفة المواد التي تحتاج تحسين.');
                      } else if (alert.type === 'warning') {
                        // تذكير الطالب
                        Alert.alert('تذكير', 'يمكنك إرسال تذكير للطالب من الصفحة الرئيسية.');
                      } else if (alert.type === 'success') {
                        // رسالة تشجيع
                        Alert.alert('تشجيع', 'أحسنت! استمر في هذا الأداء الممتاز 🎉');
                      }
                    }}
                  >
                    <Text style={styles.alertIcon}>{alert.icon}</Text>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                      <Text style={styles.alertAction}>👆 اضغط للتفاصيل</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* مقارنة الأداء الشهري */}
            {monthlyComparison && (
              <View style={styles.comparisonCard}>
                <Text style={styles.cardTitle}>📊 مقارنة الأداء الشهري</Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonValue}>{monthlyComparison.current} ساعة</Text>
                    <Text style={styles.comparisonLabel}>هذا الشهر</Text>
                  </View>
                  <View style={styles.comparisonDivider} />
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonValue}>{monthlyComparison.previous} ساعة</Text>
                    <Text style={styles.comparisonLabel}>الشهر السابق</Text>
                  </View>
                </View>
                <View style={styles.trendContainer}>
                  <Text style={[styles.trendText, monthlyComparison.trend === 'up' ? styles.trendUp : monthlyComparison.trend === 'down' ? styles.trendDown : styles.trendSame]}>
                    {monthlyComparison.trend === 'up' ? '📈 تحسن' : monthlyComparison.trend === 'down' ? '📉 تراجع' : '➡️ ثابت'} {Math.abs(monthlyComparison.change)}%
                  </Text>
                </View>
              </View>
            )}

            {/* الهدف الأسبوعي */}
            <View style={styles.goalCard}>
              <Text style={styles.cardTitle}>🎯 الهدف الأسبوعي</Text>
              <View style={styles.goalProgress}>
                <View style={styles.goalBar}>
                  <View style={[styles.goalFill, { width: `${weeklyGoal.percentage}%` }]} />
                </View>
                <Text style={styles.goalText}>{weeklyGoal.current} / {weeklyGoal.target} ساعات ({weeklyGoal.percentage}%)</Text>
              </View>
            </View>

            {/* ملخص أسبوعي */}
            {weeklySummary && (
              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>📅 ملخص آخر 7 أيام</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{weeklySummary.hours}</Text>
                    <Text style={styles.summaryLabel}>ساعات</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{weeklySummary.lessons}</Text>
                    <Text style={styles.summaryLabel}>دروس</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{weeklySummary.exams}</Text>
                    <Text style={styles.summaryLabel}>امتحانات</Text>
                  </View>
                </View>
              </View>
            )}

            {/* نقاط القوة */}
            {strengths.length > 0 && (
              <View style={styles.strengthsCard}>
                <Text style={styles.cardTitle}>💪 نقاط القوة</Text>
                {strengths.map((item, index) => (
                  <View key={index} style={styles.strengthItem}>
                    <Text style={styles.strengthName}>{item.name}</Text>
                    <Text style={styles.strengthScore}>{item.average}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* نقاط الضعف */}
            {weaknesses.length > 0 && parseFloat(weaknesses[0].average) < 70 && (
              <View style={styles.weaknessesCard}>
                <Text style={styles.cardTitle}>📚 يحتاج تحسين</Text>
                {weaknesses.map((item, index) => (
                  <View key={index} style={styles.weaknessItem}>
                    <Text style={styles.weaknessName}>{item.name}</Text>
                    <Text style={styles.weaknessScore}>{item.average}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* الدروس الأخيرة */}
            {stats.recentLessons.length > 0 && (
              <View style={styles.recentLessonsCard}>
                <Text style={styles.cardTitle}>📖 آخر الدروس المشاهدة</Text>
                {stats.recentLessons.map((lesson, index) => (
                  <View key={index} style={styles.lessonItem}>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonSubject}>{lesson.subject}</Text>
                    </View>
                    <View style={styles.lessonStatus}>
                      {lesson.completed ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>✓ مكتمل</Text>
                        </View>
                      ) : (
                        <View style={styles.inProgressBadge}>
                          <Text style={styles.inProgressText}>جاري</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* سجل الدخول */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>نشاط آخر 7 أيام</Text>
          <CalendarIcon />
        </View>
        <Text style={styles.dateText}>{currentDate}</Text>

        {/* الرسم البياني للأعمدة */}
        <View style={styles.chartCard}>
          <View style={styles.barChartContainer}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>10</Text>
              <Text style={styles.yAxisLabel}>8</Text>
              <Text style={styles.yAxisLabel}>6</Text>
              <Text style={styles.yAxisLabel}>4</Text>
              <Text style={styles.yAxisLabel}>2</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>
            <View style={styles.barsContainer}>
              {barChartData.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    {item.green > 0 ? (
                      <View style={[styles.bar, styles.barGreen, { height: item.green * 14 }]} />
                    ) : (
                      <View style={[styles.bar, styles.barEmpty]} />
                    )}
                  </View>
                  <Text style={styles.xAxisLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.yAxisUnit}>الساعات</Text>
        </View>

        {/* جدول الساعات اليومية */}
        <View style={styles.hoursTableCard}>
          <Text style={styles.tableTitle}>تفاصيل الساعات اليومية</Text>
          {barChartData.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableHours}>{item.hours} ساعة</Text>
              <Text style={styles.tableDay}>{item.fullDay}</Text>
            </View>
          ))}
        </View>

        {/* تقدم المواد الدراسية */}
        <Text style={styles.sectionTitleCenter}>تقدم المواد الدراسية</Text>
        
        <View style={styles.pieChartContainer}>
          <Text style={styles.pieNumber}>{pieData.length}</Text>
          {renderPieChart()}
        </View>

        {/* مفتاح الألوان */}
        <View style={styles.legendContainer}>
          {pieData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <Text style={styles.legendPercentage}>{item.percentage}%</Text>
              <View style={styles.legendLabelContainer}>
                <Text style={styles.legendLabel}>{item.label}</Text>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
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
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleTabPress('reports')}
        >
          <ReportsIcon active={true} />
          <Text style={styles.navTextActive}>التقارير</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('home')}
        >
          <HomeIcon active={false} />
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
    color: '#1e3a5f',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 180,
    marginBottom: 10,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  yAxisUnit: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingBottom: 25,
  },
  barColumn: {
    alignItems: 'center',
  },
  barWrapper: {
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    width: 16,
    borderRadius: 8,
  },
  barGreen: {
    backgroundColor: '#0ea5e9',
  },
  barEmpty: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
  },
  xAxisLabel: {
    fontSize: 13,
    color: '#1e3a5f',
    marginTop: 8,
    fontWeight: '600',
  },
  hoursTableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 16,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableDay: {
    fontSize: 14,
    color: '#1e3a5f',
    fontWeight: '500',
  },
  tableHours: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  sectionTitleCenter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pieNumber: {
    position: 'absolute',
    top: 85,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    zIndex: 1,
  },
  legendContainer: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    color: '#1e3a5f',
  },
  legendPercentage: {
    fontSize: 14,
    color: '#64748b',
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
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    marginVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '500',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  activityValue: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  recentLessonsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 16,
    textAlign: 'right',
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lessonInfo: {
    flex: 1,
    paddingRight: 12,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 4,
    textAlign: 'right',
  },
  lessonSubject: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  lessonStatus: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  inProgressBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ca8a04',
  },
  alertsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  alertWarning: {
    backgroundColor: '#fef3c7',
  },
  alertDanger: {
    backgroundColor: '#fee2e2',
  },
  alertSuccess: {
    backgroundColor: '#dcfce7',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  alertAction: {
    fontSize: 12,
    color: '#64748b',
  },
  comparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  comparisonDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  trendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendUp: {
    color: '#22c55e',
  },
  trendDown: {
    color: '#ef4444',
  },
  trendSame: {
    color: '#64748b',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  goalProgress: {
    marginTop: 16,
  },
  goalBar: {
    height: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 12,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  strengthsCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  strengthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  strengthName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  strengthScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  weaknessesCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  weaknessItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weaknessName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  weaknessScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
  },
});
