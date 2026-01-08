import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width } = Dimensions.get('window');

// أيقونة المستخدم
const UserIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={7} r={4} stroke="#1a5f7a" strokeWidth={2} />
  </Svg>
);

// أيقونة الإشعارات
const NotificationIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 01-3.46 0"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة الشمس (صباحاً)
const SunIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={5} stroke="#f59e0b" strokeWidth={2} fill="#fbbf24" />
    <Path
      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="#f59e0b"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// أيقونة المساء
const EveningIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      stroke="#f97316"
      strokeWidth={2}
      fill="#fb923c"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة الليل
const NightIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      stroke="#1e40af"
      strokeWidth={2}
      fill="#1e3a8a"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={18} cy={6} r={1.5} fill="#fbbf24" />
    <Circle cx={15} cy={4} r={1} fill="#fbbf24" />
    <Circle cx={20} cy={9} r={1} fill="#fbbf24" />
  </Svg>
);

// أيقونة القفل
const LockIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke="#f59e0b" strokeWidth={2} fill="#fbbf24" />
    <Path
      d="M7 11V7a5 5 0 0110 0v4"
      stroke="#f59e0b"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// أيقونة الكمي
const QuantitativeIcon = () => (
  <Svg width={50} height={50} viewBox="0 0 60 60" fill="none">
    <Rect x={5} y={25} width={30} height={25} rx={3} fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />
    <Path d="M10 35h20M10 42h15" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
    <Path d="M40 15l5-8 5 8M42 20l3-5 3 5" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M35 25l4 4M39 25l-4 4" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={48} cy={35} r={4} fill="#3b82f6" />
    <Path d="M44 42l4 4 6-8" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة اللفظي
const VerbalIcon = () => (
  <Svg width={50} height={50} viewBox="0 0 60 60" fill="none">
    <Rect x={15} y={10} width={30} height={40} rx={3} fill="#dbeafe" stroke="#3b82f6" strokeWidth={2} />
    <Path d="M22 20h16M22 28h16M22 36h10" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={45} cy={15} r={8} fill="#e0e7ff" stroke="#6366f1" strokeWidth={2} />
    <Path d="M42 15l2 2 4-4" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة الرئيسية
const HomeIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      fill={active ? '#e8f4f8' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12h6v10"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة الكتب
const BooksIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5A2.5 2.5 0 016.5 17H20"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      fill={active ? '#e8f4f8' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة المنهج
const CurriculumIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      fill={active ? '#e8f4f8' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// أيقونة حسابي
const ProfileIcon = ({ active }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke={active ? '#1a5f7a' : '#999'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle 
      cx={12} 
      cy={7} 
      r={4} 
      stroke={active ? '#1a5f7a' : '#999'} 
      strokeWidth={2}
      fill={active ? '#e8f4f8' : 'none'}
    />
  </Svg>
);

export default function HomeScreen({ navigation }) {
  const [timer, setTimer] = useState({ hours: 0, minutes: 15, seconds: 23 });
  const [activeTab, setActiveTab] = useState('home');
  const [subjects, setSubjects] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userName, setUserName] = useState('الطالب');
  const [greeting, setGreeting] = useState({ text: 'صباح الخير', icon: 'sun' });
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [passingPercentage, setPassingPercentage] = useState(80);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const scrollViewRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      fetchUnreadNotifications();
    }, [])
  );

  useEffect(() => {
    updateGreeting();
    fetchUserName();
    fetchSubjects();
    fetchUnreadNotifications();
    fetchBanners();
    loadPassingPercentage();
  }, []);

  const loadPassingPercentage = async () => {
    try {
      const { getSetting } = require('../lib/appSettingsService');
      const percentage = await getSetting('passing_percentage', 80);
      setPassingPercentage(percentage);
    } catch (error) {
      console.error('Error loading passing percentage:', error);
    }
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({ text: 'صباح الخير', icon: 'sun' });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ text: 'مساء الخير', icon: 'evening' });
    } else {
      setGreeting({ text: 'مساء الخير', icon: 'night' });
    }
  };

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data?.name) {
        setUserName(data.name);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const { fetchWithCache } = require('../lib/cacheService');
      
      const data = await fetchWithCache(
        'subjects',
        async () => {
          const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data || [];
        }
      );
      
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('student_notifications')
        .select('id')
        .eq('student_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadNotifications(data?.length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchBanners = async () => {
    try {
      setLoadingBanners(true);
      const { getSetting } = require('../lib/appSettingsService');
      const bannersEnabled = await getSetting('banners_enabled', true);
      
      if (!bannersEnabled) {
        setBanners([]);
      } else {
        const { fetchWithCache } = require('../lib/cacheService');
        
        const data = await fetchWithCache(
          'banners',
          async () => {
            const { data, error } = await supabase
              .from('banners')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
          }
        );
        
        setBanners(data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const calculateTimeRemaining = (eventTime) => {
    if (!eventTime) return null;
    
    const now = new Date();
    const event = new Date(eventTime);
    const diff = event - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  const formatCountdown = (time) => {
    if (!time) return null;
    
    if (time.days > 0) {
      return `يبدأ بعد: ${time.days} يوم و ${time.hours} ساعة`;
    } else if (time.hours > 0) {
      return `يبدأ بعد: ${time.hours} ساعة و ${time.minutes} دقيقة`;
    } else {
      return `يبدأ بعد: ${time.minutes}:${time.seconds.toString().padStart(2, '0')}`;
    }
  };

  const handleBannerPress = async (banner) => {
    if (banner.link_url) {
      try {
        await Linking.openURL(banner.link_url);
      } catch (error) {
        console.error('Error opening link:', error);
      }
    }
  };

  // تحديث المؤقت والعد التنازلي
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        let { hours, minutes, seconds } = prev;
        seconds++;
        if (seconds >= 60) {
          seconds = 0;
          minutes++;
        }
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
        return { hours, minutes, seconds };
      });
      
      // تحديث البانرات لإعادة حساب العد التنازلي
      setBanners(prev => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // تحريك البانرات تلقائياً
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000); // تغيير كل 5 ثواني
    
    return () => clearInterval(interval);
  }, [banners.length]);

  // تحريك ScrollView عند تغيير البانر
  useEffect(() => {
    if (scrollViewRef.current && banners.length > 0) {
      scrollViewRef.current.scrollTo({
        x: currentBannerIndex * width,
        animated: true,
      });
    }
  }, [currentBannerIndex]);

  const formatTime = (num) => num.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('StudentNotifications')}
          >
            <NotificationIcon />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.userButton} onPress={() => navigation.navigate('Profile')}>
            <UserIcon />
          </TouchableOpacity>
        </View>
        <View style={styles.greetingContainer}>
          <View style={styles.greetingRow}>
            {greeting.icon === 'sun' && <SunIcon />}
            {greeting.icon === 'evening' && <EveningIcon />}
            {greeting.icon === 'night' && <NightIcon />}
            <Text style={styles.greetingText}>{greeting.text}</Text>
          </View>
          <Text style={styles.studentName}>{userName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* البانرات الإعلانية */}
        {loadingBanners ? (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerCard}>
              <View style={styles.skeletonBannerImage} />
              <View style={styles.bannerContent}>
                <View style={styles.bannerTextSection}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonSubtitle} />
                </View>
              </View>
            </View>
          </View>
        ) : banners.length > 0 && (
          <View style={styles.bannerContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentBannerIndex(index);
              }}
            >
              {banners.map((banner, index) => {
                const timeRemaining = calculateTimeRemaining(banner.event_start_time);
                const countdownText = formatCountdown(timeRemaining);
                
                return (
                  <TouchableOpacity
                    key={banner.id}
                    style={styles.bannerCard}
                    onPress={() => handleBannerPress(banner)}
                    activeOpacity={banner.link_url ? 0.7 : 1}
                  >
                    <View style={styles.bannerImageContainer}>
                      {banner.image_url ? (
                        <Image
                          source={{ uri: banner.image_url }}
                          style={styles.bannerImageFull}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.bannerImagePlaceholder}>
                          <Svg width={60} height={60} viewBox="0 0 60 60">
                            <Rect width={60} height={60} rx={8} fill="#e5e7eb" />
                            <Path d="M10 50 L30 30 L40 40 L55 25" stroke="#9ca3af" strokeWidth={2} fill="none" />
                            <Circle cx={45} cy={20} r={6} fill="#9ca3af" />
                          </Svg>
                        </View>
                      )}
                    </View>
                    <View style={styles.bannerContent}>
                      <View style={styles.bannerTextSection}>
                        <Text 
                          style={styles.bannerTitle} 
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {banner.title}
                        </Text>
                        {banner.subtitle && (
                          <Text 
                            style={styles.bannerSubtitle} 
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {banner.subtitle}
                          </Text>
                        )}
                      </View>
                      {countdownText && (
                        <View style={styles.countdownContainer}>
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2} />
                            <Path d="M12 6v6l4 2" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                          </Svg>
                          <Text style={styles.countdownText}>{countdownText}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {/* نقاط التنقل */}
            {banners.length > 1 && (
              <View style={styles.paginationDots}>
                {banners.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentBannerIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* فاصل */}
        <View style={styles.divider} />

        {/* اختر المنهج */}
        <Text style={styles.sectionTitle}>اختر المنهج</Text>
        
        {loadingSubjects ? (
          <View style={styles.curriculumContainer}>
            <View style={styles.curriculumCard}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonText} />
            </View>
            <View style={styles.curriculumCard}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonText} />
            </View>
          </View>
        ) : (
          <View style={styles.curriculumContainer}>
            {subjects.map((subject) => (
              <TouchableOpacity 
                key={subject.id}
                style={styles.curriculumCard}
                onPress={() => navigation.navigate('Lessons', { 
                  subjectId: subject.id,
                  title: subject.name,
                  type: subject.type,
                  passingPercentage: subject.passing_percentage || passingPercentage
                })}
              >
                {subject.icon_url ? (
                  <Image source={{ uri: subject.icon_url }} style={{ width: 50, height: 50, borderRadius: 8 }} resizeMode="cover" />
                ) : (
                  subject.type === 'كمي' ? <QuantitativeIcon /> : <VerbalIcon />
                )}
                <Text style={styles.curriculumText}>{subject.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* التدريب غير متاح */}
        <LinearGradient
          colors={['#4682B4', '#4682B4']}
          style={styles.trainingCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <LockIcon />
          <Text style={styles.trainingText}>التدريب غير متاح</Text>
        </LinearGradient>
      </ScrollView>

      {/* زر المدرس AI العائم */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AITeacher')}
        activeOpacity={0.8}
      >
        <Image 
          source={require('../../assets/teacher.png')}
          style={styles.teacherImage}
          resizeMode="contain"
        />
        <Text style={styles.teacherLabel}>مدرسك الخاص</Text>
      </TouchableOpacity>

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
          onPress={() => navigation.replace('Profile')}
        >
          <ProfileIcon active={activeTab === 'profile'} />
          {activeTab === 'profile' && <Text style={styles.navTextActive}>حسابي</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'curriculum' && styles.navItemActive]}
          onPress={() => navigation.replace('Curriculum')}
        >
          <CurriculumIcon active={activeTab === 'curriculum'} />
          {activeTab === 'curriculum' && <Text style={styles.navTextActive}>المنهج</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'books' && styles.navItemActive]}
          onPress={() => navigation.replace('Books')}
        >
          <BooksIcon active={activeTab === 'books'} />
          {activeTab === 'books' && <Text style={styles.navTextActive}>الكتب</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => setActiveTab('home')}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  userButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingContainer: {
    alignItems: 'flex-end',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a5f7a',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f7a',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bannerContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  bannerCard: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  bannerImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#f3f4f6',
  },
  bannerImageFull: {
    width: '100%',
    height: '100%',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  bannerTextSection: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'right',
    marginBottom: 4,
    lineHeight: 22,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'right',
    fontWeight: '500',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  timerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  countdownText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  activeDot: {
    backgroundColor: '#1a5f7a',
    width: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginTop: 30,
    marginBottom: 16,
  },
  curriculumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  curriculumCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  curriculumText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  trainingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 30,
    gap: 10,
  },
  trainingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 20,
  },
  navTextActive: {
    fontSize: 13,
    color: '#1a5f7a',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  teacherImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a5f7a',
  },
  teacherLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a5f7a',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Skeleton Loader Styles
  skeletonBannerImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  skeletonTitle: {
    width: '80%',
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '60%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  skeletonText: {
    width: 80,
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 12,
  },
});
