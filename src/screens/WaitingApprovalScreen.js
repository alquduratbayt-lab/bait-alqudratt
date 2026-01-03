import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

// أيقونة الانتظار
const WaitingIllustration = () => (
  <Svg width={200} height={200} viewBox="0 0 200 200" fill="none">
    {/* الساعة */}
    <Circle cx={100} cy={100} r={60} fill="#e3f2fd" stroke="#2196F3" strokeWidth={4} />
    <Circle cx={100} cy={100} r={50} fill="#fff" />
    
    {/* عقارب الساعة */}
    <Path d="M100 100V60" stroke="#2196F3" strokeWidth={4} strokeLinecap="round" />
    <Path d="M100 100h30" stroke="#2196F3" strokeWidth={3} strokeLinecap="round" />
    <Circle cx={100} cy={100} r={6} fill="#2196F3" />
    
    {/* علامات الساعة */}
    <Circle cx={100} cy={50} r={3} fill="#2196F3" />
    <Circle cx={100} cy={150} r={3} fill="#2196F3" />
    <Circle cx={50} cy={100} r={3} fill="#2196F3" />
    <Circle cx={150} cy={100} r={3} fill="#2196F3" />
    
    {/* الشخص */}
    <Circle cx={60} cy={160} r={15} fill="#ffcc80" />
    <Path d="M60 175v25" stroke="#1a5f7a" strokeWidth={3} strokeLinecap="round" />
    <Path d="M60 185l-10 15" stroke="#1a5f7a" strokeWidth={3} strokeLinecap="round" />
    <Path d="M60 185l10 15" stroke="#1a5f7a" strokeWidth={3} strokeLinecap="round" />
    <Path d="M60 180l-15-10" stroke="#1a5f7a" strokeWidth={3} strokeLinecap="round" />
    <Path d="M60 180l15-10" stroke="#1a5f7a" strokeWidth={3} strokeLinecap="round" />
  </Svg>
);

export default function WaitingApprovalScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newParentPhone, setNewParentPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkApprovalStatus();
    
    // التحقق من حالة الموافقة كل 5 ثواني
    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      const { data: userInfo } = await supabase
        .from('users')
        .select('name, approval_status, parent_phone')
        .eq('id', user.id)
        .single();

      setUserData(userInfo);

      // إذا تمت الموافقة، انتقل للصفحة الرئيسية
      if (userInfo?.approval_status === 'approved') {
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // مسح الـ navigation stack والتوجيه إلى صفحة اختيار نوع المستخدم
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      // حتى في حالة الخطأ، نوجه المستخدم إلى صفحة اختيار نوع المستخدم
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserTypeSelection' }],
      });
    }
  };

  const handleEditParentPhone = () => {
    setNewParentPhone(userData?.parent_phone?.replace('+966', '') || '');
    setShowEditModal(true);
  };

  const handleSaveParentPhone = async () => {
    if (!newParentPhone || newParentPhone.length !== 9) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم هاتف صحيح (9 أرقام)');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          parent_phone: `+966${newParentPhone}`
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('نجح', 'تم تحديث رقم ولي الأمر بنجاح');
      setShowEditModal(false);
      checkApprovalStatus();
    } catch (error) {
      console.error('Error updating parent phone:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الرقم');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* الهيدر */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>مرحباً</Text>
        <Text style={styles.studentName}>{userData?.name || 'الطالب'}</Text>
      </LinearGradient>

      {/* المحتوى */}
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <WaitingIllustration />
        </View>

        <Text style={styles.title}>في انتظار موافقة ولي الأمر</Text>
        
        <Text style={styles.description}>
          تم إنشاء حسابك بنجاح!{'\n'}
          {userData?.parent_phone && `تم إرسال طلب موافقة إلى ولي الأمر على الرقم ${userData.parent_phone}`}
          {'\n\n'}
          سيتم تفعيل حسابك فور موافقة ولي الأمر
        </Text>

        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>جاري الانتظار...</Text>
        </View>

        <TouchableOpacity style={styles.editPhoneButton} onPress={handleEditParentPhone}>
          <Text style={styles.editPhoneButtonText}>تعديل رقم ولي الأمر</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      {/* مودال تعديل رقم ولي الأمر */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تعديل رقم ولي الأمر</Text>
            
            <Text style={styles.modalLabel}>رقم الهاتف الجديد</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+966</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="5XXXXXXXX"
                placeholderTextColor="#999"
                value={newParentPhone}
                onChangeText={setNewParentPhone}
                keyboardType="phone-pad"
                maxLength={9}
                textAlign="right"
              />
            </View>

            <Text style={styles.modalNote}>
              تأكد من إدخال الرقم الصحيح لولي الأمر
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowEditModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, saving && { opacity: 0.6 }]} 
                onPress={handleSaveParentPhone}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>حفظ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  studentName: {
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 30,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffc107',
    marginLeft: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  editPhoneButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
  },
  editPhoneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
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
  modalNote: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
