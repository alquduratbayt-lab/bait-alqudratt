import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ProfileCardSkeleton } from '../components/SkeletonLoader';

// صورة افتراضية للطالب
const StudentAvatar = ({ color }) => (
  <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
    <Circle cx={30} cy={30} r={30} fill={color || '#e0e7ff'} />
    <Circle cx={30} cy={24} r={12} fill="#6366f1" />
    <Path d="M12 55c0-10 8-18 18-18s18 8 18 18" fill="#6366f1" />
  </Svg>
);

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة متصل حالياً (نقطة خضراء)
const OnlineIndicator = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Circle cx={6} cy={6} r={5} fill="#22c55e" />
    <Circle cx={6} cy={6} r={3} fill="#fff" opacity={0.3} />
  </Svg>
);

const avatarColors = ['#e3f2fd', '#fef3c7', '#fce7f3', '#e0f2fe', '#f3e8ff', '#fef9c3'];

export default function ParentChildrenScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [parentData, setParentData] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  // Real-time subscription لمراقبة طلبات الموافقة الجديدة
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // الاشتراك في تغييرات جدول users للطلاب المرتبطين بولي الأمر
      const subscription = supabase
        .channel('parent-children-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'users',
            filter: `parent_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time children update received:', payload);
            // إعادة جلب البيانات عند أي تغيير
            fetchChildren();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupRealtimeSubscription();
  }, []);

  const fetchChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      // جلب البيانات بشكل متوازي (أسرع!)
      const [parent, students, pending] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            return data;
          }),
        supabase
          .from('users')
          .select('*')
          .eq('parent_id', user.id)
          .eq('type', 'student')
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: true })
          .then(({ data, error }) => {
            if (error) throw error;
            return data;
          }),
        supabase
          .from('users')
          .select('*')
          .eq('parent_id', user.id)
          .eq('type', 'student')
          .eq('approval_status', 'pending')
          .then(({ data, error }) => {
            if (error) throw error;
            return data;
          })
      ]);

      setParentData(parent);

      console.log('✅ الأبناء الموافق عليهم:', students?.length || 0);
      console.log('⏳ طلبات الموافقة المعلقة:', pending?.length || 0);

      setChildren(students || []);
      setPendingRequests(pending || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (childId) => {
    try {
      setProcessingId(childId);
      
      const { error } = await supabase
        .from('users')
        .update({ approval_status: 'approved' })
        .eq('id', childId);

      if (error) throw error;

      console.log('✅ تمت الموافقة على الطالب:', childId);
      
      // إعادة جلب البيانات
      await fetchChildren();
    } catch (error) {
      console.error('Error approving student:', error);
      alert('حدث خطأ أثناء الموافقة على الطالب');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (childId) => {
    try {
      setProcessingId(childId);
      
      const { error } = await supabase
        .from('users')
        .update({ approval_status: 'rejected' })
        .eq('id', childId);

      if (error) throw error;

      console.log('❌ تم رفض الطالب:', childId);
      
      // إعادة جلب البيانات
      await fetchChildren();
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('حدث خطأ أثناء رفض الطالب');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSelectChild = async (child) => {
    try {
      // حفظ الابن المختار في AsyncStorage
      await AsyncStorage.setItem('selectedChildId', child.id);
      
      // الانتقال للصفحة الرئيسية
      navigation.replace('ParentHome', { 
        selectedChildId: child.id,
        parentName: parentData?.name 
      });
    } catch (error) {
      console.error('Error saving selected child:', error);
    }
  };

  const renderChild = ({ item, index }) => {
    const avatarColor = avatarColors[index % avatarColors.length];
    
    // التحقق من أن الطالب متصل حالياً (نشط خلال آخر 5 دقائق)
    const isOnline = item.updated_at ? 
      (new Date() - new Date(item.updated_at)) < 5 * 60 * 1000 : false;
    
    const lastLogin = item.updated_at 
      ? `آخر نشاط: ${new Date(item.updated_at).toLocaleDateString('ar-SA')}`
      : 'لم يسجل دخول بعد';

    return (
      <TouchableOpacity 
        style={styles.childCard}
        onPress={() => handleSelectChild(item)}
      >
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{item.name}</Text>
          <View style={styles.lastLoginContainer}>
            {isOnline && (
              <View style={styles.onlineIndicator}>
                <OnlineIndicator />
              </View>
            )}
            <Text style={[styles.childLastLogin, isOnline && styles.onlineText]}>
              {isOnline ? 'متصل حالياً' : lastLogin}
            </Text>
          </View>
          {item.subscription_tier && item.subscription_tier !== 'free' && (
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                {item.subscription_tier === 'basic' ? '📦 باقة أساسية' : '👑 باقة مميزة'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.avatarContainer}>
          <StudentAvatar color={avatarColor} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={['#1a5f7a', '#159895']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>الأبناء</Text>
          </View>
        </LinearGradient>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Children Cards Skeleton */}
          {[1, 2].map((i) => (
            <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
              <View style={{ flex: 1 }}>
                <View style={{ width: 120, height: 20, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: 150, height: 14, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
              </View>
              <View style={{ width: 60, height: 60, backgroundColor: '#e0e0e0', borderRadius: 30 }} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* الهيدر */}
      <LinearGradient
        colors={['#1a5f7a', '#2d7d9a']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>أبنائي</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.welcomeText}>اهلاً وسهلاً</Text>
        <Text style={styles.parentName}>{parentData?.name || 'ولي الأمر'}</Text>
      </LinearGradient>

      {/* المحتوى */}
      <View style={styles.content}>
        {/* طلبات الموافقة */}
        {pendingRequests.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>طلبات الموافقة ({pendingRequests.length})</Text>
            {pendingRequests.map((request, index) => (
              <View key={request.id} style={styles.pendingCard}>
                <View style={styles.pendingInfo}>
                  <StudentAvatar color={avatarColors[index % avatarColors.length]} />
                  <View style={styles.pendingDetails}>
                    <Text style={styles.pendingName}>{request.name}</Text>
                    <Text style={styles.pendingPhone}>{request.phone}</Text>
                    <Text style={styles.pendingDate}>
                      {new Date(request.created_at).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={[styles.approveButton, processingId === request.id && styles.disabledButton]}
                    onPress={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                  >
                    <Text style={styles.approveButtonText}>
                      {processingId === request.id ? '...' : '✓ موافقة'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, processingId === request.id && styles.disabledButton]}
                    onPress={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                  >
                    <Text style={styles.rejectButtonText}>
                      {processingId === request.id ? '...' : '✕ رفض'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.title}>اختر أحد أبنائك</Text>

        {children.length === 0 && pendingRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا يوجد أبناء مسجلين</Text>
            <Text style={styles.emptySubText}>يمكن للطلاب التسجيل باستخدام رقم هاتفك</Text>
          </View>
        ) : (
          <FlatList
            data={children}
            renderItem={renderChild}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.childrenList}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    color: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  parentName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5f7a',
    textAlign: 'center',
    marginBottom: 30,
  },
  childrenList: {
    paddingBottom: 20,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  childInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineIndicator: {
    marginRight: 4,
  },
  childLastLogin: {
    fontSize: 13,
    color: '#999',
  },
  onlineText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  subscriptionBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  subscriptionText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  pendingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 12,
  },
  pendingCard: {
    backgroundColor: '#fff5e6',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ffa726',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingDetails: {
    marginLeft: 12,
    flex: 1,
  },
  pendingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f7a',
    marginBottom: 4,
  },
  pendingPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pendingDate: {
    fontSize: 12,
    color: '#999',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
