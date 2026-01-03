import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getUserPoints, redeemReward } from '../lib/pointsService';

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function RewardsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(null);
  const [redeeming, setRedeeming] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // جلب رصيد النقاط
      const points = await getUserPoints(user.id);
      setUserPoints(points);

      // جلب الجوائز النشطة
      const { data: rewardsData, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('order_number');

      if (error) throw error;
      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (reward) => {
    if (!userPoints || userPoints.available_points < reward.points_required) {
      Alert.alert('نقاط غير كافية', 'ليس لديك نقاط كافية لاستبدال هذه الجائزة');
      return;
    }

    Alert.alert(
      'تأكيد الاستبدال',
      `هل تريد استبدال ${reward.points_required} نقطة للحصول على:\n${reward.title}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              setRedeeming(reward.id);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const result = await redeemReward(user.id, reward.id, reward.points_required);

              if (result.success) {
                Alert.alert(
                  '🎉 تم الاستبدال بنجاح!',
                  'سيتم التواصل معك قريباً لتسليم الجائزة',
                  [{ text: 'رائع!', onPress: () => fetchData() }]
                );
              } else {
                Alert.alert('خطأ', result.error || 'حدث خطأ أثناء استبدال الجائزة');
              }
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء استبدال الجائزة');
            } finally {
              setRedeeming(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الجوائز</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* بطاقة النقاط المتاحة */}
      <View style={styles.pointsBanner}>
        <Text style={styles.pointsBannerLabel}>نقاطك المتاحة</Text>
        <Text style={styles.pointsBannerValue}>{userPoints?.available_points || 0} نقطة</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {rewards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لا توجد جوائز متاحة حالياً</Text>
            <Text style={styles.emptySubtext}>تابع معنا لمعرفة الجوائز الجديدة!</Text>
          </View>
        ) : (
          rewards.map((reward) => {
            const canRedeem = userPoints && userPoints.available_points >= reward.points_required;
            const isRedeeming = redeeming === reward.id;

            return (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardImageContainer}>
                  {reward.image_url ? (
                    <Image
                      source={{ uri: reward.image_url }}
                      style={styles.rewardImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.rewardImagePlaceholder}>
                      <Text style={styles.placeholderText}>🎁</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  {reward.description && (
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  )}
                  
                  <View style={styles.rewardFooter}>
                    <TouchableOpacity
                      style={[
                        styles.redeemButton,
                        !canRedeem && styles.redeemButtonDisabled,
                        isRedeeming && styles.redeemButtonLoading
                      ]}
                      onPress={() => handleRedeemReward(reward)}
                      disabled={!canRedeem || isRedeeming}
                    >
                      {isRedeeming ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.redeemButtonText}>
                          {canRedeem ? 'استبدل الآن' : 'نقاط غير كافية'}
                        </Text>
                      )}
                    </TouchableOpacity>
                    
                    <View style={styles.pointsRequired}>
                      <Text style={styles.pointsRequiredText}>{reward.points_required}</Text>
                      <Text style={styles.pointsRequiredLabel}>نقطة</Text>
                    </View>
                  </View>

                  {reward.stock_quantity !== null && (
                    <Text style={styles.stockText}>
                      الكمية المتبقية: {reward.stock_quantity}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  pointsBanner: {
    backgroundColor: '#f59e0b',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pointsBannerLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  pointsBannerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rewardImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardImage: {
    width: '100%',
    height: 180,
  },
  rewardImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 60,
  },
  rewardInfo: {
    padding: 16,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redeemButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    marginRight: 12,
  },
  redeemButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  redeemButtonLoading: {
    backgroundColor: '#60a5fa',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pointsRequired: {
    alignItems: 'center',
  },
  pointsRequiredText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  pointsRequiredLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  stockText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 8,
  },
});
