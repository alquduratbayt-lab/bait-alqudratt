import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { sendOTP } from '../services/taqnyatService';

// دالة تحويل الأرقام العربية إلى إنجليزية
const convertArabicToEnglish = (text) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return text.replace(/[٠-٩]/g, (match) => {
    return englishNumbers[arabicNumbers.indexOf(match)];
  });
};

// أيقونة العين للباسورد
const EyeIcon = ({ visible }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="#999"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={12} r={3} stroke="#999" strokeWidth={2} />
      </>
    ) : (
      <>
        <Path
          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
          stroke="#999"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M1 1l22 22" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

export default function ParentRegisterScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // التحقق من البيانات
    if (!phone || !name || !password || !confirmPassword) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      // توحيد صيغة رقم الهاتف
      let formattedPhone = phone.trim();
      formattedPhone = formattedPhone.replace(/\s/g, ''); // إزالة المسافات
      
      // إذا كان الرقم يبدأ بـ 0، نزيله
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      // إضافة +966
      formattedPhone = `+966${formattedPhone}`;
      
      console.log('📱 تسجيل ولي أمر:');
      console.log('رقم الهاتف المدخل:', phone);
      console.log('رقم الهاتف المنسق:', formattedPhone);
      
      // إرسال OTP عبر تقنيات مع اسم ولي الأمر
      await sendOTP(formattedPhone, name);

      // الانتقال لصفحة OTP
      navigation.navigate('OTPVerification', {
        phone: formattedPhone,
        userData: {
          name,
          password,
          type: 'parent'
        }
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // معالجة الأخطاء برسائل واضحة
      if (error.message && error.message.includes('already registered')) {
        Alert.alert(
          'الرقم مسجل مسبقاً',
          'رقم الهاتف هذا مسجل بالفعل في النظام.\n\nيمكنك:\n• تسجيل الدخول باستخدام هذا الرقم\n• استخدام رقم هاتف آخر للتسجيل',
          [
            { text: 'حسناً', style: 'cancel' },
            { text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else if (error.message && error.message.includes('network')) {
        Alert.alert('خطأ في الاتصال', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
      } else {
        Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* زر الرجوع */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#1a5f7a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>

        {/* العنوان */}
        <View style={styles.header}>
          <Text style={styles.title}>إنشاء حساب ولي أمر</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للدخول في استخدام التطبيق</Text>
        </View>

        {/* حقل الاسم */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسمك الكامل"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            textAlign="right"
          />
        </View>

        {/* حقل رقم الهاتف */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <View style={styles.phoneContainer}>
            <Text style={styles.countryCode}>+966</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="5XXXXXXXX"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={(text) => setPhone(convertArabicToEnglish(text))}
              keyboardType="phone-pad"
              maxLength={9}
              textAlign="right"
            />
          </View>
        </View>

        {/* حقل كلمة المرور */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>كلمة المرور</Text>
          <View style={styles.passwordContainer}>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <EyeIcon visible={showPassword} />
            </TouchableOpacity>
            <TextInput
              style={styles.passwordInput}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>
        </View>

        {/* حقل تأكيد كلمة المرور */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>تأكيد كلمة المرور</Text>
          <View style={styles.passwordContainer}>
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <EyeIcon visible={showConfirmPassword} />
            </TouchableOpacity>
            <TextInput
              style={styles.passwordInput}
              placeholder="أعد إدخال كلمة المرور"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              textAlign="right"
            />
          </View>
        </View>

        {/* زر التسجيل */}
        <TouchableOpacity 
          style={[styles.registerButton, loading && { opacity: 0.6 }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>إنشاء الحساب</Text>
          )}
        </TouchableOpacity>

        {/* رابط تسجيل الدخول */}
        <View style={styles.loginContainer}>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginLink}>لديك حساب؟ تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a5f7a',
    fontWeight: '600',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    backgroundColor: '#ebebeb',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#1a5f7a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1a5f7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLink: {
    fontSize: 14,
    color: '#1a5f7a',
    fontWeight: '600',
  },
});
