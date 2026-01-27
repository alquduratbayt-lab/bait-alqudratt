import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getUserSubscription } from '../lib/subscriptionService';
import CustomAlert from '../components/CustomAlert';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const VideoIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#2196F3" strokeWidth={2} fill="#e3f2fd" />
    <Path d="M10 8l6 4-6 4V8z" fill="#2196F3" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#666" strokeWidth={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke="#666" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#666" strokeWidth={2} />
    <Path d="M12 6v6l4 2" stroke="#666" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    checkAccess();
    fetchSettings();
    fetchSessions();
  }, []);

  const checkAccess = async () => {
    try {
      const subscription = await getUserSubscription();
      const { data: settingsData } = await supabase
        .from('training_page_settings')
        .select('*')
        .single();

      if (!settingsData || !settingsData.is_enabled) {
        setHasAccess(false);
        setAlertVisible(true);
        setLoading(false);
        return;
      }

      const userTier = subscription?.subscription_tier || 'free';
      const allowed = settingsData.allowed_subscriptions || ['premium'];
      
      if (allowed.includes(userTier)) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('training_page_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*, subjects(name)')
        .eq('is_active', true)
        .gte('session_date', new Date().toISOString())
        .order('session_date');

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleJoinSession = async (session) => {
    if (session.zoom_link) {
      await Linking.openURL(session.zoom_link);
    } else {
      alert('الرابط غير متوفر حالياً');
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
      <StatusBar style="dark" />
      
      <CustomAlert
        visible={alertVisible}
        type="warning"
        title="اشترك للوصول"
        message="التدريب المباشر متاح فقط للمشتركين في الباقة المميزة. للاشتراك، قم بزيارة موقعنا: bait-alqudratt.com"
        buttons={[
          { text: 'حسناً', onPress: () => {
            setAlertVisible(false);
            navigation.goBack();
          }}
        ]}
        onClose={() => {
          setAlertVisible(false);
          navigation.goBack();
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{settings?.title || 'التدريب المباشر'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settings?.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{settings.description}</Text>
          </View>
        )}

        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <VideoIcon />
            <Text style={styles.emptyTitle}>لا توجد حصص مباشرة حالياً</Text>
            <Text style={styles.emptySubtitle}>سيتم إضافة جداول الحصص قريباً</Text>
          </View>
        ) : (
          <View style={styles.sessionsContainer}>
            <Text style={styles.sectionTitle}>الحصص القادمة</Text>
            {sessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTeacher}>{session.teacher_name}</Text>
                  <Text style={styles.sessionSubject}>{session.subjects?.name}</Text>
                </View>

                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetailRow}>
                    <Text style={styles.sessionDetailText}>
                      {new Date(session.session_date).toLocaleDateString('ar-SA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                    <CalendarIcon />
                  </View>

                  <View style={styles.sessionDetailRow}>
                    <Text style={styles.sessionDetailText}>
                      {new Date(session.session_date).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {session.duration_minutes} دقيقة
                    </Text>
                    <ClockIcon />
                  </View>
                </View>

                <View style={styles.sessionFooter}>
                  <Text style={styles.sessionSeats}>
                    {session.max_students - session.enrolled_count} مقعد متبقي
                  </Text>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => handleJoinSession(session)}
                  >
                    <Text style={styles.joinButtonText}>انضم الآن</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 20,
  },
  descriptionCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  sessionsContainer: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionTeacher: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionSubject: {
    fontSize: 14,
    color: '#2196F3',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#666',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sessionSeats: {
    fontSize: 13,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
