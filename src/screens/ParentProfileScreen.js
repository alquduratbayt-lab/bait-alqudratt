import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة السهم للأمام
const ChevronIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// صورة المستخدم الافتراضية
const UserAvatar = () => (
  <Svg width={100} height={100} viewBox="0 0 100 100" fill="none">
    <Circle cx={50} cy={50} r={48} fill="#e5e7eb" stroke="#d1d5db" strokeWidth={2} />
    <Circle cx={50} cy={38} r={18} fill="#9ca3af" />
    <Path d="M20 85c0-16 13-29 30-29s30 13 30 29" fill="#9ca3af" />
  </Svg>
);

// أيقونة تسجيل الخروج
const LogoutIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17l5-5-5-5M21 12H9" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة حذف الحساب
const DeleteIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

const menuItems = [
  { id: '1', title: 'التفاصيل الشخصية' },
  { id: '2', title: 'التفاصيل الابن' },
  { id: '3', title: 'الدعم الفني' },
  { id: '4', title: 'سياسة الخصوصية والاستخدام' },
];

export default function ParentProfileScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('profile');
  const parentName = route?.params?.parentName || 'محمد احمد';

  const handleTabPress = (tab) => {
    if (tab === 'profile') return;
    if (tab === 'home') navigation.replace('ParentHome', { parentName });
    if (tab === 'reports') navigation.navigate('ParentReports', { parentName });
    if (tab === 'notifications') navigation.navigate('ParentNotifications', { parentName });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ \n\nسيتم حذف جميع بياناتك وبيانات أبنائك ولن تتمكن من استرجاعها.',
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

      // حذف بيانات ولي الأمر من جدول parents
      await supabase
        .from('parents')
        .delete()
        .eq('id', user.id);

      // حذف بيانات المستخدم من جدول users
      await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <LinearGradient
        colors={['#bfdbfe', '#dbeafe']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* صورة المستخدم */}
        <View style={styles.avatarContainer}>
          <UserAvatar />
          <Text style={styles.userName}>{parentName}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* القائمة */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => {
                if (item.id === '1') navigation.navigate('ParentEditProfile', { parentName });
                if (item.id === '2') navigation.navigate('ParentChildren');
                if (item.id === '3') navigation.navigate('Support');
                if (item.id === '4') navigation.navigate('PrivacyPolicy');
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
      </ScrollView>

      {/* زر تسجيل الخروج */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleTabPress('profile')}
        >
          <ProfileIcon active={true} />
          <Text style={styles.navTextActive}>الملف الشخصي</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('notifications')}
        >
          <BellIcon active={false} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('reports')}
        >
          <ReportsIcon active={false} />
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
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  avatarContainer: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1e3a5f',
  },
  deleteMenuText: {
    fontSize: 16,
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteLink: {
    alignItems: 'center',
    marginTop: 16,
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
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
  },
  navTextActive: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});
