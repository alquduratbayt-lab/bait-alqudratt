import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect, Ellipse, G } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';
import { SubjectCardSkeleton } from '../components/SkeletonLoader';

// أيقونة البحث
const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke="#999" strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke="#999" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة علم الأحياء (نبات)
const BiologyIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={55} r={20} fill="#dcfce7" />
    <Path d="M40 60V30" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
    <Ellipse cx={30} cy={35} rx={12} ry={8} fill="#22c55e" transform="rotate(-30 30 35)" />
    <Ellipse cx={50} cy={35} rx={12} ry={8} fill="#22c55e" transform="rotate(30 50 35)" />
    <Ellipse cx={35} cy={25} rx={10} ry={6} fill="#4ade80" transform="rotate(-45 35 25)" />
    <Ellipse cx={45} cy={25} rx={10} ry={6} fill="#4ade80" transform="rotate(45 45 25)" />
    <Circle cx={40} cy={18} r={6} fill="#fbbf24" />
  </Svg>
);

// أيقونة الجغرافيا (كرة أرضية)
const GeographyIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={28} fill="#60a5fa" />
    <Ellipse cx={40} cy={40} rx={28} ry={10} fill="none" stroke="#1d4ed8" strokeWidth={1.5} />
    <Path d="M40 12v56" stroke="#1d4ed8" strokeWidth={1.5} />
    <Path d="M25 20c5 8 5 32 0 40M55 20c-5 8-5 32 0 40" stroke="#1d4ed8" strokeWidth={1.5} />
    <Path d="M20 30c10-3 30-3 40 0M20 50c10 3 30 3 40 0" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
    <Circle cx={35} cy={35} r={8} fill="#22c55e" />
    <Circle cx={50} cy={45} r={5} fill="#22c55e" />
  </Svg>
);

// أيقونة العلوم (صاروخ)
const ScienceIcon = () => (
  <Svg width={60} height={60} viewBox="0 0 80 80" fill="none">
    <Path d="M50 15c-15 5-25 25-25 40l10-5 10 10 5-10c15 0 35-10 40-25-10-5-25-15-40-10z" fill="#f97316" />
    <Path d="M35 55l-10 10 5 5 15-5-10-10z" fill="#ef4444" />
    <Circle cx={55} cy={30} r={6} fill="#fff" />
    <Path d="M20 45c-5 5-8 15-5 20s15 0 20-5" stroke="#f97316" strokeWidth={2} fill="#fbbf24" />
  </Svg>
);

// أيقونة الرئيسية
const HomeIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      stroke={active ? '#2196F3' : '#999'}
      strokeWidth={2}
      fill={active ? '#e3f2fd' : 'none'}
    />
    <Path d="M9 22V12h6v10" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} />
  </Svg>
);

// أيقونة الكتب
const BooksIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
  </Svg>
);

// أيقونة المنهج
const CurriculumIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} />
  </Svg>
);

// أيقونة حسابي
const ProfileIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} />
    <Circle cx={12} cy={7} r={4} stroke={active ? '#2196F3' : '#999'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
  </Svg>
);

export default function CurriculumScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [searchText, setSearchText] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastWatchedLesson, setLastWatchedLesson] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { fetchWithCache } = require('../lib/cacheService');
      const { data: { user } } = await supabase.auth.getUser();

      // جلب جميع البيانات بشكل متوازي (أسرع!)
      const promises = [
        fetchWithCache(
          'curriculum_subjects',
          async () => {
            const { data, error } = await supabase
              .from('subjects')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
          }
        ),
        fetchWithCache(
          'all_lessons_curriculum',
          async () => {
            const { data } = await supabase
              .from('lessons')
              .select('id, subject_id');
            return data;
          }
        )
      ];

      // إضافة تقدم الطالب إذا كان مسجل دخول
      if (user) {
        promises.push(
          fetchWithCache(
            `student_progress_curriculum_${user.id}`,
            async () => {
              const { data, error } = await supabase
                .from('student_progress')
                .select('lesson_id, passed')
                .eq('user_id', user.id);
              if (error) throw error;
              return data || [];
            },
            2 * 60 * 1000
          )
        );
      }

      const results = await Promise.all(promises);
      const subjectsData = results[0];
      const lessonsData = results[1];
      const studentProgress = user ? results[2] : [];

      // تحويل البيانات من Supabase إلى صيغة التطبيق
      const formattedSubjects = subjectsData.map((subject, index) => {
        // حساب عدد الدروس لهذه المادة
        const subjectLessons = lessonsData?.filter(l => l.subject_id === subject.id) || [];
        const totalLessons = subjectLessons.length;

        // حساب عدد الدروس المكتملة
        const completedLessons = subjectLessons.filter(lesson => 
          studentProgress.some(p => p.lesson_id === lesson.id && p.passed)
        ).length;

        // حساب نسبة التقدم
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // تحديد الحالة
        let status = 'لم يبدأ';
        if (completedLessons === totalLessons && totalLessons > 0) {
          status = 'مكتمل';
        } else if (completedLessons > 0) {
          status = 'قيد التنفيذ';
        }

        return {
          id: subject.id,
          title: subject.name,
          subtitle: subject.description || `مادة ${subject.type}`,
          progress: progress,
          total: totalLessons,
          current: completedLessons,
          status: status,
          icon: subject.icon_url || (index % 3 === 0 ? 'biology' : index % 3 === 1 ? 'geography' : 'science'),
          type: subject.type,
        };
      });

      setSubjects(formattedSubjects);

      // جلب آخر درس تمت مشاهدته أو الدرس التالي
      if (user) {
        const { data: lastWatched, error: lastWatchedError } = await supabase
          .from('student_progress')
          .select(`
            lesson_id,
            last_watched_at,
            passed,
            video_position,
            lessons (
              id,
              title,
              subject_id,
              order_index,
              subjects (
                id,
                name,
                passing_percentage
              )
            )
          `)
          .eq('user_id', user.id)
          .not('last_watched_at', 'is', null)
          .order('last_watched_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Last watched data:', lastWatched);
        console.log('Last watched error:', lastWatchedError);

        if (lastWatched && lastWatched.lessons) {
          let lessonToShow = lastWatched.lessons;
          let videoPosition = lastWatched.video_position || 0;
          
          // إذا كان الدرس الأخير مكتمل، ابحث عن الدرس التالي
          if (lastWatched.passed) {
            const { data: nextLesson } = await supabase
              .from('lessons')
              .select(`
                id,
                title,
                subject_id,
                order_index,
                subjects (
                  id,
                  name,
                  passing_percentage
                )
              `)
              .eq('subject_id', lastWatched.lessons.subject_id)
              .gt('order_index', lastWatched.lessons.order_index)
              .order('order_index', { ascending: true })
              .limit(1)
              .single();

            if (nextLesson) {
              lessonToShow = nextLesson;
              videoPosition = 0; // الدرس التالي يبدأ من البداية
            }
          }

          setLastWatchedLesson({
            id: lessonToShow.id,
            title: lessonToShow.title,
            subjectId: lessonToShow.subject_id,
            subjectName: lessonToShow.subjects?.name,
            passingPercentage: lessonToShow.subjects?.passing_percentage || 80,
            videoPosition: videoPosition
          });
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconType) => {
    // إذا كان iconType رابط صورة، عرضها
    if (typeof iconType === 'string' && iconType.startsWith('http')) {
      return (
        <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden' }}>
          <Image source={{ uri: iconType }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      );
    }
    
    // وإلا استخدم الأيقونات الافتراضية
    switch (iconType) {
      case 'biology': return <BiologyIcon />;
      case 'geography': return <GeographyIcon />;
      case 'science': return <ScienceIcon />;
      default: return <BiologyIcon />;
    }
  };

  const getProgressColor = (progress) => {
    if (progress === 0) return '#ef4444';
    if (progress < 50) return '#f97316';
    if (progress < 100) return '#22c55e';
    return '#22c55e';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // فلترة المواد بناءً على البحث فقط
  const getFilteredSubjects = () => {
    if (!searchText.trim()) {
      return subjects;
    }

    return subjects.filter(subject => 
      subject.title.toLowerCase().includes(searchText.toLowerCase()) ||
      subject.subtitle.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const renderSubject = ({ item }) => (
    <TouchableOpacity 
      style={styles.subjectCard}
      onPress={() => navigation.navigate('Lessons', {
        subjectId: item.id,
        title: item.title,
        passingPercentage: 80
      })}
    >
      <View style={styles.subjectContent}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectTitle}>{item.title}</Text>
          <Text style={styles.subjectSubtitle}>{item.subtitle}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.statusText}>{item.status}</Text>
            <View style={[styles.progressDot, { backgroundColor: getProgressColor(item.progress) }]} />
            <Text style={styles.progressPercent}>{item.progress}%</Text>
          </View>
          <Text style={styles.progressCount}>{item.current}/{item.total}</Text>
        </View>
        <View style={styles.iconContainer}>
          {getIcon(item.icon)}
        </View>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${item.progress}%`, backgroundColor: getProgressColor(item.progress) }]} />
      </View>
    </TouchableOpacity>
  );

  const handleTabPress = (tab) => {
    if (tab === 'curriculum') return;
    navigation.replace(tab === 'home' ? 'Home' : tab === 'books' ? 'Books' : tab === 'profile' ? 'Profile' : 'Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المنهج</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* زر متابعة من حيث توقفت */}
      {lastWatchedLesson && (
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('LessonDetail', {
            lesson: { id: lastWatchedLesson.id, title: lastWatchedLesson.title },
            subjectId: lastWatchedLesson.subjectId,
            passingPercentage: lastWatchedLesson.passingPercentage,
            savedPosition: lastWatchedLesson.videoPosition
          })}
        >
          <View style={styles.continueContent}>
            <View style={styles.continueTextContainer}>
              <Text style={styles.continueTitle}>متابعة من حيث توقفت</Text>
              <Text style={styles.continueSubtitle}>{lastWatchedLesson.title}</Text>
              <View style={styles.continueBottomRow}>
                <Text style={styles.continueSubject}>{lastWatchedLesson.subjectName}</Text>
                {lastWatchedLesson.videoPosition > 0 && (
                  <>
                    <Text style={styles.timeSeparator}>•</Text>
                    <Text style={styles.continueTime}>{formatTime(lastWatchedLesson.videoPosition)}</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.playIconContainer}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={11} fill="#2196F3" />
                <Path d="M10 8l6 4-6 4V8z" fill="#fff" />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* حقل البحث */}
      <View style={styles.searchContainer}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث في المنهج"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          textAlign="right"
        />
      </View>

      {/* قائمة المواد */}
      {loading ? (
        <ScrollView style={styles.subjectsList} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((item) => (
            <SubjectCardSkeleton key={item} />
          ))}
        </ScrollView>
      ) : subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد مواد دراسية</Text>
        </View>
      ) : getFilteredSubjects().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد نتائج للفلترة المحددة</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredSubjects()}
          renderItem={renderSubject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.subjectsList}
          showsVerticalScrollIndicator={false}
        />
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
  continueButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  continueContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueTextContainer: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  continueSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  continueSubject: {
    fontSize: 12,
    color: '#666',
  },
  continueBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSeparator: {
    fontSize: 12,
    color: '#999',
  },
  continueTime: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  playIconContainer: {
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#2196F3',
  },
  filterChipIcon: {
    fontSize: 12,
    color: '#2196F3',
  },
  subjectsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subjectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectInfo: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  subjectSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
  },
  progressCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
  },
  navTextActive: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
