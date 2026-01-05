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
  Dimensions,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

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

// أيقونة الطالب
const StudentIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      fill="#fff"
    />
  </Svg>
);

// أيقونة ولي الأمر
const ParentIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
      fill="#1a5f7a"
    />
  </Svg>
);

// دالة تحويل الأرقام العربية إلى إنجليزية
const convertArabicToEnglish = (text) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return text.replace(/[٠-٩]/g, (match) => {
    return englishNumbers[arabicNumbers.indexOf(match)];
  });
};

export default function LoginScreen({ navigation, route }) {
  const userType = route.params?.userType || 'student'; // 'student' or 'parent'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'error', title: '', message: '', buttons: [] });

  const showAlert = (type, title, message, buttons = []) => {
    setAlertConfig({ type, title, message, buttons });
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    // منع الضغط المتكرر
    if (loading) return;
    
    // التحقق من البيانات
    if (!phone || !password) {
      showAlert('error', 'خطأ', 'الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      // تحويل رقم الهاتف إلى email مؤقت
      // المستخدم يدخل الرقم بدون +966 (مثل: 501234567)
      // نضيف +966 ثم نحوله لـ email
      let formattedPhone = phone.trim();
      
      // إزالة أي مسافات أو رموز
      formattedPhone = formattedPhone.replace(/\s/g, '');
      
      // إذا كان الرقم يبدأ بـ 0، نزيله
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      // إضافة +966
      formattedPhone = `+966${formattedPhone}`;
      
      const email = `${formattedPhone.replace(/\+/g, '')}@bait-alqudratt.temp`;

      console.log('🔐 محاولة تسجيل الدخول:');
      console.log('رقم الهاتف المدخل:', phone);
      console.log('رقم الهاتف المنسق:', formattedPhone);
      console.log('Email المستخدم:', email);

      // تسجيل الدخول باستخدام Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error('❌ خطأ في تسجيل الدخول:', authError);
        
        // معالجة أخطاء تسجيل الدخول برسائل واضحة ومفصلة
        if (authError.message.includes('Invalid login credentials')) {
          showAlert(
            'error',
            'بيانات الدخول غير صحيحة',
            'رقم الهاتف أو كلمة المرور غير صحيحة.\\n\\nتأكد من:\\n• إدخال رقم الهاتف بشكل صحيح\\n• كتابة كلمة المرور بشكل صحيح\\n\\nإذا نسيت كلمة المرور، يمكنك إعادة تعيينها.'
          );
        } else if (authError.message.includes('Email not confirmed')) {
          showAlert('error', 'الحساب غير مفعل', 'الرجاء تأكيد بريدك الإلكتروني أولاً للمتابعة.');
        } else if (authError.message.includes('User not found')) {
          showAlert(
            'error',
            'الحساب غير موجود',
            'لا يوجد حساب مسجل بهذا الرقم.\\n\\nيمكنك إنشاء حساب جديد.'
          );
        } else if (authError.message.includes('network')) {
          showAlert('error', 'خطأ في الاتصال', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
        } else {
          showAlert('error', 'خطأ في تسجيل الدخول', authError.message || 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
        }
        return;
      }

      // جلب بيانات المستخدم من جدول users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('type', userType)
        .single();

      if (userError || !userData) {
        showAlert('error', 'خطأ', `هذا الحساب غير مسجل كـ${userType === 'student' ? 'طالب' : 'ولي أمر'}`);
        await supabase.auth.signOut();
        return;
      }

      // تسجيل Push Token للطالب
      if (userType === 'student') {
        const { registerForPushNotificationsAsync, savePushToken } = require('../lib/pushNotifications');
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushToken(userData.id, token);
        }
        
        // تحديث updated_at لتفعيل Real-time في ParentHomeScreen
        await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', userData.id);
        
        console.log('✅ Updated student last login timestamp');
        
        // إرسال إشعار دخول لولي الأمر
        const { notifyParentLogin } = require('../lib/notificationService');
        notifyParentLogin(userData.id, userData.name);
      }

      // تسجيل Push Token لولي الأمر
      if (userType === 'parent') {
        const { registerForPushNotificationsAsync, savePushToken } = require('../lib/pushNotifications');
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushToken(userData.id, token);
        }
      }

      // تسجيل الدخول بنجاح
      if (userType === 'parent') {
        // التحقق من وجود طلبات موافقة للطلاب
        const { data: pendingStudents } = await supabase
          .from('users')
          .select('*')
          .eq('parent_phone', userData.phone)
          .eq('approval_status', 'pending')
          .eq('type', 'student');

        if (pendingStudents && pendingStudents.length > 0) {
          navigation.replace('ParentConfirm', { 
            parentName: userData.name,
            studentName: pendingStudents[0].name,
            studentId: pendingStudents[0].id
          });
        } else {
          navigation.replace('ParentHome', { parentName: userData.name });
        }
      } else {
        // طالب - التحقق من حالة الموافقة
        if (userData.approval_status === 'pending') {
          navigation.replace('WaitingApproval');
        } else if (userData.approval_status === 'approved') {
          navigation.replace('Home');
        } else {
          showAlert('error', 'خطأ', 'تم رفض حسابك من قبل ولي الأمر');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Error logging in:', error);
      // معالجة الأخطاء العامة برسائل واضحة
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          showAlert('error', 'خطأ في تسجيل الدخول', 'رقم الهاتف أو كلمة المرور غير صحيحة. الرجاء التحقق من البيانات والمحاولة مرة أخرى.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          showAlert('error', 'خطأ في الاتصال', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى');
        } else {
          showAlert('error', 'خطأ', 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
        }
      } else {
        showAlert('error', 'خطأ', 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.');
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

        {/* الشعار */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/app-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* العنوان */}
        <View style={styles.header}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للدخول في استخدام التطبيق</Text>
        </View>

        {/* عرض نوع المستخدم */}
        <View style={styles.userTypeDisplay}>
          <Text style={styles.userTypeLabel}>
            تسجيل الدخول كـ {userType === 'student' ? '🎓 طالب' : '👨‍👩‍👦 ولي أمر'}
          </Text>
        </View>

        {/* حقل رقم الهاتف */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>رقم الهاتف</Text>
          <View style={styles.phoneInputWrapper}>
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
              placeholder="كلمة المرور"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>
        </View>

        {/* نسيت كلمة المرور */}
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>هل نسيت كلمة المرور؟</Text>
        </TouchableOpacity>

        {/* زر تسجيل الدخول */}
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          activeOpacity={0.7}
          disabled={loading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          )}
        </TouchableOpacity>

        {/* إنشاء حساب */}
        <View style={styles.registerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate(userType === 'parent' ? 'ParentRegister' : 'Register')}>
            <Text style={styles.registerLink}>إنشاء حساب</Text>
          </TouchableOpacity>
          <Text style={styles.registerText}>ليس لديك حساب؟ </Text>
        </View>
      </ScrollView>

        {/* Custom Alert */}
        <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
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
  userTypeDisplay: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  userTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a5f7a',
  },
  userTypeButtonParent: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1a5f7a',
  },
  userTypeButtonActiveParent: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1a5f7a',
    shadowColor: '#1a5f7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userTypeTextActive: {
    color: '#fff',
  },
  userTypeTextParent: {
    color: '#1a5f7a',
  },
  userTypeTextActiveParent: {
    color: '#1a5f7a',
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    height: 56,
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
    height: 56,
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
    lineHeight: 56,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    height: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#90CAF9',
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});
