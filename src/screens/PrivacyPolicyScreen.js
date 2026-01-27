import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from '@react-navigation/native';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function PrivacyPolicyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsOfUse, setTermsOfUse] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['privacy_policy', 'terms_of_use']);

      if (error) throw error;

      if (data) {
        const privacy = data.find(s => s.setting_key === 'privacy_policy');
        const terms = data.find(s => s.setting_key === 'terms_of_use');
        
        setPrivacyPolicy(privacy?.setting_value || 'لم يتم إضافة سياسة الخصوصية بعد.');
        setTermsOfUse(terms?.setting_value || 'لم يتم إضافة شروط الاستخدام بعد.');
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      setPrivacyPolicy('حدث خطأ في تحميل سياسة الخصوصية.');
      setTermsOfUse('حدث خطأ في تحميل شروط الاستخدام.');
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>سياسة الخصوصية</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5f7a" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سياسة الخصوصية والاستخدام</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* سياسة الخصوصية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سياسة الخصوصية</Text>
          <Text style={styles.sectionContent}>{privacyPolicy}</Text>
        </View>

        {/* شروط الاستخدام */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>شروط الاستخدام</Text>
          <Text style={styles.sectionContent}>{termsOfUse}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8f4fc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 26,
    textAlign: 'right',
  },
});
