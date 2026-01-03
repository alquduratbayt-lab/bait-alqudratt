import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { sendOTP } from '../services/taqnyatService';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#1a5f7a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeIcon = ({ visible }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={12} cy={12} r={3} stroke="#999" strokeWidth={2} />
      </>
    ) : (
      <>
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M1 1l22 22" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: رقم الهاتف، 2: OTP، 3: كلمة المرور الجديدة
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']); // 4 خانات منفصلة
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // الخطوة 1: إرسال OTP
  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }

    setLoading(true);
    try {
      let formatted = phone.trim().replace(/\s/g, '');
      if (formatted.startsWith('0')) {
        formatted = formatted.substring(1);
      }
      formatted = `+966${formatted}`;

      // التحقق من وجود المستخدم
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', formatted)
        .single();

      if (userError || !userData) {
        Alert.alert('خطأ', 'رقم الهاتف غير مسجل في النظام');
        setLoading(false);
        return;
      }

      setFormattedPhone(formatted);
      
      // إرسال OTP
      await sendOTP(formatted);
      
      // التحويل مباشرة للخطوة التالية بدون رسالة
      setStep(2);
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال رمز التحقق');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (step === 2) {
      inputRefs[0].current?.focus();
    }
  }, [step]);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (index === 3 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 4) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // الخطوة 2: التحقق من OTP
  const handleVerifyOTP = async (code = otp.join('')) => {
    if (code.length !== 4) {
      Alert.alert('خطأ', 'الرجاء إدخال رمز التحقق كاملاً');
      return;
    }

    setLoading(true);
    try {
      // في وضع التطوير: قبول الكود 5555 مباشرة
      if (code === '5555') {
        console.log('⚠️ وضع التطوير: استخدم الكود 5555 للتحقق');
        setStep(3);
        setLoading(false);
        return;
      }

      const { data: otpData, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('code', code)
        .single();

      if (otpError || !otpData) {
        Alert.alert('خطأ', 'رمز التحقق غير صحيح');
        setOtp(['', '', '', '']);
        inputRefs[0].current?.focus();
        setLoading(false);
        return;
      }

      const otpCreatedAt = new Date(otpData.created_at);
      const now = new Date();
      const diffMinutes = (now - otpCreatedAt) / (1000 * 60);

      if (diffMinutes > 10) {
        Alert.alert('خطأ', 'انتهت صلاحية رمز التحقق. الرجاء طلب رمز جديد');
        setOtp(['', '', '', '']);
        inputRefs[0].current?.focus();
        setLoading(false);
        return;
      }

      // التحويل مباشرة للخطوة التالية بدون رسالة
      setStep(3);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء التحقق من الرمز');
    }
    setLoading(false);
  };

  // الخطوة 3: تغيير كلمة المرور
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      // الحصول على معلومات المستخدم
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('phone', formattedPhone)
        .single();

      if (!userData) {
        Alert.alert('خطأ', 'حدث خطأ في العثور على الحساب');
        setLoading(false);
        return;
      }

      // استدعاء Edge Function لتحديث كلمة المرور
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          userId: userData.id,
          newPassword: newPassword
        }
      });

      if (error) {
        console.error('Error calling reset-password function:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث كلمة المرور. الرجاء المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      // إظهار Modal النجاح
      setShowSuccessModal(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تغيير كلمة المرور');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BackIcon />
            <Text style={styles.backButtonText}>رجوع</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 && 'نسيت كلمة المرور؟'}
              {step === 2 && 'رمز التحقق'}
              {step === 3 && 'كلمة المرور الجديدة'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'أدخل رقم هاتفك المسجل لإرسال رمز التحقق'}
              {step === 2 && 'أدخل رمز التحقق المرسل إلى رقم هاتفك'}
              {step === 3 && 'أدخل كلمة المرور الجديدة'}
            </Text>
          </View>

          {/* الخطوة 1: رقم الهاتف */}
          {step === 1 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>رقم الهاتف</Text>
                <View style={styles.phoneInputWrapper}>
                  <Text style={styles.countryCode}>+966</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="5xxxxxxxx"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={9}
                    textAlign="right"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                onPress={handleSendOTP}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* الخطوة 2: OTP */}
          {step === 2 && (
            <>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputRefs[index]}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                onPress={() => handleVerifyOTP()}
                disabled={loading || otp.join('').length !== 4}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'جاري التحقق...' : 'تحقق'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSendOTP} style={styles.resendButton}>
                <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
              </TouchableOpacity>
            </>
          )}

          {/* الخطوة 3: كلمة المرور الجديدة */}
          {step === 3 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
                <View style={styles.passwordContainer}>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <EyeIcon visible={showPassword} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="أدخل كلمة المرور الجديدة"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
                <View style={styles.passwordContainer}>
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <EyeIcon visible={showConfirmPassword} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="أعد إدخال كلمة المرور"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    textAlign="right"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.navigate('Login');
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            {/* أيقونة النجاح */}
            <View style={styles.successIconContainer}>
              <Svg width={80} height={80} viewBox="0 0 80 80">
                <Circle cx={40} cy={40} r={38} fill="#4CAF50" />
                <Path
                  d="M25 40 L35 50 L55 30"
                  stroke="#fff"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>

            {/* العنوان */}
            <Text style={styles.modalTitle}>تم بنجاح! 🎉</Text>
            
            {/* الرسالة */}
            <Text style={styles.modalMessage}>
              تم تغيير كلمة المرور بنجاح{"\n"}
              يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
            </Text>

            {/* زر تسجيل الدخول */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.modalButtonText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
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
    marginBottom: 30,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a5f7a',
    fontWeight: '600',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'right',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#1a5f7a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#1a5f7a',
    textDecorationLine: 'underline',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#1a5f7a',
    backgroundColor: '#e3f2fd',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: '#1a5f7a',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1a5f7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
