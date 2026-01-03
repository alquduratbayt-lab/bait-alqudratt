import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SectionList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Path, Circle } from 'react-native-svg';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الإشعار الأزرق
const NotificationBlueIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#e3f2fd" />
    <Path
      d="M20 12a6 6 0 00-6 6c0 5.25-2.25 6.75-2.25 6.75h16.5s-2.25-1.5-2.25-6.75a6 6 0 00-6-6z"
      stroke="#2196F3"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M21.73 28a1.5 1.5 0 01-2.6 0" stroke="#2196F3" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// أيقونة الإشعار الأخضر
const NotificationGreenIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#dcfce7" />
    <Path
      d="M20 12a6 6 0 00-6 6c0 5.25-2.25 6.75-2.25 6.75h16.5s-2.25-1.5-2.25-6.75a6 6 0 00-6-6z"
      stroke="#22c55e"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M21.73 28a1.5 1.5 0 01-2.6 0" stroke="#22c55e" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// أيقونة الإشعار الأصفر
const NotificationYellowIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#fef3c7" />
    <Path
      d="M20 12a6 6 0 00-6 6c0 5.25-2.25 6.75-2.25 6.75h16.5s-2.25-1.5-2.25-6.75a6 6 0 00-6-6z"
      stroke="#f59e0b"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M21.73 28a1.5 1.5 0 01-2.6 0" stroke="#f59e0b" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// أيقونة الإشعار الأحمر
const NotificationRedIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill="#fee2e2" />
    <Path
      d="M20 12a6 6 0 00-6 6c0 5.25-2.25 6.75-2.25 6.75h16.5s-2.25-1.5-2.25-6.75a6 6 0 00-6-6z"
      stroke="#ef4444"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M21.73 28a1.5 1.5 0 01-2.6 0" stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

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

const filters = [
  { id: 'all', label: 'الكل' },
  { id: 'read', label: 'مقروء' },
  { id: 'unread', label: 'غير مقروء' },
];

const notificationsData = [
  {
    title: 'اليوم',
    data: [
      {
        id: '1',
        title: 'تهنئك المنصة بحلول العام الدراسي الجديد',
        subtitle: 'كل عام وأنت بخير استعد لمزيد من التعلم 🎉',
        time: 'منذ 9 د',
        type: 'blue',
        read: false,
      },
      {
        id: '2',
        title: 'تم إضافة درس جديد في مادة الجغرافيا',
        subtitle: 'افتح التطبيق الآن وابدأ المراجعة',
        time: 'منذ 14 د',
        type: 'green',
        read: false,
      },
      {
        id: '3',
        title: 'عرض خاص! خصم 20% على محتوى مادة الرياضيات!',
        subtitle: 'استغل العرض الآن وابدأ المذاكرة بأسلوب تفاعلي',
        time: 'منذ 9 د',
        type: 'yellow',
        read: false,
      },
    ],
  },
  {
    title: 'أمس',
    data: [
      {
        id: '4',
        title: 'أهلاً بك في منصتنا التعليمية!',
        subtitle: 'نتمنى لك رحلة تعليمية ممتعة ومليئة بالنجاح',
        time: 'منذ 9 د',
        type: 'red',
        read: true,
      },
    ],
  },
];

export default function NotificationsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('home');

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  const getIcon = (type) => {
    switch (type) {
      case 'blue': return <NotificationBlueIcon />;
      case 'green': return <NotificationGreenIcon />;
      case 'yellow': return <NotificationYellowIcon />;
      case 'red': return <NotificationRedIcon />;
      default: return <NotificationBlueIcon />;
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity style={[styles.notificationCard, item.read && styles.notificationRead]}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTime}>{item.time}</Text>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
        </View>
        <View style={styles.notificationIcon}>
          {getIcon(item.type)}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'books') navigation.navigate('Books');
    if (tab === 'curriculum') navigation.navigate('Curriculum');
    if (tab === 'profile') navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* الفلاتر */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* قائمة الإشعارات */}
      <SectionList
        sections={notificationsData}
        renderItem={renderNotification}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

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
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  notificationRead: {
    backgroundColor: '#f9fafb',
    borderColor: '#f0f0f0',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginLeft: 12,
  },
  notificationText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f7a',
    textAlign: 'right',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
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
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
});
