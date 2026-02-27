import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📲</Text>
        </View>
        
        <Text style={styles.title}>تحديث مطلوب</Text>
        
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#2196F3',
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
