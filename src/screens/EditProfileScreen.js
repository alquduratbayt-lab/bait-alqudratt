import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FormFieldSkeleton } from '../components/SkeletonLoader';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

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

// أيقونة المستخدم (صورة افتراضية)
const UserAvatar = ({ imageUri }) => {
  console.log('UserAvatar imageUri:', imageUri);
  
  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: 100, height: 100, borderRadius: 50 }}
        onError={(error) => console.error('Image load error:', error.nativeEvent.error)}
        onLoad={() => console.log('Image loaded successfully')}
      />
    );
  }
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={50} fill="#e0e7ff" />
      <Circle cx={50} cy={40} r={18} fill="#6366f1" />
      <Path d="M18 88c0-18 14-32 32-32s32 14 32 32" fill="#6366f1" />
    </Svg>
  );
};

// أيقونة الكاميرا
const CameraIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke="#fff"
      strokeWidth={2}
      fill="#2196F3"
    />
    <Circle cx={12} cy={13} r={4} stroke="#fff" strokeWidth={2} />
  </Svg>
);

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [password, setPassword] = useState('********');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      setUserId(user.id);
      setEmail(user.email);

      const { fetchWithCache } = require('../lib/cacheService');

      // جلب بيانات المستخدم من جدول users مع Cache
      const userInfo = await fetchWithCache(
        `user_edit_profile_${user.id}`,
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (error) throw error;
          return data;
        },
        1 * 60 * 1000 // 1 دقيقة للتعديل
      );

      if (userInfo) {
        console.log('User Info:', userInfo);
        console.log('Parent Phone:', userInfo.parent_phone);
        setName(userInfo.name || '');
        setPhone(userInfo.phone || '');
        setParentPhone(userInfo.parent_phone || '');
        setProfileImage(userInfo.profile_image || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'نحتاج إلى إذن الوصول للصور');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadImage = async (uri) => {
    try {
      // قراءة الملف كـ base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // تحويل base64 إلى ArrayBuffer
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      console.log('Uploading to path:', filePath);
      console.log('File size:', byteArray.length, 'bytes');

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, byteArray, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      console.log('Public URL:', publicUrl);

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfileImage(publicUrl);
      console.log('Profile image updated successfully');
      console.log('New profileImage state:', publicUrl);
      
      // إعادة تحميل بيانات المستخدم للتأكد من التحديث
      await fetchUserData();
      
      Alert.alert('نجح', 'تم تحديث الصورة بنجاح');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال الاسم');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          parent_phone: parentPhone.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('نجح', 'تم حفظ التغييرات بنجاح', [
        { text: 'حسناً', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('تنبيه', 'الرجاء ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      // التحقق من كلمة المرور الحالية
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      });

      if (signInError) {
        Alert.alert('خطأ', 'كلمة المرور الحالية غير صحيحة');
        return;
      }

      // تحديث كلمة المرور
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      Alert.alert('نجح', 'تم تغيير كلمة المرور بنجاح');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تغيير كلمة المرور');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
          </View>
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التفاصيل الشخصية</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* صورة المستخدم */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <UserAvatar imageUri={profileImage} />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CameraIcon />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* حقل الاسم */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>الاسم</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="أدخل الاسم"
              placeholderTextColor="#999"
              textAlign="right"
            />
          </View>
        </View>


        {/* حقل رقم الهاتف */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>رقم الهاتف</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+966</Text>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>
        </View>

        {/* حقل رقم ولي الأمر */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>رقم ولي الأمر</Text>
          <View style={styles.phoneInputWrapper}>
            <Text style={styles.countryCode}>+966</Text>
            <TextInput
              style={styles.phoneInput}
              value={parentPhone}
              onChangeText={setParentPhone}
              placeholder="أدخل رقم ولي الأمر"
              placeholderTextColor="#999"
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
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>
        </View>

        {/* رابط تغيير كلمة المرور */}
        <TouchableOpacity style={styles.changePasswordLink} onPress={handleChangePassword}>
          <Text style={styles.changePasswordText}>تغيير كلمة المرور</Text>
        </TouchableOpacity>

        {/* زر حفظ التغييرات */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.6 }]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* مودال تغيير كلمة المرور */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>كلمة المرور الحالية</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="أدخل كلمة المرور الحالية"
                placeholderTextColor="#999"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>كلمة المرور الجديدة</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="أدخل كلمة المرور الجديدة"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInputLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={handleSavePassword}
              >
                <Text style={styles.modalSaveText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
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
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
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
    backgroundColor: '#ebebeb',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    height: '100%',
  },
  changePasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  changePasswordText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 24,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
