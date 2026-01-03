import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// أيقونة الشخص مع القائمة
const ConfirmIllustration = () => (
  <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
    {/* القائمة/الكليب بورد */}
    <Rect x={30} y={40} width={90} height={120} rx={8} fill="#e3f2fd" stroke="#90caf9" strokeWidth={2} />
    <Rect x={55} y={30} width={40} height={20} rx={4} fill="#90caf9" />
    <Circle cx={75} cy={40} r={6} fill="#fff" />
    
    {/* علامات الصح */}
    <Circle cx={50} cy={70} r={10} fill="#4caf50" />
    <Path d="M45 70l4 4 8-8" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    
    <Circle cx={50} cy={100} r={10} fill="#4caf50" />
    <Path d="M45 100l4 4 8-8" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    
    <Circle cx={50} cy={130} r={10} fill="#e0e0e0" />
    
    {/* الخطوط */}
    <Path d="M70 70h40" stroke="#90caf9" strokeWidth={3} strokeLinecap="round" />
    <Path d="M70 100h40" stroke="#90caf9" strokeWidth={3} strokeLinecap="round" />
    <Path d="M70 130h40" stroke="#e0e0e0" strokeWidth={3} strokeLinecap="round" />
    
    {/* الشخص */}
    <Circle cx={150} cy={60} r={20} fill="#ffcc80" />
    <Path d="M150 80v40" stroke="#1a5f7a" strokeWidth={4} strokeLinecap="round" />
    <Path d="M150 90l-20 20" stroke="#1a5f7a" strokeWidth={4} strokeLinecap="round" />
    <Path d="M150 90l25-15" stroke="#1a5f7a" strokeWidth={4} strokeLinecap="round" />
    <Path d="M150 120l-15 30" stroke="#1a5f7a" strokeWidth={4} strokeLinecap="round" />
    <Path d="M150 120l15 30" stroke="#1a5f7a" strokeWidth={4} strokeLinecap="round" />
    
    {/* القلم */}
    <Rect x={165} y={55} width={6} height={35} rx={2} fill="#f59e0b" transform="rotate(30 165 55)" />
    <Path d="M175 85l5 10" stroke="#333" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default function ParentConfirmScreen({ navigation, route }) {
  const parentName = route?.params?.parentName || 'استاذ محمد احمد';
  const studentName = route?.params?.studentName || 'عبد الرحمن محمد';
  const studentId = route?.params?.studentId;
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!studentId) {
      Alert.alert('خطأ', 'لم يتم العثور على بيانات الطالب');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      // تحديث حالة الموافقة والربط بولي الأمر
      const { error } = await supabase
        .from('users')
        .update({
          approval_status: 'approved',
          parent_id: user.id,
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', studentId);

      if (error) throw error;

      Alert.alert('نجح', 'تمت الموافقة على حساب الطالب بنجاح', [
        {
          text: 'حسناً',
          onPress: () => navigation.replace('ParentHome', { parentName })
        }
      ]);
    } catch (error) {
      console.error('Error approving student:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الموافقة');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!studentId) return;

    Alert.alert(
      'تأكيد الرفض',
      'هل أنت متأكد من رفض حساب الطالب؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('users')
                .update({
                  approval_status: 'rejected'
                })
                .eq('id', studentId);

              if (error) throw error;

              Alert.alert('تم', 'تم رفض حساب الطالب', [
                {
                  text: 'حسناً',
                  onPress: () => navigation.replace('ParentHome', { parentName })
                }
              ]);
            } catch (error) {
              console.error('Error rejecting student:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء الرفض');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* الهيدر الأزرق */}
      <LinearGradient
        colors={['#1a5f7a', '#2d7d9a']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>اهلاً وسهلاً</Text>
        <Text style={styles.parentName}>{parentName}</Text>
      </LinearGradient>

      {/* المحتوى */}
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <ConfirmIllustration />
        </View>

        <Text style={styles.title}>في انتظار تأكيدك لربط حساب ابنك</Text>
        
        <Text style={styles.description}>
          تم إنشاء حساب من قبل الطالب {studentName} باستخدام رقم هاتفك{'\n'}
          للتمكن من متابعة نشاطه الدراسي، يجب تأكيد أنت ولي أمره
        </Text>

        <TouchableOpacity 
          style={[styles.confirmButton, loading && { opacity: 0.6 }]} 
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1a5f7a" />
          ) : (
            <Text style={styles.confirmButtonText}>تأكيد حساب الطالب</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.rejectButton, loading && { opacity: 0.6 }]} 
          onPress={handleReject}
          disabled={loading}
        >
          <Text style={styles.rejectButtonText}>رفض الحساب</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  parentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    alignItems: 'center',
  },
  illustrationContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  confirmButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f7a',
  },
  rejectButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
});
