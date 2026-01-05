import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileCardSkeleton } from '../components/SkeletonLoader';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة السهم للأمام
const ChevronIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة النجمة
const StarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="#fbbf24">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

// أيقونة التقويم
const CalendarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#22c55e" strokeWidth={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// أيقونة التشغيل
const PlayIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 3l14 9-14 9V3z" fill="#3b82f6" />
  </Svg>
);

// أيقونة الاشتراك
const SubscriptionIcon = ({ active }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 2L2 7l10 5 10-5-10-5z" 
      stroke={active ? "#22c55e" : "#ef4444"} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={active ? "#22c55e" : "none"}
    />
    <Path 
      d="M2 17l10 5 10-5M2 12l10 5 10-5" 
      stroke={active ? "#22c55e" : "#ef4444"} 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة تسجيل الخروج
const LogoutIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة حذف الحساب
const DeleteIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة المستخدم (صورة افتراضية)
const UserAvatar = ({ imageUri }) => {
  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: 80, height: 80, borderRadius: 40 }}
      />
    );
  }
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={40} fill="#e0e7ff" />
      <Circle cx={40} cy={32} r={14} fill="#6366f1" />
      <Path d="M15 70c0-14 11-25 25-25s25 11 25 25" fill="#6366f1" />
    </Svg>
  );
};

// أيقونة الرئيسية
const HomeIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={active ? '#2196F3' : '#999'} strokeWidth={2} fill={active ? '#e3f2fd' : 'none'} />
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

const menuItems = [
  { id: '1', title: 'التفاصيل الشخصية' },
  { id: '2', title: 'النقاط' },
  { id: '3', title: 'لحظات هدوء' },
  { id: '4', title: 'الاشتراكات', screen: 'Subscriptions' },
  { id: '5', title: 'الدعم الفني' },
];

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    completedLessons: 0,
    totalLessons: 0,
    averageScore: 0,
    daysLearning: 0,
    totalPoints: 0,
    subscriptionStatus: 'غير مشترك',
    daysRemaining: 0,
    isSubscribed: false
  });

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      const { fetchWithCache } = require('../lib/cacheService');

      // جلب جميع البيانات بشكل متوازي (أسرع!)
      const [userInfo, progressData, totalLessons] = await Promise.all([
        fetchWithCache(
          `user_profile_${user.id}`,
          async () => {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            if (error) throw error;
            return data;
          },
          2 * 60 * 1000
        ),
        fetchWithCache(
          `student_progress_profile_${user.id}`,
          async () => {
            const { data } = await supabase
              .from('student_progress')
              .select('lesson_id, passed, score')
              .eq('user_id', user.id);
            return data;
          },
          2 * 60 * 1000
        ),
        fetchWithCache(
          'total_lessons_count',
          async () => {
            const { count } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true });
            return count;
          }
        )
      ]);

      setUserData({
        name: userInfo?.name || user.email?.split('@')[0] || 'مستخدم',
        phone: userInfo?.phone || '',
        avatar: userInfo?.avatar_url,
        profileImage: userInfo?.profile_image || null
      });

      // حساب حالة الاشتراك والأيام المتبقية
      let subscriptionStatus = 'غير مشترك';
      let daysRemaining = 0;
      let isSubscribed = false;

      if (userInfo?.subscription_status === 'active' && userInfo?.subscription_end) {
        const endDate = new Date(userInfo.subscription_end);
        const today = new Date();
        const diffTime = endDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 0) {
          subscriptionStatus = 'مشترك';
          isSubscribed = true;
        } else {
          subscriptionStatus = 'منتهي';
        }
      }

      // حساب الإحصائيات
      const completedLessons = progressData?.filter(p => p.passed).length || 0;
      const scores = progressData?.filter(p => p.score != null).map(p => p.score) || [];
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      // حساب أيام التعلم (من تاريخ إنشاء الحساب)
      const createdAt = new Date(user.created_at);
      const today = new Date();
      const daysLearning = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));

      // جلب النقاط الحقيقية من جدول user_points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      const totalPoints = pointsData?.total_points || 0;

      setStats({
        completedLessons,
        totalLessons: totalLessons || 0,
        averageScore,
        daysLearning,
        totalPoints,
        subscriptionStatus,
        daysRemaining,
        isSubscribed
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab) => {
    if (tab === 'profile') return;
    navigation.replace(tab === 'home' ? 'Home' : tab === 'books' ? 'Books' : tab === 'curriculum' ? 'Curriculum' : 'Home');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // مسح الـ navigation stack والتوجيه إلى صفحة اختيار نوع المستخدم
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      // حتى في حالة الخطأ، نوجه المستخدم إلى صفحة اختيار نوع المستخدم
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ \n\nسيتم حذف جميع بياناتك وتقدمك الدراسي ولن تتمكن من استرجاعها.',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف الحساب',
          style: 'destructive',
          onPress: confirmDeleteAccount
        }
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // حذف بيانات المستخدم من جدول users
      await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      // حذف تقدم الطالب
      await supabase
        .from('student_progress')
        .delete()
        .eq('user_id', user.id);

      // حذف النقاط
      await supabase
        .from('user_points')
        .delete()
        .eq('user_id', user.id);

      // حذف الحساب من Auth
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        // إذا فشل حذف الحساب من Auth، نحاول تسجيل الخروج على الأقل
        await supabase.auth.signOut();
      }

      // التوجيه إلى صفحة اختيار نوع المستخدم
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });

      Alert.alert('تم حذف الحساب', 'تم حذف حسابك بنجاح');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حذف الحساب. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>حسابي</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ProfileCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* صورة المستخدم والاسم */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <UserAvatar imageUri={userData?.profileImage} />
          </View>
          <Text style={styles.userName}>{userData?.name}</Text>
          {userData?.phone && <Text style={styles.userEmail}>{userData.phone}</Text>}
        </View>

        {/* الإحصائيات */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Text style={styles.statValue}>{stats.daysLearning}</Text>
              <CalendarIcon />
            </View>
            <Text style={styles.statLabel}>أيام في التعلم</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Text style={styles.statValue}>{stats.averageScore}%</Text>
            </View>
            <Text style={styles.statLabel}>متوسط النتيجة</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Text style={styles.statValue}>{stats.completedLessons}/{stats.totalLessons}</Text>
              <PlayIcon />
            </View>
            <Text style={styles.statLabel}>الدروس المكتملة</Text>
          </View>

          <View style={styles.statDivider} />

          {/* بطاقة حالة الاشتراك */}
          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              {stats.isSubscribed && stats.daysRemaining > 0 ? (
                <Text style={styles.statValue}>{stats.daysRemaining}</Text>
              ) : (
                <Text style={[styles.statValue, { fontSize: 14 }]}>غير مشترك</Text>
              )}
              <SubscriptionIcon active={stats.isSubscribed} />
            </View>
            <Text style={styles.statLabel}>
              {stats.isSubscribed && stats.daysRemaining > 0 ? 'أيام متبقية' : 'الاشتراك'}
            </Text>
          </View>
        </View>

        {/* إحصائية النقاط */}
        <View style={styles.pointsRow}>
          <View style={styles.pointsItem}>
            <StarIcon />
            <Text style={styles.pointsValue}>{stats.totalPoints}</Text>
            <Text style={styles.pointsLabel}>مجموع النقاط</Text>
          </View>
        </View>

        {/* القائمة */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => {
                if (item.id === '1') navigation.navigate('EditProfile');
                if (item.id === '2') navigation.navigate('Points');
                if (item.id === '3') navigation.navigate('CalmMoments');
                if (item.id === '4') navigation.navigate('Subscriptions');
                if (item.id === '5') navigation.navigate('Support');
              }}
            >
              <ChevronIcon />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
          
          {/* رابط حذف الحساب في القائمة */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleDeleteAccount}
          >
            <View style={{ width: 20 }} />
            <Text style={styles.deleteMenuText}>حذف الحساب نهائياً</Text>
          </TouchableOpacity>
        </View>

        {/* زر تسجيل الخروج */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
          onPress={() => handleTabPress('profile')}
        >
          <ProfileIcon active={activeTab === 'profile'} />
          {activeTab === 'profile' && <Text style={styles.navTextActive}>الملف الشخصي</Text>}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  pointsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsLabel: {
    fontSize: 13,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  deleteMenuText: {
    fontSize: 15,
    color: '#dc2626',
    flex: 1,
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteLink: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  deleteLinkText: {
    fontSize: 14,
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 6,
  },
  navItemActive: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
  },
  navTextActive: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
});
