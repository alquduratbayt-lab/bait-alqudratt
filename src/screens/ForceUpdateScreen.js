import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ForceUpdateScreen({ updateMessage, appStoreUrl, playStoreUrl }) {
  const handleUpdate = () => {
    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening store URL:', err);
      });
    }
  };

  return (
    <LinearGradient
      colors={['#e8f4f8', '#fef3e2', '#e8f4f8']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* الشعار */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/app-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* اسم التطبيق */}
        <Text style={styles.title}>بيت القدرات</Text>
        
        <Text style={styles.updateTitle}>تحديث مطلوب</Text>
        
        <Text style={styles.message}>
          {updateMessage || 'يتوفر إصدار جديد من التطبيق. يرجى التحديث للاستمرار في استخدام التطبيق.'}
        </Text>
        
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>تحديث الآن</Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>
          يجب تحديث التطبيق للحصول على أحدث الميزات وإصلاحات الأمان
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    width: 150,
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 20,
    textAlign: 'center',
  },
  updateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  updateButton: {
    backgroundColor: '#1a5f7a',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#1a5f7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
});
