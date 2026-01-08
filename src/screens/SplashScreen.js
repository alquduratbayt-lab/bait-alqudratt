import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    checkSession();
  }, [navigation]);

  const checkSession = async () => {
    try {
      // التحقق من وجود جلسة نشطة
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // إذا كان هناك خطأ في الـ refresh token
      if (sessionError) {
        console.log('Session error:', sessionError.message);
        await supabase.auth.signOut();
        
        // التحقق من Onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        setTimeout(() => {
          navigation.replace(hasSeenOnboarding ? 'UserTypeSelection' : 'Onboarding');
        }, 2000);
        return;
      }
      
      if (session) {
        // جلب معلومات المستخدم
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          // إرسال إشعار لولي الأمر عند فتح التطبيق (للطلاب فقط)
          if (userData.type === 'student' && userData.approval_status === 'approved') {
            const { sendParentLoginNotification } = require('../lib/pushNotifications');
            sendParentLoginNotification(userData.id, userData.name);
          }

          // توجيه المستخدم حسب نوعه
          setTimeout(() => {
            if (userData.type === 'parent') {
              // التحقق من وجود طلبات موافقة
              supabase
                .from('users')
                .select('*')
                .eq('parent_phone', userData.phone)
                .eq('approval_status', 'pending')
                .eq('type', 'student')
                .then(({ data: pendingStudents }) => {
                  if (pendingStudents && pendingStudents.length > 0) {
                    navigation.replace('ParentConfirm', { 
                      parentName: userData.name,
                      parentPhone: userData.phone,
                      studentName: pendingStudents[0].name,
                      studentId: pendingStudents[0].id
                    });
                  } else {
                    navigation.replace('ParentHome', { parentName: userData.name });
                  }
                });
            } else if (userData.type === 'student') {
              if (userData.approval_status === 'pending') {
                navigation.replace('WaitingApproval', { 
                  studentName: userData.name,
                  parentPhone: userData.parent_phone 
                });
              } else if (userData.approval_status === 'approved') {
                navigation.replace('Home');
              } else {
                navigation.replace('Login');
              }
            } else {
              navigation.replace('Login');
            }
          }, 1500);
        } else {
          // لا توجد بيانات مستخدم، التحقق من Onboarding
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          setTimeout(() => {
            navigation.replace(hasSeenOnboarding ? 'UserTypeSelection' : 'Onboarding');
          }, 2000);
        }
      } else {
        // لا توجد جلسة، التحقق من Onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        setTimeout(() => {
          navigation.replace(hasSeenOnboarding ? 'UserTypeSelection' : 'Onboarding');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // تسجيل خروج تلقائي عند حدوث خطأ
      await supabase.auth.signOut();
      
      // التحقق من Onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setTimeout(() => {
        navigation.replace(hasSeenOnboarding ? 'UserTypeSelection' : 'Onboarding');
      }, 2000);
    }
  };

  return (
    <LinearGradient
      colors={['#e8f4f8', '#fef3e2', '#e8f4f8']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* الشعار */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/app-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* اسم التطبيق */}
        <Text style={styles.title}>بيت القدرات</Text>
        <Text style={styles.subtitle}>منصة تعليمية متكاملة</Text>
      </View>
      
      {/* مؤشر التحميل */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a5f7a',
    marginHorizontal: 5,
    opacity: 0.3,
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
});
