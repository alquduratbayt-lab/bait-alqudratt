import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { verifyOTP, sendOTP } from '../services/taqnyatService';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MessageIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
    <Circle cx={40} cy={40} r={38} fill="#e3f2fd" />
    <Path d="M20 30h40v30H20z" fill="#2196F3" />
    <Path d="M20 30l20 15 20-15" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={55} cy={25} r={8} fill="#4caf50" />
    <Path d="M52 25l2 2 4-4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function OTPVerificationScreen({ route, navigation }) {
  const { phone, userData } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    // التركيز على أول خانة عند فتح الصفحة
    inputRefs[0].current?.focus();
  }, []);

  useEffect(() => {
    // عداد تنازلي لإعادة الإرسال
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    // السماح بالأرقام فقط
    if (!/^\d*$/.test(value)) return;

    // إذا تم لصق أو auto-fill كود كامل (4 أرقام)
    if (value.length === 4 && index === 0) {
      const digits = value.split('');
      setOtp(digits);
      inputRefs[3].current?.focus();
      Keyboard.dismiss();
      handleVerify(value);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // الانتقال للخانة التالية تلقائياً
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // التحقق تلقائياً عند إدخال 4 أرقام
    if (index === 3 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 4) {
        Keyboard.dismiss();
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // الرجوع للخانة السابقة عند الضغط على Backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (code = otp.join('')) => {
    if (code.length !== 4) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setLoading(true);
    try {
      // التحقق من OTP
      const verifyResult = await verifyOTP(phone, code);

      if (!verifyResult.success) {
        Alert.alert('خطأ', verifyResult.message || 'رمز التحقق غير صحيح');
        setOtp(['', '', '', '']);
        inputRefs[0].current?.focus();
        return;
      }

      // إنشاء الحساب في Supabase Auth باستخدام email بدلاً من phone
      // لأن Phone Auth يتطلب تفعيل في Supabase وإعدادات SMS provider
      
      // توحيد صيغة رقم الهاتف (نفس المنطق المستخدم في LoginScreen)
      let formattedPhone = phone.trim();
      formattedPhone = formattedPhone.replace(/\s/g, ''); // إزالة المسافات
      
      // إذا كان الرقم يبدأ بـ 0، نزيله
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      // إذا كان الرقم يبدأ بـ +966، نزيله
      if (formattedPhone.startsWith('+966')) {
        formattedPhone = formattedPhone.substring(4);
      } else if (formattedPhone.startsWith('966')) {
        formattedPhone = formattedPhone.substring(3);
      }
      
      // إضافة +966
      formattedPhone = `+966${formattedPhone}`;
      
      const emailFromPhone = `${formattedPhone.replace(/\+/g, '')}@bait-alqudratt.temp`;
      
      console.log('📝 تسجيل حساب جديد:');
      console.log('رقم الهاتف الأصلي:', phone);
      console.log('رقم الهاتف المنسق:', formattedPhone);
      console.log('Email:', emailFromPhone);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFromPhone,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            type: userData.type,
            parent_phone: userData.parent_phone || null,
            phone: formattedPhone,
          }
        }
      });

      if (authError) {
        // معالجة أخطاء التسجيل برسائل واضحة
        if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
          Alert.alert(
            'الرقم مسجل مسبقاً',
            'رقم الهاتف هذا مسجل بالفعل في النظام.\n\nيمكنك:\n• تسجيل الدخول باستخدام هذا الرقم\n• استخدام رقم هاتف آخر للتسجيل\n• إعادة تعيين كلمة المرور إذا نسيتها',
            [
              { text: 'حسناً', style: 'cancel' },
              { text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login') }
            ]
          );
          return;
        } else if (authError.message.includes('Invalid email')) {
          Alert.alert('خطأ', 'صيغة رقم الهاتف غير صحيحة. الرجاء التحقق من الرقم والمحاولة مرة أخرى.');
          return;
        } else {
          Alert.alert('خطأ في التسجيل', authError.message || 'حدث خطأ أثناء إنشاء الحساب. الرجاء المحاولة مرة أخرى.');
          return;
        }
      }

      // إنشاء سجل في جدول users
      let parentId = null;
      
      // إذا كان طالب، نبحث عن parent_id من parent_phone
      if (userData.type === 'student' && userData.parent_phone) {
        // تنسيق رقم ولي الأمر بنفس الطريقة
        let parentPhone = userData.parent_phone.trim();
        parentPhone = parentPhone.replace(/\s/g, '');
        
        if (parentPhone.startsWith('0')) {
          parentPhone = parentPhone.substring(1);
        }
        
        if (parentPhone.startsWith('+966')) {
          parentPhone = parentPhone.substring(4);
        } else if (parentPhone.startsWith('966')) {
          parentPhone = parentPhone.substring(3);
        }
        
        parentPhone = `+966${parentPhone}`;
        
        console.log('🔍 البحث عن ولي الأمر:');
        console.log('رقم ولي الأمر المدخل:', userData.parent_phone);
        console.log('رقم ولي الأمر المنسق:', parentPhone);
        
        // البحث عن ولي الأمر في قاعدة البيانات
        const { data: parentData, error: parentError } = await supabase
          .from('users')
          .select('id')
          .eq('phone', parentPhone)
          .eq('type', 'parent')
          .single();
        
        if (parentError) {
          console.error('خطأ في البحث عن ولي الأمر:', parentError);
          Alert.alert(
            'خطأ',
            'رقم ولي الأمر غير مسجل في النظام.\n\nيجب على ولي الأمر التسجيل أولاً قبل تسجيل الطالب.',
            [{ text: 'حسناً' }]
          );
          return;
        }
        
        if (parentData) {
          parentId = parentData.id;
          console.log('✅ تم العثور على ولي الأمر:', parentId);
        }
      }
      
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: emailFromPhone,
          phone: formattedPhone,
          name: userData.name,
          type: userData.type,
          parent_id: parentId,
          parent_phone: userData.type === 'student' ? userData.parent_phone : null,
          approval_status: userData.type === 'student' ? 'pending' : 'approved',
        });

      if (userError) throw userError;
      
      console.log('✅ تم إنشاء الحساب بنجاح!');
      if (userData.type === 'student' && parentId) {
        console.log('🔗 تم ربط الطالب بولي الأمر:', parentId);
      }

      // للطلاب الجدد: الانتقال لامتحان تحديد المستوى
      if (userData.type === 'student') {
        navigation.replace('PlacementTest', {
          userData: userData
        });
      } else {
        // لأولياء الأمور: الانتقال مباشرة للصفحة الرئيسية
        Alert.alert(
          'تم بنجاح! 🎉',
          'تم إنشاء حسابك بنجاح',
          [
            {
              text: 'حسناً',
              onPress: () => {
                navigation.replace('ParentHome', { parentName: userData.name });
              }
            }
          ]
        );
      }

    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      await sendOTP(phone);

      Alert.alert('تم الإرسال', 'تم إرسال رمز التحقق مرة أخرى');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '']);
      inputRefs[0].current?.focus();
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhone = phone.replace(/(\d{3})\d{5}(\d{3})/, '$1*****$2');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التحقق من الهاتف</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MessageIcon />
        </View>

        <Text style={styles.title}>أدخل رمز التحقق</Text>
        <Text style={styles.subtitle}>
          تم إرسال رمز مكون من 4 أرقام إلى{'\n'}
          <Text style={styles.phone}>{maskedPhone}</Text>
        </Text>

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
              maxLength={index === 0 ? 4 : 1}
              textContentType={index === 0 ? "oneTimeCode" : "none"}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && { opacity: 0.6 }]}
          onPress={() => handleVerify()}
          disabled={loading || otp.join('').length !== 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>تحقق</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              <Text style={styles.resendText}>
                {resendLoading ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdownText}>
              يمكنك إعادة الإرسال بعد {countdown} ثانية
            </Text>
          )}
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  phone: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 40,
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
  },
  otpInputFilled: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  verifyButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: '#999',
  },
});
