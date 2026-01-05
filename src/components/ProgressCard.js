import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const ChartIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3v18h18" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 17l-5-5-4 4-6-6" stroke="#2196F3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={18} cy={17} r={2} fill="#2196F3" />
  </Svg>
);

const ProgressCard = ({ data, onViewDetails }) => {
  const progressPercentage = (data.completedLessons / data.totalLessons) * 100;

  const getTierLabel = (tier) => {
    const labels = {
      free: 'مجاني',
      basic: 'أساسي',
      premium: 'مميز'
    };
    return labels[tier] || tier;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ChartIcon />
        <Text style={styles.cardTitle}>تقرير تقدمك</Text>
      </View>

      <View style={styles.cardBody}>
        {/* الدروس المكتملة */}
        <View style={styles.statSection}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>الدروس المكتملة</Text>
            <Text style={styles.statValue}>
              {data.completedLessons}/{data.totalLessons}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.percentageText}>{Math.round(progressPercentage)}%</Text>
        </View>

        {/* معدل الاختبارات */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>معدل الاختبارات</Text>
          <Text style={[styles.statValue, { color: getScoreColor(data.averageScore) }]}>
            {data.averageScore}%
          </Text>
        </View>

        {/* النقاط */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>النقاط المكتسبة</Text>
          <Text style={styles.statValue}>⭐ {data.totalPoints}</Text>
        </View>

        {/* عدد الاختبارات */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>الاختبارات المحلولة</Text>
          <Text style={styles.statValue}>{data.totalTests} اختبار</Text>
        </View>
      </View>

      {onViewDetails && (
        <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
          <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardBody: {
    gap: 16,
  },
  statSection: {
    marginBottom: 8,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  detailsButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProgressCard;
