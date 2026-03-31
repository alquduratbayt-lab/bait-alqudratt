import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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

export default function BooksScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('books');

  const handleTabPress = (tab) => {
    if (tab === 'books') return;
    navigation.replace(tab === 'home' ? 'Home' : tab === 'curriculum' ? 'Curriculum' : tab === 'profile' ? 'Profile' : 'Home');
  };

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الكتب</Text>
      </View>

      {/* رسالة قريباً */}
      <View style={styles.comingSoonContainer}>
        <Svg width={80} height={80} viewBox="0 0 50 50" fill="none">
          <Rect x={8} y={12} width={34} height={30} rx={3} fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />
          <Rect x={10} y={5} width={30} height={8} rx={2} fill="#f59e0b" />
          <Path d="M15 20h20M15 27h15M15 34h10" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <Text style={styles.comingSoonTitle}>قريباً</Text>
        <Text style={styles.comingSoonText}>سوف يتم إضافة كتب ومراجع تساعدك{'\n'}في رحلتك التعليمية، ترقّب!</Text>
      </View>

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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginTop: 20,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 26,
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
});
