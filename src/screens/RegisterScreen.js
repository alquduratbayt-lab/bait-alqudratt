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

export default function RegisterScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleRegister = async () => {
    // التحقق من البيانات
    if (!phone || !name || !password) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
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
      
      console.log('📱 تسجيل طالب:');
      console.log('رقم الهاتف المدخل:', phone);
      console.log('رقم الهاتف المنسق:', formattedPhone);
      
      // إرسال OTP عبر تقنيات
      await sendOTP(formattedPhone);

      // الانتقال لصفحة OTP
      navigation.navigate('OTPVerification', {
        phone: formattedPhone,
        userData: {
          name,
          password,
          parent_phone: parentPhone,
          type: 'student'
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
          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للدخول في استخدام التطبيق</Text>
        </View>

        {/* حقل رقم الهاتف */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>رقم الهاتف</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+966</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="519496939 مثال"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>
        </View>

        {/* تم إزالة حقل رمز التأكيد - سيتم إرساله في صفحة منفصلة */}

        {/* حقل الاسم
              textAlign="right"
              maxLength={4}
            />
          </View>
        </View>

        {/* حقل الاسم */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>الاسم</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="مثال محمد علي"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>
        </View>

        {/* حقل رقم هاتف ولي الأمر */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>رقم هاتف ولي الامر</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+966</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="5983517896 مثال"
              placeholderTextColor="#999"
              value={parentPhone}
              onChangeText={setParentPhone}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>
        </View>

        {/* حقل كلمة المرور */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>كلمة المرور</Text>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <EyeIcon visible={showPassword} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="mohamemed 123 مثال"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>
        </View>

        {/* زر إنشاء حساب */}
        <TouchableOpacity 
          style={[styles.registerButton, loading && { opacity: 0.6 }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>إنشاء حساب</Text>
          )}
        </TouchableOpacity>

        {/* العودة لتسجيل الدخول */}
        <View style={styles.loginContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>تسجيل الدخول</Text>
          </TouchableOpacity>
          <Text style={styles.loginText}>لديك حساب بالفعل؟ </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeButton: {
    padding: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 52,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    height: '100%',
    textAlignVertical: 'center',
    lineHeight: 52,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    height: '100%',
  },
  verificationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#333',
  },
  sendCodeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCodeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});
