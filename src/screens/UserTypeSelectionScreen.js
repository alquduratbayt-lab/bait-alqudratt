import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const Logo = () => (
  <Image 
    source={require('../../assets/app-icon.png')} 
    style={{ width: 120, height: 120 }}
    resizeMode="contain"
  />
);

const ParentIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={7} r={3} stroke="#1a5f7a" strokeWidth={2} />
    <Path
      d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
      stroke="#1a5f7a"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx={17} cy={9} r={2} stroke="#f9a825" strokeWidth={2} />
    <Path
      d="M21 21v-1.5a3 3 0 00-3-3h-1"
      stroke="#f9a825"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const StudentIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
    {/* رأس الطالب */}
    <Circle cx={12} cy={6} r={3} fill="#1a5f7a" />
    {/* جسم الطالب */}
    <Path
      d="M12 10c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z"
      fill="#1a5f7a"
    />
    {/* كتاب */}
    <Rect
      x={14}
      y={12}
      width={6}
      height={8}
      rx={0.5}
      fill="#f9a825"
      stroke="#1a5f7a"
      strokeWidth={0.5}
    />
    <Path
      d="M17 12v8"
      stroke="#fff"
      strokeWidth={0.5}
    />
    {/* حقيبة مدرسية */}
    <Path
      d="M4 18h5v4H4z"
      fill="#f9a825"
      stroke="#1a5f7a"
      strokeWidth={0.5}
    />
    <Rect
      x={5}
      y={17}
      width={3}
      height={1}
      fill="#1a5f7a"
    />
  </Svg>
);

export default function UserTypeSelectionScreen({ navigation }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = (type) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Login', { userType: type });
    });
  };

  return (
    <LinearGradient
      colors={['#e8f4f8', '#fef3e2', '#e8f4f8']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
        <View style={styles.header}>
          <Logo />
          <Text style={styles.title}>اختر نوع حسابك</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress('parent')}
            style={styles.card}
          >
            <LinearGradient
              colors={['#ffffff', '#f5f5f5']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <ParentIcon />
              </View>
              <Text style={styles.cardTitle}>ولي أمر</Text>
              <Text style={styles.cardDescription}>
                متابعة أداء الأبناء والتواصل مع المعلمين
              </Text>
              <View style={styles.arrowContainer}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 18l-6-6 6-6"
                    stroke="#1a5f7a"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress('student')}
            style={styles.card}
          >
            <LinearGradient
              colors={['#ffffff', '#f5f5f5']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <StudentIcon />
              </View>
              <Text style={styles.cardTitle}>طالب</Text>
              <Text style={styles.cardDescription}>
                الوصول للدروس والاختبارات والمحتوى التعليمي
              </Text>
              <View style={styles.arrowContainer}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 18l-6-6 6-6"
                    stroke="#1a5f7a"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '400',
    color: '#1a5f7a',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  cardsContainer: {
    alignItems: 'center',
    gap: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: '85%',
    maxWidth: 350,
  },
  cardGradient: {
    padding: 24,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 16,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 50,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  arrowContainer: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -12,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
