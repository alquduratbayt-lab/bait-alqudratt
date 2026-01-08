import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// أيقونة افتراضية إذا لم تكن هناك صورة
const DefaultIcon = ({ index }) => {
  const icons = [
    // أيقونة الترحيب
    <Svg width={200} height={200} viewBox="0 0 200 200" key="1">
      <Circle cx={100} cy={100} r={80} fill="#e8f4f8" />
      <Path d="M100 40 L100 100 L140 80" stroke="#1a5f7a" strokeWidth={8} strokeLinecap="round" fill="none" />
      <Circle cx={100} cy={100} r={60} stroke="#1a5f7a" strokeWidth={6} fill="none" />
    </Svg>,
    // أيقونة التعلم
    <Svg width={200} height={200} viewBox="0 0 200 200" key="2">
      <Rect x={40} y={60} width={120} height={100} rx={10} fill="#e8f4f8" />
      <Path d="M60 80 L140 80 M60 100 L140 100 M60 120 L140 120" stroke="#1a5f7a" strokeWidth={6} strokeLinecap="round" />
      <Circle cx={100} cy={40} r={20} fill="#1a5f7a" />
    </Svg>,
    // أيقونة التقدم
    <Svg width={200} height={200} viewBox="0 0 200 200" key="3">
      <Path d="M100 40 L130 90 L180 100 L130 110 L100 160 L70 110 L20 100 L70 90 Z" fill="#f9a825" />
      <Circle cx={100} cy={100} r={30} fill="#1a5f7a" />
    </Svg>
  ];
  return icons[index] || icons[0];
};

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    fetchOnboardingScreens();
  }, []);

  const fetchOnboardingScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_screens')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setScreens(data);
      } else {
        // بيانات افتراضية إذا لم تكن هناك بيانات
        setScreens([
          {
            id: 1,
            title: 'مرحباً بك في بيت القدرات',
            description: 'منصة تعليمية متكاملة لتطوير قدراتك وتحقيق أهدافك',
            image_url: null,
            order_index: 1
          },
          {
            id: 2,
            title: 'تعلم بطريقة تفاعلية',
            description: 'دروس تفاعلية مع أسئلة واختبارات لتعزيز فهمك',
            image_url: null,
            order_index: 2
          },
          {
            id: 3,
            title: 'تابع تقدمك',
            description: 'احصل على نقاط ومكافآت وتابع إنجازاتك',
            image_url: null,
            order_index: 3
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching onboarding screens:', error);
      // استخدام بيانات افتراضية عند الخطأ
      setScreens([
        {
          id: 1,
          title: 'مرحباً بك في بيت القدرات',
          description: 'منصة تعليمية متكاملة لتطوير قدراتك وتحقيق أهدافك',
          image_url: null,
          order_index: 1
        },
        {
          id: 2,
          title: 'تعلم بطريقة تفاعلية',
          description: 'دروس تفاعلية مع أسئلة واختبارات لتعزيز فهمك',
          image_url: null,
          order_index: 2
        },
        {
          id: 3,
          title: 'تابع تقدمك',
          description: 'احصل على نقاط ومكافآت وتابع إنجازاتك',
          image_url: null,
          order_index: 3
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('UserTypeSelection');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.replace('UserTypeSelection');
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a5f7a" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#e8f4f8', '#fef3e2', '#e8f4f8']}
      style={styles.container}
    >
      <StatusBar style="dark" />

      {/* زر التخطي */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>

      {/* الشاشات */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => (
          <View key={screen.id} style={styles.slide}>
            <View style={styles.imageContainer}>
              {screen.image_url ? (
                <Image
                  source={{ uri: screen.image_url }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <DefaultIcon index={index} />
              )}
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{screen.title}</Text>
              <Text style={styles.description}>{screen.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* المؤشرات */}
      <View style={styles.pagination}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot
            ]}
          />
        ))}
      </View>

      {/* زر التالي / البدء */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentIndex === screens.length - 1 ? 'البدء' : 'التالي'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#1a5f7a',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 28,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#1a5f7a',
    width: 30,
  },
  nextButton: {
    backgroundColor: '#1a5f7a',
    marginHorizontal: 40,
    marginBottom: 50,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
