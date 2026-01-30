import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// صورة المستخدم الافتراضية
const UserAvatar = () => (
  <Svg width={100} height={100} viewBox="0 0 100 100" fill="none">
    <Circle cx={50} cy={50} r={48} fill="#e5e7eb" stroke="#0ea5e9" strokeWidth={3} />
    <Circle cx={50} cy={38} r={18} fill="#9ca3af" />
    <Path d="M20 85c0-16 13-29 30-29s30 13 30 29" fill="#9ca3af" />
  </Svg>
);

// أيقونة إخفاء/إظهار كلمة المرور
const EyeOffIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1 1l22 22" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function ParentEditProfileScreen({ navigation, route }) {
  const parentName = route?.params?.parentName || 'محمد احمد';
  const [name, setName] = useState(parentName);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // تغيير صورة الملف الشخصي
  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['إلغاء', 'التقاط صورة', 'اختيار من المعرض'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await openCamera();
          } else if (buttonIndex === 2) {
            await openGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'تغيير الصورة',
        'اختر مصدر الصورة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'الكاميرا', onPress: openCamera },
          { text: 'المعرض', onPress: openGallery },
        ]
      );
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('صلاحية مطلوبة', 'نحتاج صلاحية الكاميرا لالتقاط صورة');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('صلاحية مطلوبة', 'نحتاج صلاحية الوصول للصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    console.log('Saving:', { name, phone, password });
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* صورة المستخدم */}
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <UserAvatar />
          )}
          <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingImage}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 12 }} />
            ) : (
              <Text style={styles.changePhotoText}>تغيير الصورة</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* حقول الإدخال */}
        <View style={styles.formContainer}>
          {/* الاسم */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الاسم</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              textAlign="right"
              placeholder="أدخل الاسم"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* رقم الهاتف */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الهاتف</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              textAlign="right"
              placeholder="أدخل رقم الهاتف"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          {/* كلمة المرور */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>كلمه المرور</Text>
            <View style={styles.passwordContainer}>
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <EyeOffIcon />
              </TouchableOpacity>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                textAlign="right"
                secureTextEntry={!showPassword}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        </View>

        {/* زر حفظ التغييرات */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>حفظ التغيرات</Text>
        </TouchableOpacity>
      </ScrollView>
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
    color: '#1e3a5f',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#0ea5e9',
    marginTop: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#0ea5e9',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1e3a5f',
    textAlign: 'right',
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e3a5f',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e3a5f',
  },
  eyeButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
