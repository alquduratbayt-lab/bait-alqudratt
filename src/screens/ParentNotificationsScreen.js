import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { ProfileCardSkeleton } from '../components/SkeletonLoader';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الجرس للإشعار
const NotificationBellIcon = ({ color }) => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={18} fill={color || '#e0f2fe'} />
    <Path d="M20 12a5 5 0 00-5 5c0 4.5-2 6-2 6h14s-2-1.5-2-6a5 5 0 00-5-5z" stroke="#0ea5e9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21.5 28a1.5 1.5 0 01-3 0" stroke="#0ea5e9" strokeWidth={1.5} strokeLinecap="round" />
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

const filters = [
  { id: 'all', label: 'الكل' },
  { id: 'read', label: 'مقروء' },
  { id: 'unread', label: 'غير مقروء' },
];

export default function ParentNotificationsScreen({ navigation, route }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [notificationsData, setNotificationsData] = useState([]);
  const parentName = route?.params?.parentName || 'ولي الأمر';

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      const { fetchWithCache } = require('../lib/cacheService');

      // جلب الإشعارات مع Cache
      const data = await fetchWithCache(
        `parent_notifications_${user.id}_${activeFilter}`,
        async () => {
          let query = supabase
            .from('parent_notifications')
            .select('*')
            .eq('parent_id', user.id)
            .order('created_at', { ascending: false });

          if (activeFilter === 'read') {
            query = query.eq('is_read', true);
          } else if (activeFilter === 'unread') {
            query = query.eq('is_read', false);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        },
        1 * 60 * 1000 // 1 دقيقة للإشعارات
      );

      const grouped = groupNotificationsByDate(data);
      setNotificationsData(grouped);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      'اليوم': [],
      'أمس': [],
      'سابقاً': []
    };

    notifications.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      const timeAgo = formatTimeAgo(notif.created_at);
      
      const notification = {
        id: notif.id,
        title: notif.title,
        subtitle: notif.message,
        time: timeAgo,
        color: getNotificationColor(notif.type),
        isRead: notif.is_read
      };

      if (notifDate.toDateString() === today.toDateString()) {
        groups['اليوم'].push(notification);
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        groups['أمس'].push(notification);
      } else {
        groups['سابقاً'].push(notification);
      }
    });

    return Object.entries(groups)
      .filter(([_, data]) => data.length > 0)
      .map(([title, data]) => ({ title, data }));
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    return `منذ ${Math.floor(diffHours / 24)} يوم`;
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'login': return '#e0f2fe';
      case 'lesson_completed': return '#dcfce7';
      case 'exam_completed': return '#fef3c7';
      default: return '#e0f2fe';
    }
  };

  const handleTabPress = (tab) => {
    if (tab === 'notifications') return;
    if (tab === 'home') navigation.replace('ParentHome', { parentName });
    if (tab === 'reports') navigation.navigate('ParentReports', { parentName });
    if (tab === 'profile') navigation.navigate('ParentProfile', { parentName });
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('parent_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // تحديث الحالة المحلية
      setNotificationsData(prevData => 
        prevData.map(section => ({
          ...section,
          data: section.data.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        }))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.isRead && styles.notificationUnread]}
      onPress={() => !item.isRead && markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.notificationTime}>{item.time}</Text>
      <View style={styles.notificationContent}>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
        </View>
        <NotificationBellIcon color={item.color} />
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

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
      {loading ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notifications Skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#e0e0e0', borderRadius: 24, marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <View style={{ width: '80%', height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: '60%', height: 12, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 4 }} />
                <View style={{ width: 60, height: 10, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : notificationsData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد إشعارات</Text>
        </View>
      ) : (
        <SectionList
          sections={notificationsData}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabPress('profile')}
        >
          <ProfileIcon active={false} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => handleTabPress('notifications')}
        >
          <BellIcon active={true} />
          <Text style={styles.navTextActive}>الإشعارات</Text>
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
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
  },
  filterTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
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
    borderColor: '#e5e7eb',
  },
  notificationUnread: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationText: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    textAlign: 'right',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'left',
    marginBottom: 8,
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
    paddingHorizontal: 20,
  },
  navTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
});
