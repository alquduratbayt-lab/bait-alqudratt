import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getUserPoints } from '../lib/pointsService';

// أيقونة السهم للخلف
const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// أيقونة البطاقة
const CardIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={5} width={20} height={14} rx={2} stroke="#fff" strokeWidth={2} />
    <Path d="M2 10h20" stroke="#fff" strokeWidth={2} />
  </Svg>
);

export default function PointsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }, [])
  );

  useEffect(() => {
    fetchUserPoints();
  }, []);

  const fetchUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // جلب رصيد النقاط
      const points = await getUserPoints(user.id);
      setUserPoints(points);

      // جلب تاريخ النقاط
      const { data: history, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPointsHistory(history || []);
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getActionLabel = (actionType) => {
    const labels = {
      'lesson_completion': '✅ إكمال درس',
      'subject_completion': '🎓 إكمال منهج',
      'exam_completion': '📝 امتحان نهائي',
      'reward_redemption': '🎁 استبدال جائزة',
    };
    return labels[actionType] || actionType;
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
        <Text style={styles.headerTitle}>النقاط</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* بطاقة النقاط */}
        <View style={styles.pointsCard}>
          <View style={styles.cardIconContainer}>
            <CardIcon />
          </View>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>نقاطك المتاحة</Text>
            <View style={styles.pointsValueRow}>
              <Text style={styles.pointsUnit}>نقطة</Text>
              <Text style={styles.pointsValue}>{userPoints?.available_points || 0}</Text>
            </View>
            <Text style={styles.totalPointsLabel}>
              إجمالي النقاط: {userPoints?.total_points || 0}
            </Text>
          </View>
        </View>

        {/* زر الجوائز */}
        <TouchableOpacity 
          style={styles.rewardsButton}
          onPress={() => navigation.navigate('Rewards')}
        >
          <Text style={styles.rewardsButtonText}>🎁 استبدل نقاطك بجوائز</Text>
        </TouchableOpacity>

        {/* تاريخ النقاط */}
        <Text style={styles.sectionTitle}>تاريخ النقاط</Text>
        
        {pointsHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لا يوجد تاريخ نقاط بعد</Text>
            <Text style={styles.emptySubtext}>ابدأ بإكمال الدروس والامتحانات لكسب النقاط!</Text>
          </View>
        ) : (
          pointsHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={[styles.historyPoints, item.points > 0 ? styles.positivePoints : styles.negativePoints]}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </Text>
                <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAction}>{getActionLabel(item.action_type)}</Text>
                {item.description && (
                  <Text style={styles.historyDescription}>{item.description}</Text>
                )}
              </View>
            </View>
          ))
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pointsCard: {
    backgroundColor: '#1a5f7a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsInfo: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  pointsValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pointsValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  totalPointsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
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
  rewardsButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f4fc',
  },
  historyLeft: {
    alignItems: 'center',
    minWidth: 60,
  },
  historyPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  positivePoints: {
    color: '#10b981',
  },
  negativePoints: {
    color: '#ef4444',
  },
  historyDate: {
    fontSize: 11,
    color: '#999',
  },
  historyRight: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  historyAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a5f7a',
    textAlign: 'right',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f4fc',
  },
  taskLeft: {
    alignItems: 'center',
  },
  taskProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f7a',
  },
  taskRight: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a5f7a',
    textAlign: 'right',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  taskPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskPoints: {
    fontSize: 14,
    color: '#666',
  },
  collectButton: {
    backgroundColor: '#e8f4fc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collectButtonText: {
    fontSize: 12,
    color: '#1a5f7a',
    fontWeight: '500',
  },
});
