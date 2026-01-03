import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StarIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" />
  </Svg>
);

const CrownIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M2 20h20v2H2v-2zm1-3l3-7 4 4 4-8 4 8 4-4 3 7H3z" fill="#f59e0b" />
    <Circle cx={12} cy={4} r={2} fill="#f59e0b" />
  </Svg>
);

const RocketIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L4 9l8 3 8-3-8-7z" fill="#3b82f6" />
    <Path d="M12 12v10l-4-3v-4l4-3zm0 0l4 3v4l-4 3V12z" fill="#60a5fa" />
  </Svg>
);

export default function SubscriptionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getTierName = (tier) => {
    const names = {
      free: 'مجاني',
      basic: 'أساسي',
      premium: 'مميز'
    };
    return names[tier] || tier;
  };

  const getTierColor = (tier) => {
    const colors = {
      free: '#9ca3af',
      basic: '#3b82f6',
      premium: '#8b5cf6'
    };
    return colors[tier] || '#3b82f6';
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchCurrentSubscription();
  }, []);

  // إعادة جلب البيانات عند العودة للصفحة
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCurrentSubscription();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, subscription_end, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // التحقق من وجود اشتراك نشط
      if (data && data.subscription_tier !== 'free' && data.subscription_end) {
        const endDate = new Date(data.subscription_end);
        const today = new Date();
        
        // التحقق من أن الاشتراك لم ينتهي
        if (endDate > today && data.subscription_status === 'active') {
          setCurrentSubscription(data);
        }
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const handleSubscribe = (plan) => {
    navigation.navigate('Payment', { plan });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10, color: '#666' }}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الاشتراكات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentSubscription && (
          <View style={[
            styles.currentSubscriptionCard,
            { borderColor: getTierColor(currentSubscription.subscription_tier) }
          ]}>
            <View style={styles.currentHeader}>
              <Text style={styles.currentTitle}>👑 باقتك الحالية</Text>
            </View>
            
            <View style={styles.currentBody}>
              <View style={[
                styles.tierBadge,
                { backgroundColor: getTierColor(currentSubscription.subscription_tier) }
              ]}>
                <Text style={styles.tierBadgeText}>
                  📦 الباقة {getTierName(currentSubscription.subscription_tier)}
                </Text>
              </View>

              <View style={styles.daysContainer}>
                <Text style={styles.daysNumber}>
                  {calculateDaysRemaining(currentSubscription.subscription_end)}
                </Text>
                <Text style={styles.daysLabel}>يوم متبقي</Text>
              </View>

              <View style={styles.expiryContainer}>
                <Text style={styles.expiryLabel}>📅 ينتهي في:</Text>
                <Text style={styles.expiryDate}>
                  {new Date(currentSubscription.subscription_end).toLocaleDateString('ar-SA')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!currentSubscription && (
          <Text style={styles.sectionTitle}>الباقات المتاحة</Text>
        )}

        {!currentSubscription && (
          <View style={styles.plansGrid}>
            {subscriptions.map((plan, index) => {
            const isBasic = index === 0;
            const isPremium = index === 1;
            const isAnnual = index === 2;
            const Icon = isBasic ? RocketIcon : isPremium ? StarIcon : CrownIcon;
            const gradientColors = isBasic 
              ? ['#3b82f6', '#2563eb'] 
              : isPremium 
              ? ['#8b5cf6', '#7c3aed']
              : ['#f59e0b', '#d97706'];
            
            return (
              <View 
                key={plan.id} 
                style={[
                  styles.planCard,
                  currentSubscription?.plan_id === plan.id && styles.planCardActive
                ]}
              >
                <View style={[styles.planHeader, { backgroundColor: gradientColors[0] }]}>
                  <View style={styles.iconContainer}>
                    <Icon />
                  </View>
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>

                <View style={styles.planBody}>
                  <View style={styles.priceSection}>
                    <Text style={styles.price}>{plan.price}</Text>
                    <Text style={styles.currency}>ريال</Text>
                  </View>
                  
                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}

                  <View style={styles.featuresContainer}>
                    {plan.features && plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <CheckIcon />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  {currentSubscription?.subscription_tier === plan.name.toLowerCase() || 
                   (currentSubscription?.subscription_tier === 'basic' && plan.name === 'أساسي') ||
                   (currentSubscription?.subscription_tier === 'premium' && plan.name === 'مميز') ? (
                    <View style={styles.activeButton}>
                      <Text style={styles.activeButtonText}>الباقة الحالية</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.subscribeButton, { backgroundColor: gradientColors[0] }]}
                      onPress={() => handleSubscribe(plan)}
                    >
                      <Text style={styles.subscribeButtonText}>اشترك الآن</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
            })}
          </View>
        )}

        {!currentSubscription && subscriptions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد باقات متاحة حالياً</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
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
    paddingBottom: 20,
  },
  currentSubscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 0,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  currentHeader: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  currentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  currentBody: {
    padding: 20,
  },
  tierBadge: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  tierBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  daysContainer: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  daysNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  daysLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  expiryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  expiryLabel: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
  },
  expiryDate: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  planCardActive: {
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  planHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  planBody: {
    padding: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 16,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  currency: {
    fontSize: 16,
    color: '#666',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
